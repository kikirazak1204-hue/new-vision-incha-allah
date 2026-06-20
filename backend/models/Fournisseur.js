const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Fournisseur = sequelize.define('Fournisseur', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    serviceId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'services', key: 'id' }, onDelete: 'SET NULL' },

    nomEntreprise: { type: DataTypes.STRING, allowNull: false },
    adresse: { type: DataTypes.STRING, allowNull: true },
    quartier: { type: DataTypes.STRING, allowNull: true },
    secteur: { type: DataTypes.STRING, allowNull: true },
    telephone: { type: DataTypes.STRING, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },

    latitude: { type: DataTypes.FLOAT, allowNull: true },
    longitude: { type: DataTypes.FLOAT, allowNull: true },

    hasTransport: { type: DataTypes.BOOLEAN, defaultValue: false },
    hasMateriel: { type: DataTypes.BOOLEAN, defaultValue: false },

    statut: {
        type: DataTypes.ENUM('EN_ATTENTE', 'EN_EVALUATION', 'CONFORME', 'SUSPENDU'),
        defaultValue: 'EN_ATTENTE'
    },

    cniRecto: { type: DataTypes.STRING, allowNull: true },
    cniVerso: { type: DataTypes.STRING, allowNull: true },
    selfie: { type: DataTypes.STRING, allowNull: true },
    diplome: { type: DataTypes.STRING, allowNull: true },
    carteProf: { type: DataTypes.STRING, allowNull: true },

    note: { type: DataTypes.FLOAT, defaultValue: 0 },
    nombreAvis: { type: DataTypes.INTEGER, defaultValue: 0 },

    // ── Champs précédemment ajoutés (inscription enrichie) ──
    anneesExperience: { type: DataTypes.STRING, allowNull: true },
    saitLireEcrire: { type: DataTypes.ENUM('oui', 'non'), allowNull: true },
    referenceClient: { type: DataTypes.STRING, allowNull: true },
    immatriculation: { type: DataTypes.STRING, allowNull: true },

    // ── ✅ NOUVEAU : notifications push ──────────────────
    fcmToken: { type: DataTypes.STRING, allowNull: true },

    // ── ✅ NOUVEAU : code unique pour traçage des dépôts ──
    codeUnique: { type: DataTypes.STRING, allowNull: true, unique: true },

}, {
    tableName: 'fournisseurs',
    timestamps: true,
    hooks: {
        beforeCreate: (fournisseur) => {
            // Génère un code unique du type KAN-XXXXXX
            const suffixe = Math.random().toString(36).substring(2, 8).toUpperCase();
            fournisseur.codeUnique = `KAN-${suffixe}`;
        }
    }
});

module.exports = Fournisseur;