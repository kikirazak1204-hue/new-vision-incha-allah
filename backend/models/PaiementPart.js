const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Ventilation d'un paiement par partenaire : qui reçoit quoi (brut, commission Kanari, net).
// Un panier multi-fournisseurs = 1 paiement du client, N lignes ici.
const PaiementPart = sequelize.define('PaiementPart', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paiementId: { type: DataTypes.INTEGER, allowNull: false },
    fournisseurId: { type: DataTypes.INTEGER, allowNull: false },
    montant: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },     // produits + part de livraison
    commission: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    net: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    taux: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 }
}, {
    tableName: 'paiement_parts',
    timestamps: false,
    indexes: [{ fields: ['paiementId'] }, { fields: ['fournisseurId'] }]
});

module.exports = PaiementPart;