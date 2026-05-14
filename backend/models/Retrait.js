const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Retrait = sequelize.define('Retrait', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fournisseurId: { type: DataTypes.INTEGER, allowNull: false },
    montant: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    operateur: { type: DataTypes.ENUM('ORANGE', 'AIRTEL', 'MYNITA', 'AMANA'), allowNull: false },
    telephone: { type: DataTypes.STRING(20), allowNull: false },
    statut: { type: DataTypes.ENUM('EN_ATTENTE', 'TRAITE', 'REFUSE'), defaultValue: 'EN_ATTENTE' },
}, { tableName: 'retraits', timestamps: true });

module.exports = Retrait;