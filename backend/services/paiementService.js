const { Op } = require('sequelize');
const PaiementPart = require('../models/PaiementPart');
const Commande = require('../models/Commande');
const CommandeProduit = require('../models/CommandeProduit');
const Produit = require('../models/Produit');
const Reservation = require('../models/Reservation');
const BonIntervention = require('../models/BonIntervention');
const Fournisseur = require('../models/Fournisseur');
const Solde = require('../models/Solde');
const Facture = require('../models/Facture');
const PF = require('./portefeuilleService');

const TAUX_BOUTIQUE = Number(process.env.COMMISSION_BOUTIQUE ?? 3);       // % sur les ventes boutique
const TAUX_MISSION_DEFAUT = Number(process.env.COMMISSION_MISSION ?? 10);  // seulement si le bon n'a pas de taux figé
const MODES_DIRECTS = ['direct_prestataire', 'especes'];                   // le prestataire encaisse lui-même
const arrondi = (n) => Math.round(Number(n) || 0);
const fmt = (n) => Number(n).toLocaleString('fr-FR') + ' FCFA';

const { ErreurPaiement } = PF; // même classe d'erreur partout

// ═══════════════════════════════════════════════════════════
// COMMANDES : lignes (prix figés) et ventilation par fournisseur
// ═══════════════════════════════════════════════════════════
async function chargerLignes(commandeId, t) {
    const items = await CommandeProduit.findAll({
        where: { commandeId },
        include: [{ model: Produit, as: 'produitCommandeProduit', attributes: ['id', 'nom', 'prix', 'fournisseurId'], required: false }],
        transaction: t
    });
    return items.map((i) => {
        const prod = i.produitCommandeProduit;
        const prix = Number(i.prixUnitaire ?? prod?.prix ?? 0);
        return {
            id: i.id,
            nom: i.nomProduit || prod?.nom || `Produit #${i.produitId}`,
            quantite: i.quantite,
            fournisseurId: i.fournisseurId ?? prod?.fournisseurId ?? null,
            sousTotal: arrondi(prix * i.quantite)
        };
    });
}

// Chaque fournisseur reçoit : ses produits + sa part (au prorata) des frais de livraison, moins 3 % sur ses produits.
function ventilerCommande(lignes, frais, total) {
    const parFourn = new Map();
    for (const l of lignes) {
        if (!l.fournisseurId) continue;
        parFourn.set(l.fournisseurId, (parFourn.get(l.fournisseurId) || 0) + l.sousTotal);
    }
    const ids = [...parFourn.keys()];
    const base = ids.reduce((s, id) => s + parFourn.get(id), 0);
    let livRestante = frais;
    const parts = ids.map((id, i) => {
        const sub = parFourn.get(id);
        const liv = i === ids.length - 1 ? livRestante : arrondi(base > 0 ? (frais * sub) / base : 0);
        livRestante -= liv;
        const commission = arrondi((sub * TAUX_BOUTIQUE) / 100);
        const montant = sub + liv;
        return { fournisseurId: id, montant, commission, net: montant - commission, taux: TAUX_BOUTIQUE };
    });
    // La somme des parts doit toujours égaler le total payé (arrondis, anciennes commandes)
    if (parts.length) {
        const ecart = total - parts.reduce((s, x) => s + x.montant, 0);
        parts[parts.length - 1].montant += ecart;
        parts[parts.length - 1].net += ecart;
    }
    return parts;
}

