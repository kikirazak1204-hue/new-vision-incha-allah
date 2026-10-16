'use strict';
// Migration MySQL : paiements par mission/commande, commission figée, facture rattachée au paiement.
// Idempotente : n'ajoute une colonne ou un index que s'il n'existe pas déjà.

module.exports = {
    async up(queryInterface, Sequelize) {
        const { DataTypes } = Sequelize;
        const ajouter = async (table, colonne, definition) => {
            const desc = await queryInterface.describeTable(table);
            if (!desc[colonne]) await queryInterface.addColumn(table, colonne, definition);
        };

        // ── paiements ──
        await ajouter('paiements', 'typePaiement', { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'COMMANDE' });
        await ajouter('paiements', 'fournisseurId', { type: DataTypes.INTEGER, allowNull: true });
        await ajouter('paiements', 'tauxCommission', { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 });
        await ajouter('paiements', 'commissionKanari', { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 });
        await ajouter('paiements', 'montantNet', { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 });
        await ajouter('paiements', 'soldeCredite', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await ajouter('paiements', 'motif', { type: DataTypes.TEXT, allowNull: true });

        // Anciens paiements de missions
        await queryInterface.sequelize.query(
            "UPDATE `paiements` SET `typePaiement` = 'MISSION' WHERE `reservationId` IS NOT NULL AND `typePaiement` = 'COMMANDE'"
        );

        // ── factures ──
        await ajouter('factures', 'reservationId', { type: DataTypes.INTEGER, allowNull: true });
        await ajouter('factures', 'paiementId', { type: DataTypes.INTEGER, allowNull: true });
        await ajouter('factures', 'commissionKanari', { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 });
        await ajouter('factures', 'montantNet', { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 });

        // ── index (MySQL accepte plusieurs NULL dans un index unique) ──
        const indexExiste = async (table, nom) => (await queryInterface.showIndex(table)).some((i) => i.name === nom);
        if (!(await indexExiste('factures', 'factures_paiement_unique'))) {
            await queryInterface.addIndex('factures', ['paiementId'], { unique: true, name: 'factures_paiement_unique' });
        }
        if (!(await indexExiste('paiements', 'paiements_cible_idx'))) {
            await queryInterface.addIndex('paiements', ['commandeId', 'reservationId', 'typePaiement', 'statut'], { name: 'paiements_cible_idx' });
        }
    },

    async down(queryInterface) {
        const retirer = async (table, colonne) => {
            const desc = await queryInterface.describeTable(table);
            if (desc[colonne]) await queryInterface.removeColumn(table, colonne);
        };
        const indexExiste = async (table, nom) => (await queryInterface.showIndex(table)).some((i) => i.name === nom);

        if (await indexExiste('paiements', 'paiements_cible_idx')) await queryInterface.removeIndex('paiements', 'paiements_cible_idx');
        if (await indexExiste('factures', 'factures_paiement_unique')) await queryInterface.removeIndex('factures', 'factures_paiement_unique');

        for (const c of ['montantNet', 'commissionKanari', 'paiementId', 'reservationId']) await retirer('factures', c);
        for (const c of ['motif', 'soldeCredite', 'montantNet', 'commissionKanari', 'tauxCommission', 'fournisseurId', 'typePaiement']) await retirer('paiements', c);
    }
};