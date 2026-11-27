const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false
    },
    prenom: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    telephone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Rôle métier de l'utilisateur (ex: 'utilisateur', 'client', 'fournisseur', 'prestataire', 'partenaire', 'candidat')
    role: {
        type: DataTypes.STRING,
        defaultValue: 'utilisateur'
    },
    // Habilitation d'administration séparée du rôle métier (ex: null, 'super_admin', 'rh_recrutement', 'conformite_kyc', 'contrats_finance')
    roleAdmin: {
        type: DataTypes.STRING,
        field: 'role_admin',
        allowNull: true,
        defaultValue: null
    },
    statutCompte: {
        type: DataTypes.STRING,
        field: 'statut_compte',
        allowNull: false,
        defaultValue: 'ACTIF'
    },
    ville: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // 💡 Conservation de fcmToken en JS, lié à fcm_token en BDD
    fcmToken: {
        type: DataTypes.TEXT,
        field: 'fcm_token',
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true
});

module.exports = User;