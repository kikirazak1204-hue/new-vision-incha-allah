'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {

        // ══════════════════════════════════════════
        // MISE À JOUR TABLE produits
        // ══════════════════════════════════════════
        const tableDesc = await queryInterface.describeTable('produits');

        const addIfMissing = async (column, definition) => {
            if (!tableDesc[column]) {
                await queryInterface.addColumn('produits', column, definition);
                console.log(`✅ Colonne ajoutée : produits.${column}`);
            } else {
                console.log(`⏭️  Déjà existante : produits.${column}`);
            }
        };

        await addIfMissing('categorie', { type: Sequelize.STRING, allowNull: true });
        await addIfMissing('quantite', { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 });
    },

    async down(queryInterface, Sequelize) {
        const cols = ['categorie', 'quantite'];
        for (const col of cols) {
            await queryInterface.removeColumn('produits', col);
        }
        console.log('✅ Migration annulée');
    }
};