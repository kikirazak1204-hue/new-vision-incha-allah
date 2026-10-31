// Portefeuilles : journal des mouvements, ristournes 1,5 %, fonds de soutien 5 % (sur accord uniquement)
const { Op, QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const Mouvement = require('../models/MouvementPortefeuille');
const Fournisseur = require('../models/Fournisseur');

const TAUX_RISTOURNE = Number(process.env.RISTOURNE_TAUX ?? 1.5);
const TAUX_SOUTIEN = Number(process.env.FONDS_SOUTIEN_TAUX ?? 5);
// Garde-fous : la ristourne client ne dépasse jamais cette part de la commission réellement gagnée par Kanari
const PLAFOND_PART_COMMISSION = Number(process.env.RISTOURNE_PLAFOND_COMMISSION ?? 50);   // en % de la commission
const RISTOURNE_ACTIVE = String(process.env.RISTOURNE_ACTIVE ?? 'true') !== 'false';       // interrupteur général
const arrondi = (n) => Math.round(Number(n) || 0);
const Solde = require('../models/Solde');
const DEPOT_MIN = Number(process.env.DEPOT_MINIMUM ?? 500);
const DEPOT_MAX = Number(process.env.DEPOT_MAXIMUM ?? 10000000);

class ErreurPaiement extends Error {
    constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}

// Écrit un mouvement une seule fois (la clé unique bloque les doublons)
async function ecrire(m, t) {
    const ex = await Mouvement.findOne({ where: { cle: m.cle }, transaction: t });
    if (ex) return null;
    return Mouvement.create(m, { transaction: t });
}

// Le fonds de soutien n'existe que si l'admin a enregistré l'accord du partenaire
async function soutienActif(fournisseurId, t) {
    try {
        const table = Fournisseur.getTableName();
        const [row] = await sequelize.query(
            `SELECT fondsSoutienActif FROM \`${typeof table === 'string' ? table : table.tableName}\` WHERE id = ?`,
            { replacements: [fournisseurId], type: QueryTypes.SELECT, transaction: t }
        );
        return !!(row && Number(row.fondsSoutienActif) === 1);
    } catch { return false; } // colonne pas encore créée → pas de retenue
}

// Ristourne client d'UN paiement = min(1,5 % du montant hors livraison ; 50 % de la commission de Kanari)
async function calculerRistourneClient(p, t) {
    const commission = Number(p.commissionKanari) || 0;
    let base = Number(p.montant);
    if (p.commandeId) {
        const Commande = require('../models/Commande');
        const c = await Commande.findByPk(p.commandeId, { attributes: ['fraisLivraison'], transaction: t });
        base = Math.max(base - (Number(c?.fraisLivraison) || 0), 0);
    }
    const montant = Math.min(arrondi(base * TAUX_RISTOURNE / 100), arrondi(commission * PLAFOND_PART_COMMISSION / 100));
    return { montant, base, commission };
}

// Clôture d'un mois (AAAA-MM) : crédite la ristourne de tous les achats confirmés jusqu'à la fin de ce mois,
// livrés (commandes) et non remboursés. Un achat n'est jamais compté deux fois (clé unique) ;
// un achat pas encore livré est reporté à la clôture suivante.
// simulation = true : calcule sans rien écrire.
async function cloturerMois(mois, { simulation = true, clientId = null, jusquA = null } = {}, t) {
    const m = /^(\d{4})-(\d{2})$/.exec(mois || '');
    if (!m) throw Object.assign(new Error('Mois invalide (format AAAA-MM).'), { status: 400 });
    const fin = jusquA || new Date(Number(m[1]), Number(m[2]), 1);          // début du mois suivant
    const Paiement = require('../models/Paiement');
    const Commande = require('../models/Commande');
    const where = { statut: 'valide', typePaiement: { [Op.in]: ['COMMANDE', 'MISSION'] }, clientId: clientId || { [Op.ne]: null }, confirmationDate: { [Op.lt]: fin } };
    const paiements = await Paiement.findAll({ where, transaction: t });
    const parClient = new Map();
    for (const p of paiements) {
        if (await Mouvement.findOne({ where: { cle: `P${p.id}-RIS-C` }, transaction: t })) continue;
        if (p.commandeId) {
            const c = await Commande.findByPk(p.commandeId, { attributes: ['statut'], transaction: t });
            if (!c || c.statut !== 'livrée') continue;
        }
        const r = await calculerRistourneClient(p, t);
        if (r.montant <= 0) continue;
        if (!simulation) {
            await ecrire({ cle: `P${p.id}-RIS-C`, compte: 'RISTOURNE', sens: 'CREDIT', categorie: 'RISTOURNE_CLIENT',
                montant: r.montant, base: r.base, taux: TAUX_RISTOURNE, clientId: p.clientId, paiementId: p.id,
                motif: `Clôture ${mois} · plafond ${PLAFOND_PART_COMMISSION} % de la commission (${r.commission})` }, t);
        }
        const x = parClient.get(p.clientId) || { clientId: p.clientId, achats: 0, base: 0, ristourne: 0 };
        x.achats += 1; x.base += r.base; x.ristourne += r.montant;
        parClient.set(p.clientId, x);
    }
    const lignes = [...parClient.values()];
    return { mois, simulation, lignes, total: lignes.reduce((s, l) => s + l.ristourne, 0), nbClients: lignes.length };
}

// Ristournes calculées uniquement sur des montants réellement confirmés
async function ristournes(p, parts, t) {
    if (!RISTOURNE_ACTIVE || p.typePaiement === 'DEPOT') return;
    const taux = TAUX_RISTOURNE;
    if (p.typePaiement === 'COMMISSION') {
        // Mode direct : la commission vient d'être effectivement reçue par Kanari
        const m = arrondi(Number(p.montant) * taux / 100);
        if (m > 0 && p.fournisseurId) {
            await ecrire({ cle: `P${p.id}-RIS-F${p.fournisseurId}`, compte: 'RISTOURNE', sens: 'CREDIT', categorie: 'RISTOURNE_PARTENAIRE',
                montant: m, base: Number(p.montant), taux, fournisseurId: p.fournisseurId, clientId: await userIdDe(p.fournisseurId, t), paiementId: p.id }, t);
        }
        return;
    }
    // La ristourne client n'est plus créditée ici : elle est versée à la clôture mensuelle (cloturerMois)
    for (const part of parts) {
        const m = arrondi(part.commission * taux / 100);
        if (m > 0) {
            await ecrire({ cle: `P${p.id}-RIS-F${part.fournisseurId}`, compte: 'RISTOURNE', sens: 'CREDIT', categorie: 'RISTOURNE_PARTENAIRE',
                montant: m, base: part.commission, taux, fournisseurId: part.fournisseurId, clientId: await userIdDe(part.fournisseurId, t), paiementId: p.id }, t);
        }
    }
}

// Remboursement : on neutralise les ristournes par des mouvements inverses
async function annulerRistournes(p, t) {
    const lignes = await Mouvement.findAll({ where: { paiementId: p.id, compte: 'RISTOURNE', sens: 'CREDIT' }, transaction: t });
    for (const l of lignes) {
        await ecrire({ cle: `${l.cle}-ANN`, compte: 'RISTOURNE', sens: 'DEBIT', categorie: 'ANNULATION',
            montant: l.montant, base: l.base, taux: l.taux, fournisseurId: l.fournisseurId, clientId: l.clientId,
            paiementId: p.id, motif: 'Remboursement du paiement' }, t);
    }
}

// Total d'un compte (crédits − débits)
async function totalCompte(where, t) {
    const lignes = await Mouvement.findAll({ where, attributes: ['sens', 'montant'], transaction: t });
    return lignes.reduce((s, l) => s + (l.sens === 'CREDIT' ? 1 : -1) * Number(l.montant), 0);
}


// ═══════════════ PORTEFEUILLE UNIQUE (client ou partenaire) ═══════════════
// Trois compartiments : GAINS (partenaire), RISTOURNE (récompenses), DEPOT (recharge). Le fonds de soutien reste à part.

async function userIdDe(fournisseurId, t) {
    const f = await Fournisseur.findByPk(fournisseurId, { attributes: ['userId'], transaction: t });
    return f?.userId || null;
}

// Verrou par utilisateur : empêche de dépenser deux fois le même argent (double clic, deux onglets)
async function verrouillerUtilisateur(userId, t) {
    try { await sequelize.query('SELECT id FROM users WHERE id = ? FOR UPDATE', { replacements: [userId], type: QueryTypes.SELECT, transaction: t }); }
    catch { /* verrou indisponible : les autres protections restent actives */ }
}

async function soldesUtilisateur(userId, t) {
    const profil = await Fournisseur.findOne({ where: { userId }, attributes: ['id'], transaction: t });
    let gains = 0;
    if (profil) {
        const s = await Solde.findOne({ where: { fournisseurId: profil.id }, transaction: t });
        gains = Number(s?.solde) || 0;
    }
    const ristourne = await totalCompte({ clientId: userId, compte: 'RISTOURNE' }, t);
    const depot = await totalCompte({ clientId: userId, compte: 'DEPOT' }, t);
    return { profilId: profil?.id || null, gains, ristourne, depot, disponible: gains + ristourne + depot };
}

// Dépôt confirmé par l'admin → crédit du compartiment DEPOT
async function crediterDepot(p, t) {
    await ecrire({ cle: `P${p.id}-DEPOT`, compte: 'DEPOT', sens: 'CREDIT', categorie: 'DEPOT', montant: Number(p.montant),
        clientId: p.clientId, paiementId: p.id, motif: `Référence ${p.referenceClient || p.transactionId}` }, t);
}
async function annulerDepot(p, t) {
    await verrouillerUtilisateur(p.clientId, t);
    const dispo = await totalCompte({ clientId: p.clientId, compte: 'DEPOT' }, t);
    if (dispo < Number(p.montant)) throw new ErreurPaiement(409, 'Dépôt déjà utilisé ou retiré : remboursement impossible.');
    await ecrire({ cle: `P${p.id}-DEPOT-ANN`, compte: 'DEPOT', sens: 'DEBIT', categorie: 'ANNULATION', montant: Number(p.montant),
        clientId: p.clientId, paiementId: p.id, motif: 'Annulation du dépôt' }, t);
}

// Paiement avec le portefeuille : dépôt d'abord, puis récompenses, puis gains (partenaire)
async function debiterPortefeuille(userId, montant, paiementId, t) {
    await verrouillerUtilisateur(userId, t);
    const sd = await soldesUtilisateur(userId, t);
    if (sd.disponible < montant) throw new ErreurPaiement(409, `Solde insuffisant : ${sd.disponible.toLocaleString('fr-FR')} FCFA disponibles.`, 'SOLDE_INSUFFISANT');
    let reste = montant;
    for (const [compte, dispo] of [['DEPOT', sd.depot], ['RISTOURNE', sd.ristourne]]) {
        const pris = Math.min(dispo, reste);
        if (pris > 0) {
            await ecrire({ cle: `P${paiementId}-PAY-${compte}`, compte, sens: 'DEBIT', categorie: 'PAIEMENT', montant: pris, clientId: userId, paiementId }, t);
            reste -= pris;
        }
    }
    if (reste > 0 && sd.profilId) {
        const s = await Solde.findOne({ where: { fournisseurId: sd.profilId }, transaction: t, lock: t.LOCK.UPDATE });
        if (!s || Number(s.solde) < reste) throw new ErreurPaiement(409, 'Solde insuffisant.', 'SOLDE_INSUFFISANT');
        const nouveau = Number(s.solde) - reste;
        await s.update({ solde: nouveau }, { transaction: t });
        await ecrire({ cle: `P${paiementId}-PAY-GAINS`, compte: 'GAINS', sens: 'DEBIT', categorie: 'PAIEMENT', montant: reste,
            soldeApres: nouveau, fournisseurId: sd.profilId, paiementId }, t);
    }
}

// Remboursement d'un paiement fait avec le portefeuille : chaque compartiment retrouve ce qui a été pris
async function restituerPaiementPortefeuille(p, t) {
    const debits = await Mouvement.findAll({ where: { paiementId: p.id, sens: 'DEBIT', categorie: 'PAIEMENT' }, transaction: t });
    for (const d of debits) {
        if (d.compte === 'GAINS') {
            const s = await Solde.findOne({ where: { fournisseurId: d.fournisseurId }, transaction: t, lock: t.LOCK.UPDATE });
            if (!s) continue;
            const nouveau = Number(s.solde) + Number(d.montant);
            await s.update({ solde: nouveau }, { transaction: t });
            await ecrire({ cle: `${d.cle}-ANN`, compte: 'GAINS', sens: 'CREDIT', categorie: 'ANNULATION', montant: d.montant,
                soldeApres: nouveau, fournisseurId: d.fournisseurId, paiementId: p.id, motif: 'Remboursement' }, t);
        } else {
            await ecrire({ cle: `${d.cle}-ANN`, compte: d.compte, sens: 'CREDIT', categorie: 'ANNULATION', montant: d.montant,
                clientId: d.clientId, paiementId: p.id, motif: 'Remboursement' }, t);
        }
    }
}

module.exports = { ErreurPaiement, DEPOT_MIN, DEPOT_MAX, userIdDe, verrouillerUtilisateur, soldesUtilisateur, crediterDepot, annulerDepot, debiterPortefeuille, restituerPaiementPortefeuille, cloturerMois, PLAFOND_PART_COMMISSION, TAUX_RISTOURNE, TAUX_SOUTIEN, arrondi, ecrire, soutienActif, ristournes, annulerRistournes, totalCompte, Mouvement, Op };