const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reservation = sequelize.define('Reservation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    clientId: {
        type: DataTypes.INTEGER,
        allowNull: true, // ✅ V1 sans compte
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
    },
    fournisseurId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'fournisseurs', key: 'id' },
        onDelete: 'CASCADE'
    },
    serviceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'services', key: 'id' },
        onDelete: 'SET NULL'
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: true // ✅ vocal uniquement = pas de description écrite
    },
    dateSouhaitee: {
        type: DataTypes.DATE,
        allowNull: true
    },
    adresseIntervention: {
        type: DataTypes.STRING,
        allowNull: true // ✅ front V1 n'envoie plus ce champ
    },

    telephone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    clientNom: {
        type: DataTypes.STRING,
        allowNull: true
    },
    serviceNom: {
        type: DataTypes.STRING,
        allowNull: true
    },
    photo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    audio: {
        type: DataTypes.STRING,
        allowNull: true
    },

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

    montantTotal: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    acompte: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    acomptePaye: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    paiementLibere: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    manqueMateriel: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    descriptionMateriel: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    noteClient: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    commentaireClient: {
        type: DataTypes.TEXT,
        allowNull: true
    },

}, {
    tableName: 'reservations',
    timestamps: true
});

module.exports = Reservation;