// ═══════════════════════════════════════════════════════════
// MONTANT DÛ — toujours calculé par le serveur.
// ═══════════════════════════════════════════════════════════
async function calculerDu({ commandeId, reservationId, depotMontant, user, t }) {
    const opt = t ? { transaction: t, lock: t.LOCK.UPDATE } : {};

    // ── DÉPÔT sur le portefeuille (montant choisi par la personne, borné) ─────
    if (depotMontant) {
        const m = arrondi(depotMontant);
        if (m < PF.DEPOT_MIN) throw new ErreurPaiement(400, `Dépôt minimum : ${PF.DEPOT_MIN} FCFA.`);
        if (m > PF.DEPOT_MAX) throw new ErreurPaiement(400, `Dépôt maximum : ${PF.DEPOT_MAX.toLocaleString('fr-FR')} FCFA.`);
        return {
            typePaiement: 'DEPOT', montant: m, fournisseurId: null, tauxCommission: 0, commission: 0, net: 0, parts: [],
            details: { articles: [{ nom: 'Dépôt sur mon portefeuille Kanari', quantite: 1, sousTotal: m }] }
        };
    }

    // ── COMMANDE BOUTIQUE (panier, 1 à N fournisseurs) ─────
    if (commandeId) {
        const c = await Commande.findByPk(commandeId, opt);
        if (!c) throw new ErreurPaiement(404, 'Commande introuvable.');
        if (c.clientId !== user.id) throw new ErreurPaiement(403, 'Cette commande ne vous appartient pas.');
        if (c.statut === 'annulée') throw new ErreurPaiement(409, 'Cette commande est annulée.', 'ANNULEE');

        const lignes = await chargerLignes(commandeId, t);
        const total = arrondi(c.montantTotal);
        const frais = arrondi(c.fraisLivraison);
        const parts = ventilerCommande(lignes, frais, total);
        const commission = parts.length
            ? parts.reduce((s, x) => s + x.commission, 0)
            : arrondi(Math.max(total - frais, 0) * TAUX_BOUTIQUE / 100);
        return {
            typePaiement: 'COMMANDE', montant: total,
            fournisseurId: parts.length === 1 ? parts[0].fournisseurId : (parts.length ? null : c.fournisseurId),
            tauxCommission: TAUX_BOUTIQUE, commission, net: total - commission, parts,
            details: {
                articles: lignes.map((l) => ({ nom: l.nom, quantite: l.quantite, sousTotal: l.sousTotal })),
                fraisLivraison: frais
            }
        };
    }

    // ── MISSION ────────────────────────────────────────────
    const r = await Reservation.findByPk(reservationId, opt);
    if (!r) throw new ErreurPaiement(404, 'Mission introuvable.');

    const profil = await Fournisseur.findOne({ where: { userId: user.id }, attributes: ['id'], transaction: t });
    const estPrestataire = !!profil && r.fournisseurId === profil.id;
    const estClient = r.clientId === user.id;
    if (!estPrestataire && !estClient) throw new ErreurPaiement(403, 'Cette mission ne vous concerne pas.');

    const bon = await BonIntervention.findOne({ where: { reservationId }, transaction: t });
    if (!bon || !(bon.valide || bon.valideParAdmin)) {
        throw new ErreurPaiement(409, "Le bon d'intervention doit d'abord être validé par le client.", 'BON_NON_VALIDE');
    }

    const total = arrondi(bon.montantFinal);
    const taux = Number(bon.tauxCommissionApplique ?? TAUX_MISSION_DEFAUT); // 10 % + supplément admin, figé sur le bon
    const commission = commissionDuBon(bon);
    const fournisseurId = bon.fournisseurId ?? r.fournisseurId;

    // MODE B : le prestataire a encaissé, il dépose sa commission à Kanari
    if (MODES_DIRECTS.includes(r.modePaiement)) {
        if (!estPrestataire) {
            throw new ErreurPaiement(409, 'Cette mission se règle directement auprès du prestataire.', 'REGLEMENT_DIRECT');
        }
        return {
            typePaiement: 'COMMISSION', montant: commission, fournisseurId,
            tauxCommission: taux, commission, net: 0, parts: [],
            details: { articles: [{ nom: `Commission Kanari — mission #${reservationId}`, quantite: 1, sousTotal: commission }] }
        };
    }

    // MODE A : le client paie Kanari, le net est crédité au prestataire
    if (!estClient) throw new ErreurPaiement(403, 'Seul le client peut régler cette mission.');
    const articles = [{ nom: "Main d'œuvre", quantite: 1, sousTotal: arrondi(bon.montantMainOeuvre) }];
    if (arrondi(bon.montantPiecesOutils) > 0) articles.push({ nom: 'Pièces / matériel', quantite: 1, sousTotal: arrondi(bon.montantPiecesOutils) });
    return {
        typePaiement: 'MISSION', montant: total, fournisseurId,
        tauxCommission: taux, commission, net: total - commission,
        parts: fournisseurId ? [{ fournisseurId, montant: total, commission, net: total - commission, taux }] : [],
        details: { articles }
    };
}

