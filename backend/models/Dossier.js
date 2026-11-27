const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Dossier = sequelize.define('Dossier', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  matricule: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  quartier: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  adresseDetaillee: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  personneUrgenceNom: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  personneUrgenceTel: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  specialites: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  statutDossier: {
    type: DataTypes.ENUM('INCOMPLET', 'EN_VERIFICATION', 'VALIDE', 'A_METTRE_A_JOUR'),
    defaultValue: 'INCOMPLET',
  },
  noteAdmin: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'dossiers',
  timestamps: true,
});

module.exports = Dossier;