const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Retrait = sequelize.define('Retrait', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fournisseurId: { type: DataTypes.INTEGER, allowNull: true },     // renseigné si le demandeur est un partenaire
    userId: { type: DataTypes.INTEGER, allowNull: true },            // demandeur (client ou partenaire)
    source: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'GAINS' }, // GAINS | RISTOURNE | DEPOT
    montant: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    operateur: {
        type: DataTypes.STRING(20), allowNull: false,
        validate: { isIn: { args: [['ORANGE', 'MOOV', 'AIRTEL', 'MYNITA', 'AMANA', 'BANQUE']], msg: 'Opérateur non pris en charge.' } }
    },
    telephone: { type: DataTypes.STRING(40), allowNull: false },    // numéro ou compte bancaire
    statut: { type: DataTypes.ENUM('EN_ATTENTE', 'TRAITE', 'REFUSE'), defaultValue: 'EN_ATTENTE' },
    reference: { type: DataTypes.STRING(80), allowNull: true },     // référence du transfert fait par Kanari
    motif: { type: DataTypes.TEXT, allowNull: true },               // motif du refus
    traitePar: { type: DataTypes.INTEGER, allowNull: true },
    traiteLe: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'retraits', timestamps: true });

module.exports = Retrait;