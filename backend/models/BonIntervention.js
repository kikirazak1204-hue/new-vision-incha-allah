const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BonIntervention = sequelize.define('BonIntervention', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    reservationId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fournisseurId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    // ── Rempli par le prestataire ──────────────────────
    descriptionTravail: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    montantMainOeuvre: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    piecesOutils: {
        type: DataTypes.TEXT,
        allowNull: true // optionnel
    },
    montantPiecesOutils: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
    },
    montantFinal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false // mainOeuvre + piecesOutils
    },

    // ── Validation côté client ─────────────────────────
    valide: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    valideLe: {
        type: DataTypes.DATE,
        allowNull: true
    },
    valideAutomatiquement: {
        type: DataTypes.BOOLEAN,
        defaultValue: false // true si validé après 24h sans action client
    },

    // ── Note optionnelle du client ──────────────────────
    note: {
        type: DataTypes.INTEGER,
        allowNull: true // 1 à 5
    },
    commentaire: {
        type: DataTypes.TEXT,
        allowNull: true
    },

}, {
    tableName: 'bons_intervention',
    timestamps: true
});

module.exports = BonIntervention;