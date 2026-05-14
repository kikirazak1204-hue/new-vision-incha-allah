const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Service = sequelize.define('Service', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false
    },
    emoji: DataTypes.STRING,
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: DataTypes.TEXT
}, {
    tableName: 'services',
    timestamps: true
});

module.exports = Service;