// Commission due sur un bon d'intervention (main-d'œuvre uniquement, taux figé sur le bon)
function commissionDuBon(bon) {
    if (!bon) return 0;
    const taux = Number(bon.tauxCommissionApplique ?? TAUX_MISSION_DEFAUT);
    return bon.montantCommission != null
        ? arrondi(bon.montantCommission)
        : arrondi(arrondi(bon.montantMainOeuvre) * taux / 100);
}

// ═══════════════════════════════════════════════════════════
// SOLDES PARTENAIRES (via la ventilation ; repli sur l'ancien format sans ventilation)
// ═══════════════════════════════════════════════════════════
async function partsDe(p, t) {
    const parts = await PaiementPart.findAll({ where: { paiementId: p.id }, transaction: t });
    if (parts.length) {
        return parts.map((x) => ({ fournisseurId: x.fournisseurId, montant: Number(x.montant), commission: Number(x.commission), net: Number(x.net), taux: Number(x.taux) }));
    }
    if (p.fournisseurId && p.typePaiement !== 'COMMISSION') {
        return [{ fournisseurId: p.fournisseurId, montant: Number(p.montant), commission: Number(p.commissionKanari), net: Number(p.montantNet), taux: Number(p.tauxCommission) }];
    }
    return [];
}

async function crediter(p, t) {
    if (p.typePaiement === 'COMMISSION' || p.typePaiement === 'DEPOT' || p.soldeCredite) return;
    for (const part of await partsDe(p, t)) {
        let s = await Solde.findOne({ where: { fournisseurId: part.fournisseurId }, transaction: t, lock: t.LOCK.UPDATE });
        if (!s) s = await Solde.create({ fournisseurId: part.fournisseurId }, { transaction: t });

        // Fonds de soutien : seulement si le partenaire l'a accepté ; même base que la commission, jamais un revenu Kanari
        let soutien = 0;
        const base = part.taux > 0 ? PF.arrondi(part.commission * 100 / part.taux) : part.montant;
        if (await PF.soutienActif(part.fournisseurId, t)) soutien = Math.min(PF.arrondi(base * PF.TAUX_SOUTIEN / 100), Math.max(part.net, 0));
        const net = part.net - soutien;

        const nouveau = Number(s.solde) + net;
        await s.update({ solde: nouveau, totalGagne: Number(s.totalGagne) + net }, { transaction: t });
        await PF.ecrire({ cle: `P${p.id}-GAINS-F${part.fournisseurId}`, compte: 'GAINS', sens: 'CREDIT',
            categorie: p.typePaiement === 'COMMANDE' ? 'VENTE' : 'MISSION', montant: net, base: part.montant, taux: part.taux,
            soldeApres: nouveau, fournisseurId: part.fournisseurId, paiementId: p.id,
            motif: soutien ? `Net ${part.net} − fonds de soutien ${soutien}` : null }, t);
        if (soutien > 0) {
            await PF.ecrire({ cle: `P${p.id}-SOUTIEN-F${part.fournisseurId}`, compte: 'SOUTIEN', sens: 'CREDIT', categorie: 'SOUTIEN',
                montant: soutien, base, taux: PF.TAUX_SOUTIEN, fournisseurId: part.fournisseurId, paiementId: p.id }, t);
        }
    }
    p.soldeCredite = true;
}

