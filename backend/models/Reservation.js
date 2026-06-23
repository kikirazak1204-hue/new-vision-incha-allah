const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reservation = sequelize.define('Reservation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    besoin: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    adresse: {
        type: DataTypes.STRING,
        allowNull: false
    },
    telephone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    clientNom: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dateIntervention: {
        type: DataTypes.DATE,
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('classique', 'planifie', 'contrat'),
        defaultValue: 'classique'
    },
    parcours: {
        type: DataTypes.ENUM('assignation', 'direct'),
        defaultValue: 'assignation'
    },

    // ── ✅ Statuts mis à jour avec double validation ──────
    statut: {
        type: DataTypes.ENUM(
            'en_attente',          // Réservation reçue, pas encore assignée
            'assigne',              // Admin a assigné un prestataire
            'en_validation_admin',  // Presta a accepté, attend ton feu vert
            'accepte',              // Toi tu as autorisé le démarrage
            'en_cours',             // Mission démarrée par le presta
            'termine',              // Bon d'intervention rempli par le presta
            'valide',               // Client a validé le bon d'intervention
            'annule'                // Annulée à n'importe quelle étape
        ),
        defaultValue: 'en_attente'
    },

    modePaiement: {
        type: DataTypes.ENUM('direct_prestataire', 'depot_kanari'),
        allowNull: true
    },
    codePrestataireUtilise: {
        type: DataTypes.STRING,
        allowNull: true
    },
    commissionStatut: {
        type: DataTypes.ENUM('en_attente', 'recue', 'en_retard'),
        defaultValue: 'en_attente'
    },
    commissionDateLimite: {
        type: DataTypes.DATE,
        allowNull: true
    },

    clientId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    fournisseurId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    serviceId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    serviceNom: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // ── ✅ Trace du refus presta pour réassignation ────────
    refusePar: {
        type: DataTypes.INTEGER,
        allowNull: true // dernier fournisseurId ayant refusé, pour ne pas le réassigner par erreur
    },
    motifRefus: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    valideAutomatiquement: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
}, {
    tableName: 'reservations',
    timestamps: true
});

module.exports = Reservation;
