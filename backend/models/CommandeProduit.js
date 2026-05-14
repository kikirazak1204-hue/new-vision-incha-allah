const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Commande = require('./Commande');
const Produit = require('./Produit');

const CommandeProduit = sequelize.define('CommandeProduit', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    commandeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'commandes',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    produitId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'produits',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    quantite: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    tableName: 'commande_produits',
    timestamps: true
});


module.exports = CommandeProduit;