async function debiter(p, t) {
    if (!p.soldeCredite) { await PF.annulerRistournes(p, t); return; } // ex. dépôt de commission : pas de solde, mais une ristourne à annuler
    const credits = await PF.Mouvement.findAll({
        where: { paiementId: p.id, sens: 'CREDIT', compte: { [Op.in]: ['GAINS', 'SOUTIEN'] } }, transaction: t
    });
    if (credits.length) {
        // On rejoue exactement ce qui a été crédité (montants du journal)
        for (const c of credits) {
            if (c.compte === 'GAINS') {
                const s = await Solde.findOne({ where: { fournisseurId: c.fournisseurId }, transaction: t, lock: t.LOCK.UPDATE });
                if (!s || Number(s.solde) < Number(c.montant)) {
                    throw new ErreurPaiement(409, 'Solde prestataire insuffisant : un retrait a déjà été effectué.');
                }
                const nouveau = Number(s.solde) - Number(c.montant);
                await s.update({ solde: nouveau, totalGagne: Number(s.totalGagne) - Number(c.montant) }, { transaction: t });
                await PF.ecrire({ cle: `${c.cle}-ANN`, compte: 'GAINS', sens: 'DEBIT', categorie: 'ANNULATION', montant: c.montant,
                    soldeApres: nouveau, fournisseurId: c.fournisseurId, paiementId: p.id, motif: 'Remboursement du paiement' }, t);
            } else {
                await PF.ecrire({ cle: `${c.cle}-ANN`, compte: 'SOUTIEN', sens: 'DEBIT', categorie: 'ANNULATION', montant: c.montant,
                    fournisseurId: c.fournisseurId, paiementId: p.id, motif: 'Remboursement du paiement' }, t);
            }
        }
    } else {
        // Anciens paiements sans journal
        for (const part of await partsDe(p, t)) {
            const s = await Solde.findOne({ where: { fournisseurId: part.fournisseurId }, transaction: t, lock: t.LOCK.UPDATE });
            if (!s || Number(s.solde) < part.net) {
                throw new ErreurPaiement(409, 'Solde prestataire insuffisant : un retrait a déjà été effectué.');
            }
            await s.update({ solde: Number(s.solde) - part.net, totalGagne: Number(s.totalGagne) - part.net }, { transaction: t });
        }
    }
    await PF.annulerRistournes(p, t);
    p.soldeCredite = false;
}

// ═══════════════════════════════════════════════════════════
// FACTURE (1 par paiement validé, hors dépôt de commission)
// ═══════════════════════════════════════════════════════════
async function creerFacture(p, t) {
    if (p.typePaiement === 'COMMISSION' || p.typePaiement === 'DEPOT') return;
    await Facture.findOrCreate({
        where: { paiementId: p.id },
        defaults: {
            commandeId: p.commandeId,
            reservationId: p.reservationId,
            fournisseurId: p.fournisseurId,
            clientId: p.clientId,
            montantTotal: Number(p.montant),
            commissionKanari: Number(p.commissionKanari),
            montantNet: Number(p.montantNet),
            statut: 'payée',
            reference: `FAC-${new Date().getFullYear()}-${String(p.id).padStart(6, '0')}`,
            notes: p.commandeId ? `Commande #${p.commandeId}` : `Mission #${p.reservationId}`
        },
        transaction: t
    });
}

// ═══════════════════════════════════════════════════════════
// TRANSITIONS DE STATUT (+ effets de bord) — dans la transaction t
// Retourne les notifications à envoyer APRÈS le commit.
// ═══════════════════════════════════════════════════════════
const TRANSITIONS = {
    en_attente: ['valide', 'rejete'],
    valide: ['rembourse'],
    rejete: [],
    rembourse: []
};

