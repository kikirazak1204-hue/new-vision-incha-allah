'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {

        // ══════════════════════════════════════════
        // 1. MISE À JOUR TABLE fournisseurs
        // ══════════════════════════════════════════
        const tableDesc = await queryInterface.describeTable('fournisseurs');

        const addIfMissing = async (column, definition) => {
            if (!tableDesc[column]) {
                await queryInterface.addColumn('fournisseurs', column, definition);
                console.log(`✅ Colonne ajoutée : fournisseurs.${column}`);
            } else {
                console.log(`⏭️  Déjà existante : fournisseurs.${column}`);
            }
        };

        await addIfMissing('quartier', { type: Sequelize.STRING, allowNull: true });
        await addIfMissing('telephone', { type: Sequelize.STRING, allowNull: true });
        await addIfMissing('description', { type: Sequelize.TEXT, allowNull: true });
        await addIfMissing('latitude', { type: Sequelize.FLOAT, allowNull: true });
        await addIfMissing('longitude', { type: Sequelize.FLOAT, allowNull: true });
        await addIfMissing('hasTransport', { type: Sequelize.BOOLEAN, defaultValue: false });
        await addIfMissing('hasMateriel', { type: Sequelize.BOOLEAN, defaultValue: false });
        await addIfMissing('statut', {
            type: Sequelize.ENUM('EN_ATTENTE', 'EN_EVALUATION', 'CONFORME', 'SUSPENDU'),
            defaultValue: 'EN_ATTENTE'
        });
        await addIfMissing('cniRecto', { type: Sequelize.STRING, allowNull: true });
        await addIfMissing('cniVerso', { type: Sequelize.STRING, allowNull: true });
        await addIfMissing('selfie', { type: Sequelize.STRING, allowNull: true });
        await addIfMissing('diplome', { type: Sequelize.STRING, allowNull: true });
        await addIfMissing('carteProf', { type: Sequelize.STRING, allowNull: true });
        await addIfMissing('note', { type: Sequelize.FLOAT, defaultValue: 0 });
        await addIfMissing('nombreAvis', { type: Sequelize.INTEGER, defaultValue: 0 });

        // ══════════════════════════════════════════
        // 2. CRÉATION TABLE reservations
        // ══════════════════════════════════════════
        const tables = await queryInterface.showAllTables();

        if (!tables.includes('reservations')) {
            await queryInterface.createTable('reservations', {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                clientId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'users', key: 'id' },
                    onDelete: 'CASCADE'
                },
                fournisseurId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: { model: 'fournisseurs', key: 'id' },
                    onDelete: 'CASCADE'
                },
                serviceId: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: { model: 'services', key: 'id' },
                    onDelete: 'SET NULL'
                },
                description: {
                    type: Sequelize.TEXT,
                    allowNull: false
                },
                dateSouhaitee: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                adresseIntervention: {
                    type: Sequelize.STRING,
                    allowNull: false
                },
                statut: {
                    type: Sequelize.ENUM(
                        'EN_ATTENTE', 'ACCEPTEE', 'EN_PREPARATION',
                        'EN_COURS', 'TERMINEE', 'VALIDEE', 'ANNULEE'
                    ),
                    defaultValue: 'EN_ATTENTE'
                },
                acompte: { type: Sequelize.FLOAT, allowNull: true },
                montantTotal: { type: Sequelize.FLOAT, allowNull: true },
                acomptePaye: { type: Sequelize.BOOLEAN, defaultValue: false },
                paiementLibere: { type: Sequelize.BOOLEAN, defaultValue: false },
                manqueMateriel: { type: Sequelize.BOOLEAN, defaultValue: false },
                descriptionMateriel: { type: Sequelize.TEXT, allowNull: true },
                noteClient: { type: Sequelize.INTEGER, allowNull: true },
                commentaireClient: { type: Sequelize.TEXT, allowNull: true },
                createdAt: {
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.NOW
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.NOW
                }
            });
            console.log('✅ Table reservations créée');
        } else {
            console.log('⏭️  Table reservations déjà existante');
        }
    },

    async down(queryInterface, Sequelize) {
        // Supprimer la table reservations
        await queryInterface.dropTable('reservations');

        // Supprimer les colonnes ajoutées à fournisseurs
        const cols = [
            'quartier', 'telephone', 'description', 'latitude', 'longitude',
            'hasTransport', 'hasMateriel', 'statut', 'cniRecto', 'cniVerso',
            'selfie', 'diplome', 'carteProf', 'note', 'nombreAvis'
        ];
        for (const col of cols) {
            await queryInterface.removeColumn('fournisseurs', col);
        }
        console.log('✅ Migration annulée');
    }
};