const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
    clientId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    transactionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: 'unique_transaction_id'
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
        unique: 'unique_reference_client'
    }
}, {
    tableName: 'paiements',
    timestamps: true
});

module.exports = Paiement;