const { Op } = require('sequelize');
const Paiement = require('../models/Paiement');
const Commande = require('../models/Commande');
const Reservation = require('../models/Reservation');
const BonIntervention = require('../models/BonIntervention');
const Fournisseur = require('../models/Fournisseur');
const Solde = require('../models/Solde');
const Facture = require('../models/Facture');

const TAUX_BOUTIQUE = Number(process.env.COMMISSION_BOUTIQUE ?? 3);       // % sur les ventes boutique
const TAUX_MISSION_DEFAUT = Number(process.env.COMMISSION_MISSION ?? 10);  // seulement si le bon n'a pas de taux figé
const MODES_DIRECTS = ['direct_prestataire', 'especes'];                   // le prestataire encaisse lui-même
const arrondi = (n) => Math.round(Number(n) || 0);

class ErreurPaiement extends Error {
    constructor(status, message, code) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

// ═══════════════════════════════════════════════════════════
// MONTANT DÛ — toujours calculé par le serveur.
// Commission missions : uniquement sur la main-d'œuvre (pas sur les pièces).
// Commission boutique : sur le montant des produits (sans les frais de livraison).
// ═══════════════════════════════════════════════════════════
async function calculerDu({ commandeId, reservationId, user, t }) {
    const opt = t ? { transaction: t, lock: t.LOCK.UPDATE } : {};

    // ── COMMANDE BOUTIQUE ──────────────────────────────────
    if (commandeId) {
        const c = await Commande.findByPk(commandeId, opt);
        if (!c) throw new ErreurPaiement(404, 'Commande introuvable.');
        if (c.clientId !== user.id) throw new ErreurPaiement(403, 'Cette commande ne vous appartient pas.');
        if (c.statut === 'annulée') throw new ErreurPaiement(409, 'Cette commande est annulée.', 'ANNULEE');

        const total = arrondi(c.montantTotal);
        const base = Math.max(total - arrondi(c.fraisLivraison), 0);
        const commission = arrondi(base * TAUX_BOUTIQUE / 100);
        return {
            typePaiement: 'COMMANDE', montant: total, fournisseurId: c.fournisseurId,
            tauxCommission: TAUX_BOUTIQUE, commission, net: total - commission
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
    const commission = bon.montantCommission != null
        ? arrondi(bon.montantCommission)
        : arrondi(arrondi(bon.montantMainOeuvre) * taux / 100);
    const fournisseurId = bon.fournisseurId ?? r.fournisseurId;

    // MODE B : le prestataire a encaissé, il dépose sa commission à Kanari
    if (MODES_DIRECTS.includes(r.modePaiement)) {
        if (!estPrestataire) {
            throw new ErreurPaiement(409, 'Cette mission se règle directement auprès du prestataire.', 'REGLEMENT_DIRECT');
        }
        return {
            typePaiement: 'COMMISSION', montant: commission, fournisseurId,
            tauxCommission: taux, commission, net: 0
        };
    }

    // MODE A : le client paie Kanari, le net est crédité au prestataire
    if (!estClient) throw new ErreurPaiement(403, 'Seul le client peut régler cette mission.');
    return {
        typePaiement: 'MISSION', montant: total, fournisseurId,
        tauxCommission: taux, commission, net: total - commission
    };
}

// ═══════════════════════════════════════════════════════════
// SOLDE PRESTATAIRE
// ═══════════════════════════════════════════════════════════
async function crediter(p, t) {
    if (p.typePaiement === 'COMMISSION' || p.soldeCredite || !p.fournisseurId) return;
    let s = await Solde.findOne({ where: { fournisseurId: p.fournisseurId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!s) s = await Solde.create({ fournisseurId: p.fournisseurId }, { transaction: t });
    const net = Number(p.montantNet);
    await s.update({
        solde: Number(s.solde) + net,
        totalGagne: Number(s.totalGagne) + net
    }, { transaction: t });
    p.soldeCredite = true;
}

async function debiter(p, t) {
    if (!p.soldeCredite) return;
    const s = await Solde.findOne({ where: { fournisseurId: p.fournisseurId }, transaction: t, lock: t.LOCK.UPDATE });
    const net = Number(p.montantNet);
    if (!s || Number(s.solde) < net) {
        throw new ErreurPaiement(409, 'Solde prestataire insuffisant : un retrait a déjà été effectué.');
    }
    await s.update({
        solde: Number(s.solde) - net,
        totalGagne: Number(s.totalGagne) - net
    }, { transaction: t });
    p.soldeCredite = false;
}

// ═══════════════════════════════════════════════════════════
// FACTURE (1 par paiement validé, hors dépôt de commission)
// ═══════════════════════════════════════════════════════════
async function creerFacture(p, t) {
    if (p.typePaiement === 'COMMISSION') return;
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

    if (nouveau === 'valide') {
        p.confirmationDate = new Date();
        await crediter(p, t);
        if (p.typePaiement === 'COMMANDE') {
            await Commande.update({ statut: 'validée' }, { where: { id: comId, statut: 'en_attente' }, transaction: t });
        } else if (p.typePaiement === 'MISSION') {
            await Reservation.update({ statutPaiement: 'paye' }, { where: { id: resId }, transaction: t });
        } else { // COMMISSION déposée par le prestataire
            await Reservation.update({ commissionStatut: 'recue' }, { where: { id: resId }, transaction: t });
        }
    }

    if (nouveau === 'rejete') {
        p.motif = motif || null;
        if (p.typePaiement === 'MISSION') {
            await Reservation.update({ statutPaiement: 'echoue' }, { where: { id: resId }, transaction: t });
        }
    }

    if (nouveau === 'rembourse') {
        p.motif = motif || null;
        await debiter(p, t);
        await Facture.update({ statut: 'annulée' }, { where: { paiementId: p.id }, transaction: t });
        if (p.typePaiement === 'COMMANDE') await Commande.update({ statut: 'annulée' }, { where: { id: comId }, transaction: t });
        if (p.typePaiement === 'MISSION') await Reservation.update({ statutPaiement: 'non_paye' }, { where: { id: resId }, transaction: t });
        if (p.typePaiement === 'COMMISSION') await Reservation.update({ commissionStatut: 'en_attente' }, { where: { id: resId }, transaction: t });
    }

    p.statut = nouveau;
    await p.save({ transaction: t });
    if (nouveau === 'valide') await creerFacture(p, t);
}

// ═══════════════════════════════════════════════════════════
// NOTIFICATION FOURNISSEUR (Firebase) — jamais bloquante, appelée APRÈS le commit
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

// À appeler depuis ton cron : commissions non déposées après la date limite (48h)
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
    notifierFournisseur, marquerCommissionsEnRetard
};