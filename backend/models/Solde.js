const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Solde = sequelize.define('Solde', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fournisseurId: { type: DataTypes.INTEGER, allowNull: false },
    solde: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    totalGagne: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    totalRetire: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
}, { tableName: 'soldes', timestamps: false });

module.exports = Solde;