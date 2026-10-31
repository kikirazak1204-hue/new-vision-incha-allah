// Portefeuilles : journal des mouvements, ristournes 1,5 %, fonds de soutien 5 % (sur accord uniquement)
const { Op, QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const Mouvement = require('../models/MouvementPortefeuille');
const Fournisseur = require('../models/Fournisseur');

const TAUX_RISTOURNE = Number(process.env.RISTOURNE_TAUX ?? 1.5);
const TAUX_SOUTIEN = Number(process.env.FONDS_SOUTIEN_TAUX ?? 5);
const arrondi = (n) => Math.round(Number(n) || 0);

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

// Ristournes calculées uniquement sur des montants réellement confirmés
async function ristournes(p, parts, t) {
    const taux = TAUX_RISTOURNE;
    if (p.typePaiement === 'COMMISSION') {
        // Mode direct : la commission vient d'être effectivement reçue par Kanari
        const m = arrondi(Number(p.montant) * taux / 100);
        if (m > 0 && p.fournisseurId) {
            await ecrire({ cle: `P${p.id}-RIS-F${p.fournisseurId}`, compte: 'RISTOURNE', sens: 'CREDIT', categorie: 'RISTOURNE_PARTENAIRE',
                montant: m, base: Number(p.montant), taux, fournisseurId: p.fournisseurId, paiementId: p.id }, t);
        }
        return;
    }
    const mc = arrondi(Number(p.montant) * taux / 100);
    if (mc > 0 && p.clientId) {
        await ecrire({ cle: `P${p.id}-RIS-C`, compte: 'RISTOURNE', sens: 'CREDIT', categorie: 'RISTOURNE_CLIENT',
            montant: mc, base: Number(p.montant), taux, clientId: p.clientId, paiementId: p.id }, t);
    }
    for (const part of parts) {
        const m = arrondi(part.commission * taux / 100);
        if (m > 0) {
            await ecrire({ cle: `P${p.id}-RIS-F${part.fournisseurId}`, compte: 'RISTOURNE', sens: 'CREDIT', categorie: 'RISTOURNE_PARTENAIRE',
                montant: m, base: part.commission, taux, fournisseurId: part.fournisseurId, paiementId: p.id }, t);
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

module.exports = { TAUX_RISTOURNE, TAUX_SOUTIEN, arrondi, ecrire, soutienActif, ristournes, annulerRistournes, totalCompte, Mouvement, Op };