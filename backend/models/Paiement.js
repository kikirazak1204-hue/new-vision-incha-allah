const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Paiement = sequelize.define('Paiement', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // Support des commandes e-commerce
    commandeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'commandes', key: 'id' },
        onDelete: 'CASCADE'
    },

    // Support des missions (réservations)
    reservationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'reservations', key: 'id' },
        onDelete: 'CASCADE'
    },

    // Payeur (client, ou prestataire pour un dépôt de commission)
    clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
    },

    // Partenaire concerné (celui qui est crédité / qui doit la commission)
    fournisseurId: { type: DataTypes.INTEGER, allowNull: true },

    // COMMANDE = vente boutique | MISSION = règlement client d'une mission (Kanari encaisse)
    // COMMISSION = dépôt de commission par le prestataire (mission encaissée en direct)
    typePaiement: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'COMMANDE',
        validate: {
            isIn: {
                args: [['COMMANDE', 'MISSION', 'COMMISSION']],
                msg: "Type de paiement invalide."
            }
        }
    },

    transactionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: 'unique_transaction_id'
    },

    montant: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: { args: [0.01], msg: "Le montant doit être supérieur à zéro." } }
    },

    // Répartition figée au moment du paiement (ne change jamais rétroactivement)
    tauxCommission: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    commissionKanari: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    montantNet: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    soldeCredite: { type: DataTypes.BOOLEAN, defaultValue: false },

    telephone: { type: DataTypes.STRING, allowNull: false },
    nom: { type: DataTypes.STRING, allowNull: false },

    statut: {
        type: DataTypes.STRING(30),
        defaultValue: 'en_attente',
        validate: {
            isIn: {
                args: [['en_attente', 'valide', 'rejete', 'rembourse']],
                msg: "Statut de paiement invalide."
            }
        }
    },

    modePaiement: {
        type: DataTypes.STRING(50),
        defaultValue: 'mobile_money',
        validate: {
            isIn: {
                args: [['mobile_money', 'carte_bancaire', 'depot_kanari', 'especes', 'orange_money', 'moov_money', 'airtel_money', 'amanata', 'mynita', 'virement_bancaire']],
                msg: "Mode de paiement non pris en charge."
            }
        }
    },

    confirmationDate: { type: DataTypes.DATE, allowNull: true },
    messageClient: { type: DataTypes.TEXT, allowNull: true },
    motif: { type: DataTypes.TEXT, allowNull: true },
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