const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Paiement = sequelize.define('Paiement', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    // Support des commandes e-commerce
    commandeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'commandes',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },

    // Support optionnel des réservations de services
    reservationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'reservations',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },

    // Liaison sécurisée avec l'utilisateur
    clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },

    transactionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: 'unique_transaction_id'
    },

    // 💡 Remplacement de FLOAT par DECIMAL pour éviter les erreurs d'arrondi
    montant: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: {
                args: [0.01],
                msg: "Le montant doit être supérieur à zéro."
            }
        }
    },

    telephone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false
    },

    // Contrôle d'intégrité du statut
    statut: {
        type: DataTypes.STRING(30),
        defaultValue: 'en_attente',
        validate: {
            isIn: {
                args: [['en_attente', 'valide', 'rejete']],
                msg: "Statut de paiement invalide."
            }
        }
    },

    // Validation des modes de paiement
    modePaiement: {
        type: DataTypes.STRING(50),
        defaultValue: 'mobile_money',
        validate: {
            isIn: {
                args: [['mobile_money', 'carte_bancaire', 'depot_kanari', 'especes']],
                msg: "Mode de paiement non pris en charge."
            }
        }
    },

    confirmationDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    messageClient: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    referenceClient: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: 'unique_reference_client'
    }
}, {
    tableName: 'paiements',
    timestamps: true
});

module.exports = Paiement;