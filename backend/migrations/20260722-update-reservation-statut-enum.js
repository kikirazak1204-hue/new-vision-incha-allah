'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            await queryInterface.changeColumn('reservations', 'statut', {
                type: Sequelize.ENUM(
                    // Valeurs en minuscules (utilisées dans ton controller Node.js)
                    'en_attente',
                    'assigne',
                    'en_validation_admin',
                    'accepte',
                    'en_preparation',
                    'en_cours',
                    'validee',
                    'termine',
                    'annulee',
                    // Valeurs en majuscules (si présent dans d'autres parties)
                    'EN_ATTENTE',
                    'ASSIGNEE',
                    'EN_VALIDATION_ADMIN',
                    'ACCEPTEE',
                    'EN_PREPARATION',
                    'EN_COURS',
                    'VALIDEE',
                    'TERMINEE',
                    'TERMINÉE',
                    'ANNULEE'
                ),
                defaultValue: 'en_attente',
                allowNull: true
            });

            console.log('✅ Colonne statut mise à jour avec succès dans reservations');
        } catch (err) {
            console.error('❌ Erreur lors de la modification du statut :', err.message);
            throw err;
        }
    },

    async down(queryInterface, Sequelize) {
        try {
            // En cas de retour en arrière, on repasse en VARCHAR simple pour éviter les blocages ENUM
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