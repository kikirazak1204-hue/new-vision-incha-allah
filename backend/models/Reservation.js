const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reservation = sequelize.define('Reservation', {
    // Clé primaire
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Champs de base
    besoin: { type: DataTypes.TEXT, allowNull: false },
    adresse: { type: DataTypes.STRING, allowNull: false },
    telephone: { type: DataTypes.STRING, allowNull: false },
    clientNom: { type: DataTypes.STRING, allowNull: true },
    dateIntervention: { type: DataTypes.DATE, allowNull: true },
    
    type: {
        type: DataTypes.ENUM('classique', 'planifie', 'contrat'),
        defaultValue: 'classique'
    },
    parcours: {
        type: DataTypes.ENUM('assignation', 'direct'),
        defaultValue: 'assignation'
    },

    // Statut : Alignés sur ta base de données (Majuscules)
    statut: {
        type: DataTypes.ENUM(
            'EN_ATTENTE',
            'ACCEPTEE',
            'EN_PREPARATION',
            'EN_COURS',
            'TERMINEE',
            'VALIDEE',
            'ANNULEE'
        ),
        defaultValue: 'EN_ATTENTE'
    },

    modePaiement: { 
        type: DataTypes.ENUM('direct_prestataire', 'depot_kanari'), 
        allowNull: true 
    },
    codePrestataireUtilise: { type: DataTypes.STRING, allowNull: true },
    
    commissionStatut: { 
        type: DataTypes.ENUM('en_attente', 'recue', 'en_retard'), 
        defaultValue: 'en_attente' 
    },
    commissionDateLimite: { type: DataTypes.DATE, allowNull: true },

    // Clés étrangères
    clientId: { type: DataTypes.INTEGER, allowNull: true },
    fournisseurId: { type: DataTypes.INTEGER, allowNull: true },
    serviceId: { type: DataTypes.INTEGER, allowNull: false },
    serviceNom: { type: DataTypes.STRING, allowNull: true },

    // Refus
    refusePar: { type: DataTypes.INTEGER, allowNull: true },
    motifRefus: { type: DataTypes.TEXT, allowNull: true },

    valideAutomatiquement: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
    },

    // Nouveaux champs (Bon d'intervention)
    descriptionTravail: { type: DataTypes.TEXT, allowNull: true },
    montantMainOeuvre: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    piecesFournies: { type: DataTypes.STRING, allowNull: true }
}, {
    sequelize, // L'instance Sequelize
    modelName: 'Reservation',
    tableName: 'reservations', // Important : nom exact de la table en BDD
    freezeTableName: true,     // Empêche Sequelize de modifier le nom
    timestamps: true           // Gère createdAt et updatedAt
});

module.exports = Reservation;