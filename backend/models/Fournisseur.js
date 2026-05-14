const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Fournisseur = sequelize.define('Fournisseur', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
    },
    serviceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'services', key: 'id' },
        onDelete: 'SET NULL'
    },

    // ── Infos de base
    nomEntreprise: {
        type: DataTypes.STRING,
        allowNull: false
    },
    adresse: {
        type: DataTypes.STRING,
        allowNull: true
    },
    quartier: {                          // ✅ nouveau
        type: DataTypes.STRING,
        allowNull: true
    },
    secteur: {
        type: DataTypes.STRING,
        allowNull: true
    },
    telephone: {                         // ✅ nouveau
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {                       // ✅ nouveau
        type: DataTypes.TEXT,
        allowNull: true
    },

    // ── Géolocalisation
    latitude: {                          // ✅ nouveau
        type: DataTypes.FLOAT,
        allowNull: true
    },
    longitude: {                         // ✅ nouveau
        type: DataTypes.FLOAT,
        allowNull: true
    },

    // ── Capacités logistiques
    hasTransport: {                      // ✅ nouveau
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    hasMateriel: {                       // ✅ nouveau
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    // ── Validation New Vision
    statut: {                            // ✅ nouveau — EN_ATTENTE | EN_EVALUATION | CONFORME | SUSPENDU
        type: DataTypes.ENUM('EN_ATTENTE', 'EN_EVALUATION', 'CONFORME', 'SUSPENDU'),
        defaultValue: 'EN_ATTENTE'
    },

    // ── Documents identité (chemins fichiers uploadés)
    cniRecto: {                          // ✅ nouveau
        type: DataTypes.STRING,
        allowNull: true
    },
    cniVerso: {                          // ✅ nouveau
        type: DataTypes.STRING,
        allowNull: true
    },
    selfie: {                            // ✅ nouveau
        type: DataTypes.STRING,
        allowNull: true
    },
    diplome: {                           // ✅ nouveau
        type: DataTypes.STRING,
        allowNull: true
    },
    carteProf: {                         // ✅ nouveau
        type: DataTypes.STRING,
        allowNull: true
    },

    // ── Réputation
    note: {                              // ✅ nouveau
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    nombreAvis: {                        // ✅ nouveau
        type: DataTypes.INTEGER,
        defaultValue: 0
    },

}, {
    tableName: 'fournisseurs',
    timestamps: true
});

module.exports = Fournisseur;