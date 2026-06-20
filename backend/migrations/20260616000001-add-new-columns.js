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

        // ── Nouvelles colonnes fournisseurs ───────────────────
        await addIfMissing('fournisseurs', 'anneesExperience', {
            type: Sequelize.STRING,
            allowNull: true
        });
        await addIfMissing('fournisseurs', 'saitLireEcrire', {
            type: Sequelize.ENUM('oui', 'non'),
            allowNull: true
        });
        await addIfMissing('fournisseurs', 'referenceClient', {
            type: Sequelize.STRING,
            allowNull: true
        });
        await addIfMissing('fournisseurs', 'immatriculation', {
            type: Sequelize.STRING,
            allowNull: true
        });

        // ── fournisseurId dans devis ───────────────────────────
        await addIfMissing('devis', 'fournisseurId', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'fournisseurs', key: 'id' },
            onDelete: 'SET NULL'
        });

        console.log('✅ Migration nouvelles colonnes terminée');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('fournisseurs', 'anneesExperience');
        await queryInterface.removeColumn('fournisseurs', 'saitLireEcrire');
        await queryInterface.removeColumn('fournisseurs', 'referenceClient');
        await queryInterface.removeColumn('fournisseurs', 'immatriculation');
        await queryInterface.removeColumn('devis', 'fournisseurId');
        console.log('✅ Migration annulée');
    }
};