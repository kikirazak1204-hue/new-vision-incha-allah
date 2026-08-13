'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            await queryInterface.changeColumn('reservations', 'statut', {
                type: Sequelize.STRING(50),
                defaultValue: 'en_attente',
                allowNull: true
            });

            console.log('✅ Colonne statut convertie en STRING avec succès dans reservations (anti-bug ENUM)');
        } catch (err) {
            console.error('❌ Erreur lors de la modification du statut :', err.message);
            throw err;
        }
    },

    async down(queryInterface, Sequelize) {
        try {
            await queryInterface.changeColumn('reservations', 'statut', {
                type: Sequelize.STRING,
                defaultValue: 'en_attente',
                allowNull: true
            });

            console.log('✅ Migration statut annulée avec succès');
        } catch (err) {
            console.error('❌ Erreur lors de l\'annulation de la migration :', err.message);
            throw err;
        }
    }
};