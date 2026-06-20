const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reservation = sequelize.define('Reservation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // ── Infos du besoin ──────────────────────────────
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
        allowNull: true // client peut réserver sans compte
    },
    dateIntervention: {
        type: DataTypes.DATE,
        allowNull: true // utile pour type 'planifie' et 'contrat'
    },

    // ── Type de réservation ──────────────────────────
    type: {
        type: DataTypes.ENUM('classique', 'planifie', 'contrat'),
        defaultValue: 'classique'
    },

    // ── Parcours d'origine ───────────────────────────
    parcours: {
        type: DataTypes.ENUM('assignation', 'direct'),
        defaultValue: 'assignation'
        // 'assignation' = Parcours 1 (Kanari choisit le presta)
        // 'direct' = Parcours 2 (client a choisi un presta précis)
    },

    // ── Statut de suivi ───────────────────────────────
    statut: {
        type: DataTypes.ENUM(
            'en_attente',
            'assigne',
            'accepte',
            'en_cours',
            'termine',
            'valide',
            'annule'
        ),
        defaultValue: 'en_attente'
    },

    // ── Paiement / Commission ─────────────────────────
    modePaiement: {
        type: DataTypes.ENUM('direct_prestataire', 'depot_kanari'),
        allowNull: true
        // direct_prestataire : client paie le presta, qui reverse 15% à Kanari
        // depot_kanari : client paie Kanari, qui reverse 85% au presta
    },
    codePrestataireUtilise: {
        type: DataTypes.STRING,
        allowNull: true // code unique du presta utilisé pour tracer le dépôt
    },
    commissionStatut: {
        type: DataTypes.ENUM('en_attente', 'recue', 'en_retard'),
        defaultValue: 'en_attente'
    },
    commissionDateLimite: {
        type: DataTypes.DATE,
        allowNull: true // se calcule à la validation : +48h ou +72h
    },

    // ── Relations ──────────────────────────────────────
    clientId: {
        type: DataTypes.INTEGER,
        allowNull: true // peut réserver sans compte
    },
    fournisseurId: {
        type: DataTypes.INTEGER,
        allowNull: true // null si parcours 'assignation' tant que non assigné
    },
    serviceId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    serviceNom: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // ── Validation automatique ────────────────────────
    valideAutomatiquement: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
}, {
    tableName: 'reservations',
    timestamps: true
});

module.exports = Reservation;