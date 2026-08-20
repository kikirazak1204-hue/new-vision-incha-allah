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
        allowNull: true
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
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    // 💡 Ajout de l'heure d'intervention
    heureIntervention: {
        type: DataTypes.STRING(20),
        allowNull: true
    },

    // Stockage JSON des services (compatible MySQL Aiven)
    services: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },

    montantTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00
    },
    commentaireGlobal: {
        type: DataTypes.TEXT,
        allowNull: true
    },

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
                msg: "Statut de réservation invalide."
            }
        }
    },

    // 💡 Mise à jour des modes de paiement acceptés par le système
    modePaiement: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
            isIn: {
                args: [['mobile_money', 'carte_bancaire', 'especes', 'depot_kanari', 'direct_prestataire']],
                msg: "Mode de paiement non pris en charge."
            }
        }
    },

    // 💡 Ajout du suivi de l'état financier du dossier
    statutPaiement: {
        type: DataTypes.STRING(30),
        defaultValue: 'non_paye',
        validate: {
            isIn: {
                args: [['non_paye', 'en_attente', 'paye', 'echoue']],
                msg: "Statut de paiement invalide."
            }
        }
    },

    codePrestataireUtilise: {
        type: DataTypes.STRING,
        allowNull: true
    },

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

    // Clés étrangères
    clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
    },
    fournisseurId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'fournisseurs', key: 'id' },
        onDelete: 'SET NULL'
    },
    serviceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'services', key: 'id' },
        onDelete: 'SET NULL'
    },
    serviceNom: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Refus
    refusePar: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
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

    // Bon d'intervention 
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