const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Commande = require('./Commande');

const Paiement = sequelize.define('Paiement', {
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
    transactionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    montant: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    telephone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false
    },
    statut: {
        type: DataTypes.STRING,
        defaultValue: 'en_attente'
    },
    modePaiement: {
        type: DataTypes.STRING,
        defaultValue: 'mobile_money'
    },
    confirmationDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    messageClient: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    referenceClient: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    }
}, {
    tableName: 'paiements',
    timestamps: true
});

Paiement.belongsTo(Commande, { foreignKey: 'commandeId', as: 'commande' });

module.exports = Paiement;