async function appliquerStatut(p, nouveau, { motif }, t) {
    if (!TRANSITIONS[p.statut]?.includes(nouveau)) {
        throw new ErreurPaiement(409, `Transition impossible : ${p.statut} → ${nouveau}`);
    }
    const resId = p.reservationId;
    const comId = p.commandeId;
    const notifications = [];

    if (nouveau === 'valide') {
        p.confirmationDate = new Date();
        await crediter(p, t);
        await PF.ristournes(p, await partsDe(p, t), t);
        if (p.typePaiement === 'COMMANDE') {
            await Commande.update({ statutPaiement: 'paye' }, { where: { id: comId }, transaction: t });
            await Commande.update({ statut: 'validée' }, { where: { id: comId, statut: 'en_attente' }, transaction: t });
        } else if (p.typePaiement === 'MISSION') {
            await Reservation.update({ statutPaiement: 'paye' }, { where: { id: resId }, transaction: t });
        } else if (p.typePaiement === 'DEPOT') {
            await PF.crediterDepot(p, t);
        } else { // COMMISSION déposée par le prestataire
            await Reservation.update({ commissionStatut: 'recue' }, { where: { id: resId }, transaction: t });
        }
    }

    if (nouveau === 'rejete') {
        p.motif = motif || null;
        if (p.typePaiement === 'MISSION') await Reservation.update({ statutPaiement: 'echoue' }, { where: { id: resId }, transaction: t });
        if (p.typePaiement === 'COMMANDE') await Commande.update({ statutPaiement: 'echoue' }, { where: { id: comId }, transaction: t });
    }

    if (nouveau === 'rembourse') {
        p.motif = motif || null;
        if (p.typePaiement === 'DEPOT') await PF.annulerDepot(p, t);
        await debiter(p, t);
        await PF.restituerPaiementPortefeuille(p, t);
        await Facture.update({ statut: 'annulée' }, { where: { paiementId: p.id }, transaction: t });
        if (p.typePaiement === 'COMMANDE') await Commande.update({ statut: 'annulée', statutPaiement: 'rembourse' }, { where: { id: comId }, transaction: t });
        if (p.typePaiement === 'MISSION') await Reservation.update({ statutPaiement: 'non_paye' }, { where: { id: resId }, transaction: t });
        if (p.typePaiement === 'COMMISSION') await Reservation.update({ commissionStatut: 'en_attente' }, { where: { id: resId }, transaction: t });
    }

    p.statut = nouveau;
    await p.save({ transaction: t });
    if (nouveau === 'valide') await creerFacture(p, t);

    // Le fournisseur n'est prévenu qu'une fois le paiement confirmé (jamais pour une commande non payée)
    if (nouveau === 'valide') {
        if (p.typePaiement === 'COMMANDE') {
            const lignes = await chargerLignes(comId, t);
            for (const part of await partsDe(p, t)) {
                const resume = lignes.filter((l) => Number(l.fournisseurId) === Number(part.fournisseurId))
                    .map((l) => `${l.nom} ×${l.quantite}`).join(', ');
                notifications.push({
                    fournisseurId: part.fournisseurId, title: 'Nouvelle vente 🛒',
                    body: `Commande #${comId} payée${resume ? ` : ${resume}` : ''}. Total ${fmt(part.montant)} · commission Kanari ${fmt(part.commission)} · votre net ${fmt(part.net)}`
                });
            }
        } else if (p.typePaiement === 'MISSION') {
            for (const part of await partsDe(p, t)) {
                notifications.push({
                    fournisseurId: part.fournisseurId, title: 'Mission payée ✅',
                    body: `Total ${fmt(part.montant)} · commission ${fmt(part.commission)} · crédité ${fmt(part.net)}`
                });
            }
        } else if (p.fournisseurId) {
            notifications.push({ fournisseurId: p.fournisseurId, title: 'Commission reçue ✅', body: `Votre dépôt de ${fmt(p.montant)} a bien été validé.` });
        }
    }
    return { notifications };
}

// ═══════════════════════════════════════════════════════════
// NOTIFICATION FOURNISSEUR (Firebase) — jamais bloquante
// ═══════════════════════════════════════════════════════════
async function notifierFournisseur(fournisseurId, title, body) {
    try {
        const f = await Fournisseur.findByPk(fournisseurId, { attributes: ['fcmToken'] });
        const admin = require('firebase-admin');
        if (f?.fcmToken && admin.apps.length) {
            await admin.messaging().send({ token: f.fcmToken, notification: { title, body } });
        }
    } catch (e) {
        console.warn('Notification fournisseur ignorée :', e.message);
    }
}

// Optionnel : le retard est déjà calculé à la lecture, ceci ne fait que synchroniser le champ en base
async function marquerCommissionsEnRetard() {
    return Reservation.update({ commissionStatut: 'en_retard' }, {
        where: {
            commissionStatut: 'en_attente',
            modePaiement: { [Op.in]: MODES_DIRECTS },
            commissionDateLimite: { [Op.lt]: new Date() }
        }
    });
}

module.exports = {
    ErreurPaiement, calculerDu, appliquerStatut,
    notifierFournisseur, marquerCommissionsEnRetard, commissionDuBon, MODES_DIRECTS
};