'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {

        const addIfMissing = async (table, column, definition) => {
            try {
                await queryInterface.addColumn(table, column, definition);
                console.log(`✅ Colonne ajoutée : ${table}.${column}`);
            } catch (err) {
                if (err.message.includes('Duplicate column')) {
                    console.log(`⚠️ Déjà existante : ${table}.${column}`);
                } else {
                    throw err;
                }
            }
        };

        // ── Nouvelles colonnes sur fournisseurs ───────────────
        await addIfMissing('fournisseurs', 'fcmToken', {
            type: Sequelize.STRING,
            allowNull: true
        });
        await addIfMissing('fournisseurs', 'codeUnique', {
            type: Sequelize.STRING,
            allowNull: true,
            unique: true
        });

        // ── Nouvelles colonnes sur reservations ───────────────
        await addIfMissing('reservations', 'besoin', {
            type: Sequelize.TEXT,
            allowNull: true
        });
        await addIfMissing('reservations', 'type', {
            type: Sequelize.ENUM('classique', 'planifie', 'contrat'),
            defaultValue: 'classique'
        });
        await addIfMissing('reservations', 'parcours', {
            type: Sequelize.ENUM('assignation', 'direct'),
            defaultValue: 'assignation'
        });
        await addIfMissing('reservations', 'modePaiement', {
            type: Sequelize.ENUM('direct_prestataire', 'depot_kanari'),
            allowNull: true
        });
        await addIfMissing('reservations', 'codePrestataireUtilise', {
            type: Sequelize.STRING,
            allowNull: true
        });
        await addIfMissing('reservations', 'commissionStatut', {
            type: Sequelize.ENUM('en_attente', 'recue', 'en_retard'),
            defaultValue: 'en_attente'
        });
        await addIfMissing('reservations', 'commissionDateLimite', {
            type: Sequelize.DATE,
            allowNull: true
        });
        await addIfMissing('reservations', 'valideAutomatiquement', {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        });

        // ── Création de la table bons_intervention ────────────
        const tables = await queryInterface.showAllTables();
        if (!tables.includes('bons_intervention')) {
            await queryInterface.createTable('bons_intervention', {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                reservationId: {
                    type: Sequelize.INTEGER,
                    allowNull: false
                },
                fournisseurId: {
                    type: Sequelize.INTEGER,
                    allowNull: false
                },
                descriptionTravail: {
                    type: Sequelize.TEXT,
                    allowNull: false
                },
                montantMainOeuvre: {
                    type: Sequelize.DECIMAL(10, 2),
                    allowNull: false
                },
                piecesOutils: {
                    type: Sequelize.TEXT,
                    allowNull: true
                },
                montantPiecesOutils: {
                    type: Sequelize.DECIMAL(10, 2),
                    allowNull: true,
                    defaultValue: 0
                },
                montantFinal: {
                    type: Sequelize.DECIMAL(10, 2),
                    allowNull: false
                },
                valide: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false
                },
                valideLe: {
                    type: Sequelize.DATE,
                    allowNull: true
                },
                valideAutomatiquement: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false
                },
                note: {
                    type: Sequelize.INTEGER,
                    allowNull: true
                },
                commentaire: {
                    type: Sequelize.TEXT,
                    allowNull: true
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
                }
            });
            console.log('✅ Table bons_intervention créée');
        } else {
            console.log('⚠️ Table bons_intervention déjà existante');
        }

        console.log('✅ Migration terminée avec succès');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('bons_intervention');
        await queryInterface.removeColumn('fournisseurs', 'fcmToken');
        await queryInterface.removeColumn('fournisseurs', 'codeUnique');
        const cols = [
            'besoin', 'type', 'parcours', 'modePaiement',
            'codePrestataireUtilise', 'commissionStatut',
            'commissionDateLimite', 'valideAutomatiquement'
        ];
        for (const col of cols) {
            await queryInterface.removeColumn('reservations', col);
        }
        console.log('✅ Migration annulée');
    }
};