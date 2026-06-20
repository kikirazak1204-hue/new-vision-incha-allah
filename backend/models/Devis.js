const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Devis = sequelize.define('Devis', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    reservationId: { type: DataTypes.INTEGER, allowNull: false },
    fournisseurId: { type: DataTypes.INTEGER, allowNull: true }, // ✅ NOUVEAU
    montant: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    description: { type: DataTypes.TEXT },
    statut: {
        type: DataTypes.ENUM('EN_ATTENTE', 'ACCEPTE', 'REFUSE'),
        defaultValue: 'EN_ATTENTE'
    },
}, { tableName: 'devis', timestamps: true });

module.exports = Devis;