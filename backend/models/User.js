const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false
    },
    prenom: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    telephone: DataTypes.STRING,
    role: {
        type: DataTypes.STRING,
        defaultValue: 'utilisateur'
    },
    ville: DataTypes.STRING,
    // 💡 CORRECTION ICI : Utilisation de fcmToken en JS, lié à fcm_token en BDD
    fcmToken: {
        type: DataTypes.TEXT,
        field: 'fcm_token', 
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true
});

module.exports = User;