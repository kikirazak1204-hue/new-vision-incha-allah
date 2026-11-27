const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  dossierId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  typeDocument: {
    type: DataTypes.ENUM('CNI', 'PASSEPORT', 'CV', 'DIPLOME', 'RCCM', 'NIF', 'CASIER', 'AUTRE'),
    allowNull: false,
  },
  titre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fichierUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  dateExpiration: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  statutVerification: {
    type: DataTypes.ENUM('EN_ATTENTE', 'VALIDE', 'REJETE'),
    defaultValue: 'EN_ATTENTE',
  },
  motifRejet: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  verifiePar: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  verifieLe: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'documents_utilisateur',
  timestamps: true,
});

module.exports = Document;