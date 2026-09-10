'use strict';

// Deux colonnes confirmées manquantes par les logs de production réels :
//
// 1. reservations.commentaireGlobal — déclarée dans le modèle depuis le
//    tout premier fichier fourni, jamais migrée. Cassait TOUTE requête
//    Reservation sans restriction de colonnes (admin, disponibles,
//    accepter/refuser côté prestataire).
//
// 2. paiements.reservationId — déclarée dans le modèle Paiement et dans
//    l'association models/index.js (Paiement.belongsTo(Reservation)),
//    jamais migrée. Cassait la lecture des paiements côté client ET
//    côté admin dès qu'on incluait Reservation.

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('reservations', 'commentaireGlobal', {
            type: Sequelize.TEXT,
            allowNull: true
        });

        await queryInterface.addColumn('paiements', 'reservationId', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'reservations', key: 'id' },
            onDelete: 'CASCADE'
        });
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn('reservations', 'commentaireGlobal');
        await queryInterface.removeColumn('paiements', 'reservationId');
    }
};