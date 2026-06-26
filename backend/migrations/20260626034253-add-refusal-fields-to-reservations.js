'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // On récupère la structure actuelle de la table
    const tableDefinition = await queryInterface.describeTable('reservations');

    // 1. Ajout de refusePar uniquement s'il n'existe pas
    if (!tableDefinition.refusePar) {
      await queryInterface.addColumn('reservations', 'refusePar', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // 2. Ajout de motifRefus uniquement s'il n'existe pas
    if (!tableDefinition.motifRefus) {
      await queryInterface.addColumn('reservations', 'motifRefus', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    // 3. Ajout de valideAutomatiquement uniquement s'il n'existe pas
    if (!tableDefinition.valideAutomatiquement) {
      await queryInterface.addColumn('reservations', 'valideAutomatiquement', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('reservations');

    if (tableDefinition.valideAutomatiquement) {
      await queryInterface.removeColumn('reservations', 'valideAutomatiquement');
    }
    if (tableDefinition.motifRefus) {
      await queryInterface.removeColumn('reservations', 'motifRefus');
    }
    if (tableDefinition.refusePar) {
      await queryInterface.removeColumn('reservations', 'refusePar');
    }
  }
};