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
const TAUX_MISSION_DEFAUT = Number(process.env.COMMISSION_MISSION ?? 10);  // taux par défaut pour les missions
const MODES_DIRECTS = ['direct_prestataire', 'especes'];                   // le prestataire encaisse lui-même
const arrondi = (n) => Math.round(Number(n) || 0);
const fmt = (n) => Number(n).toLocaleString('fr-FR') + ' FCFA';

const { ErreurPaiement } = PF;

// ── FONCTION NOTIFIER FOURNISSEUR ──
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
    if (parts.length) {
        const ecart = total - parts.reduce((s, x) => s + x.montant, 0);
        parts[parts.length - 1].montant += ecart;
        parts[parts.length - 1].net += ecart;
    }
    return parts;
}

async function calculerDu({ commandeId, reservationId, depotMontant, user, t }) {
    if (depotMontant) {
        const m = arrondi(depotMontant);
        if (m < PF.DEPOT_MIN) throw new ErreurPaiement(400, `Dépôt minimum : ${PF.DEPOT_MIN} FCFA.`);
        if (m > PF.DEPOT_MAX) throw new ErreurPaiement(400, `Dépôt maximum : ${PF.DEPOT_MAX.toLocaleString('fr-FR')} FCFA.`);
        return {
            typePaiement: 'DEPOT', montant: m, fournisseurId: null, tauxCommission: 0, commission: 0, net: 0, parts: [],
            details: { articles: [{ nom: 'Dépôt sur mon portefeuille Kanari', quantite: 1, sousTotal: m }] }
        };
    }

    if (commandeId) {
        const c = await Commande.findByPk(commandeId, t ? { transaction: t } : {});
        if (!c) throw new ErreurPaiement(404, 'Commande introuvable.');
        if (c.clientId !== user.id) throw new ErreurPaiement(403, 'Cette commande ne vous appartient pas.');

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

    const r = await Reservation.findByPk(reservationId, t ? { transaction: t } : {});
    if (!r) throw new ErreurPaiement(404, 'Mission introuvable.');

    const profil = await Fournisseur.findOne({ where: { userId: user.id }, attributes: ['id'], ...(t ? { transaction: t } : {}) });
    const estPrestataire = !!profil && r.fournisseurId === profil.id;
    const estClient = r.clientId === user.id;
    if (!estPrestataire && !estClient) throw new ErreurPaiement(403, 'Cette mission ne vous concerne pas.');

    const bon = await BonIntervention.findOne({ where: { reservationId }, ...(t ? { transaction: t } : {}) });
    if (!bon || !(bon.valide || bon.valideParAdmin)) {
        throw new ErreurPaiement(409, "Le bon d'intervention doit d'abord être validé par le client.", 'BON_NON_VALIDE');
    }

    const total = arrondi(bon.montantFinal);
    const taux = Number(bon.tauxCommissionApplique ?? TAUX_MISSION_DEFAUT);
    const commission = commissionDuBon(bon);
    const fournisseurId = bon.fournisseurId ?? r.fournisseurId;

    if (MODES_DIRECTS.includes(r.modePaiement)) {
        if (!estPrestataire) throw new ErreurPaiement(409, 'Cette mission se règle directement auprès du prestataire.');
        return {
            typePaiement: 'COMMISSION', montant: commission, fournisseurId,
            tauxCommission: taux, commission, net: 0, parts: [],
            details: { articles: [{ nom: `Commission Kanari — mission #${reservationId}`, quantite: 1, sousTotal: commission }] }
        };
    }

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

function commissionDuBon(bon) {
    if (!bon) return 0;
    const taux = Number(bon.tauxCommissionApplique ?? TAUX_MISSION_DEFAUT);
    return bon.montantCommission != null
        ? arrondi(bon.montantCommission)
        : arrondi(arrondi(bon.montantMainOeuvre) * taux / 100);
}

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

        const net = part.net;
        const nouveau = Number(s.solde) + net;
        await s.update({ solde: nouveau, totalGagne: Number(s.totalGagne) + net }, { transaction: t });
    }
    p.soldeCredite = true;
}

async function appliquerStatut(p, nouveau, { motif }, t) {
    const notifications = [];
    if (nouveau === 'valide') {
        p.confirmationDate = new Date();
        await crediter(p, t);
        if (p.typePaiement === 'COMMANDE') {
            await Commande.update({ statutPaiement: 'paye' }, { where: { id: p.commandeId }, transaction: t });
        } else if (p.typePaiement === 'MISSION') {
            await Reservation.update({ statutPaiement: 'paye' }, { where: { id: p.reservationId }, transaction: t });
        }
    }
    p.statut = nouveau;
    await p.save({ transaction: t });
    return { notifications };
}

module.exports = {
    ErreurPaiement, calculerDu, appliquerStatut,
    notifierFournisseur, commissionDuBon, MODES_DIRECTS
};