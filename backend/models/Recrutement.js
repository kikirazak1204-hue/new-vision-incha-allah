const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Recrutement = sequelize.define('Recrutement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  posteVise: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sourceCandidature: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  etape: {
    type: DataTypes.ENUM('NOUVEAU', 'PRESELECTION', 'ENTRETIEN', 'TEST_TERRAIN', 'RETENU', 'REFUSE'),
    defaultValue: 'NOUVEAU',
  },
  noteEvaluation: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
  },
  compteRendu: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  dateEntretien: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  evaluePar: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'recrutements',
  timestamps: true,
});

module.exports = Recrutement;