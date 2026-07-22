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

    // Statut sans doublons d'accents et aligné avec MySQL
    statut: {
        type: DataTypes.ENUM(
            'EN_ATTENTE',
            'ASSIGNEE',
            'EN_VALIDATION_ADMIN',
            'ACCEPTEE',
            'EN_PREPARATION',
            'EN_COURS',
            'VALIDEE',
            'TERMINEE',
            'ANNULEE'
        ),
        defaultValue: 'EN_ATTENTE'
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

    // Clés étrangères déclarées explicitement
    clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    fournisseurId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'fournisseurs',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    serviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'services',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    serviceNom: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Refus
    refusePar: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    motifRefus: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    valideAutomatiquement: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    // Champs Bon d'intervention (TEXT pour éviter la troncature)
    descriptionTravail: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    montantMainOeuvre: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    piecesFournies: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Reservation',
    tableName: 'reservations',
    freezeTableName: true,
    timestamps: true
});

module.exports = Reservation;