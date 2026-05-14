const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const CommandeProduit = require('./CommandeProduit');
const Fournisseur = require('./Fournisseur');

const Commande = sequelize.define('Commande', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
    },
    fournisseurId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'fournisseurs', key: 'id' },
        onDelete: 'SET NULL'
    },
    statut: {
        type: DataTypes.ENUM('en_attente', 'validée', 'annulée', 'livrée'),
        defaultValue: 'en_attente'
    },
    fraisLivraison: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    montantTotal: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
}, {
    tableName: 'commandes',
    timestamps: true
});


module.exports = Commande;
