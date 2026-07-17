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
        allowNull: false, // 🟢 CORRECTION : Fini les NULL, on force toujours à un nombre !
        defaultValue: 0.00
    },
    montantFinal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false // Sera calculé automatiquement par le Hook ci-dessous !
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
        allowNull: true,
        validate: {
            min: 1, // 🟢 CORRECTION : Impossible de mettre moins de 1
            max: 5  // 🟢 CORRECTION : Impossible de mettre plus de 5
        }
    },
    commentaire: {
        type: DataTypes.TEXT,
        allowNull: true
    },

}, {
    tableName: 'bons_intervention',
    timestamps: true,

    // 🔥 LA MAGIE EST ICI : LES HOOKS
    hooks: {
        // Avant de valider et d'enregistrer en base de données...
        beforeValidate: (bon) => {
            // 1. On s'assure que les montants sont bien des nombres (ou 0 par défaut)
            const mainOeuvre = parseFloat(bon.montantMainOeuvre) || 0;
            const pieces = parseFloat(bon.montantPiecesOutils) || 0;

            // 2. On nettoie la valeur de pièces pour éviter un NULL en base
            bon.montantMainOeuvre = mainOeuvre;
            bon.montantPiecesOutils = pieces;

            // 3. ON CALCULE LE MONTANT FINAL AUTOMATIQUEMENT !
            // Plus de risque de bug si le frontend oublie de l'envoyer.
            bon.montantFinal = mainOeuvre + pieces;
        }
    }
});

module.exports = BonIntervention;