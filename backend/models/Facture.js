const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Commande = require('./Commande');
const User = require('./User');
const Fournisseur = require('./Fournisseur');

const Facture = sequelize.define('Facture', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    commandeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'commandes', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    },
    fournisseurId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'fournisseurs', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    },
    clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    },
    montantTotal: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    dateEmission: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    statut: {
        type: DataTypes.ENUM('en_attente', 'payée', 'annulée'),
        allowNull: false,
        defaultValue: 'en_attente'
    },
    reference: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'factures',
    timestamps: true
});



module.exports = Facture;
