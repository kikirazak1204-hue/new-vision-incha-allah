const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceBranche = sequelize.define('ServiceBranche', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    serviceId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'services', key: 'id' }, onDelete: 'CASCADE' },
    nom: { type: DataTypes.STRING(120), allowNull: false },
    actif: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
    tableName: 'service_branches', freezeTableName: true, timestamps: true,
    indexes: [{ unique: true, fields: ['serviceId', 'nom'] }]
});

const FournisseurBranche = sequelize.define('FournisseurBranche', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fournisseurId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'fournisseurs', key: 'id' }, onDelete: 'CASCADE' },
    brancheId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'service_branches', key: 'id' }, onDelete: 'CASCADE' }
}, {
    tableName: 'fournisseur_branches', freezeTableName: true, timestamps: true,
    indexes: [{ unique: true, fields: ['fournisseurId', 'brancheId'] }]
});

module.exports = { ServiceBranche, FournisseurBranche };