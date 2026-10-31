const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Journal des mouvements (jamais modifié, jamais effacé : une erreur se corrige par un mouvement inverse).
// compte : GAINS (argent retirable) | RISTOURNE (récompenses 1,5 %) | SOUTIEN (fonds de soutien, hors revenus Kanari)
// Un mouvement appartient à un partenaire (fournisseurId) OU à un client (clientId).
// "cle" est unique : elle empêche tout double crédit (ex. "P12-GAINS-F3").
const MouvementPortefeuille = sequelize.define('MouvementPortefeuille', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cle: { type: DataTypes.STRING(80), allowNull: false, unique: 'mouvement_cle_unique' },
    compte: { type: DataTypes.STRING(12), allowNull: false },
    sens: { type: DataTypes.STRING(6), allowNull: false },          // CREDIT | DEBIT
    categorie: { type: DataTypes.STRING(24), allowNull: false },    // VENTE, MISSION, RETRAIT, RISTOURNE_CLIENT, RISTOURNE_PARTENAIRE, SOUTIEN, ANNULATION, CORRECTION, UTILISATION
    montant: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    base: { type: DataTypes.DECIMAL(12, 2), allowNull: true },      // montant sur lequel le taux a été appliqué
    taux: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    soldeApres: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    fournisseurId: { type: DataTypes.INTEGER, allowNull: true },
    clientId: { type: DataTypes.INTEGER, allowNull: true },
    paiementId: { type: DataTypes.INTEGER, allowNull: true },
    retraitId: { type: DataTypes.INTEGER, allowNull: true },
    auteurId: { type: DataTypes.INTEGER, allowNull: true },
    motif: { type: DataTypes.TEXT, allowNull: true }
}, {
    tableName: 'mouvements_portefeuille',
    timestamps: true, updatedAt: false,
    indexes: [{ fields: ['fournisseurId', 'compte'] }, { fields: ['clientId', 'compte'] }, { fields: ['paiementId'] }]
});

module.exports = MouvementPortefeuille;