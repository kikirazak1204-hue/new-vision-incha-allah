'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.changeColumn('reservations', 'statut', {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'EN_ATTENTE'
      });
      console.log('✅ Colonne statut modifiée en STRING(50) avec default EN_ATTENTE');
    } catch (err) {
      console.error('❌ Impossible de modifier la colonne statut:', err.message);
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.changeColumn('reservations', 'statut', {
        type: Sequelize.ENUM(
          'EN_ATTENTE', 'ASSIGNEE', 'EN_VALIDATION_ADMIN', 'ACCEPTEE',
          'EN_PREPARATION', 'EN_COURS', 'VALIDEE', 'TERMINEE', 'ANNULEE'
        ),
        allowNull: false,
        defaultValue: 'EN_ATTENTE'
      });
      console.log('✅ Colonne statut restaurée en ENUM');
    } catch (err) {
      console.error('❌ Impossible de restaurer la colonne statut en ENUM:', err.message);
      throw err;
    }
  }
};
