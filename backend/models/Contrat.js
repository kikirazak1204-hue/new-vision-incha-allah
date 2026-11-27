const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contrat = sequelize.define('Contrat', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  referenceContrat: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  typeContrat: {
    type: DataTypes.ENUM('PRESTATION', 'PARTENARIAT_B2B', 'STAGE', 'CDD', 'CDI'),
    allowNull: false,
  },
  titre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  tauxCommission: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  montantConvenu: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  fichierContratUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fichierSigneUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  statut: {
    type: DataTypes.ENUM('BROUILLON', 'ENVOYE', 'SIGNE', 'EXPIRE', 'RESILIE'),
    defaultValue: 'BROUILLON',
  },
  signeLe: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'contrats',
  timestamps: true,
});

module.exports = Contrat;