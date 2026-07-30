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

    // 🛠️ CORRECTION PRODUCTION : STRING au lieu de ENUM
    type: {
        type: DataTypes.STRING(30),
        defaultValue: 'classique',
        validate: {
            isIn: {
                args: [['classique', 'planifie', 'contrat']],
                msg: "Le type de réservation est invalide."
            }
        }
    },

    // 🛠️ CORRECTION PRODUCTION : STRING au lieu de ENUM
    parcours: {
        type: DataTypes.STRING(30),
        defaultValue: 'assignation',
        validate: {
            isIn: {
                args: [['assignation', 'direct']],
                msg: "Le parcours est invalide."
            }
        }
    },

    // 🛠️ CORRECTION PRODUCTION : STRING au lieu de ENUM (Plus de crash MySQL !)
    statut: {
        type: DataTypes.STRING(50),
        defaultValue: 'EN_ATTENTE',
        validate: {
            isIn: {
                args: [[
                    'EN_ATTENTE', 'ASSIGNEE', 'EN_VALIDATION_ADMIN',
                    'ACCEPTEE', 'EN_PREPARATION', 'EN_COURS',
                    'VALIDEE', 'TERMINEE', 'ANNULEE'
                ]],
                msg: "Le statut envoyé par le frontend n'est pas reconnu."
            }
        }
    },

    // 🛠️ CORRECTION PRODUCTION : STRING au lieu de ENUM
    modePaiement: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
            isIn: {
                args: [['direct_prestataire', 'depot_kanari']],
                msg: "Mode de paiement invalide."
            }
        }
    },
    codePrestataireUtilise: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // 🛠️ CORRECTION PRODUCTION : STRING au lieu de ENUM
    commissionStatut: {
        type: DataTypes.STRING(30),
        defaultValue: 'en_attente',
        validate: {
            isIn: {
                args: [['en_attente', 'recue', 'en_retard']],
                msg: "Statut de commission invalide."
            }
        }
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

    // Champs Bon d'intervention 
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