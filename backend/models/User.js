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
    // Ajout du prénom si présent dans la table agent
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
        // On passe en STRING pour plus de souplesse avec MySQL
        type: DataTypes.STRING,
        defaultValue: 'utilisateur'
    },
    ville: DataTypes.STRING,
    // Suppression de 'verified' et 'avatar' s'ils n'existent pas dans ta table 'agent' 
    // pour éviter les erreurs SQL "Unknown Column"
}, {
    // 🎯 ON CIBLE LA BONNE TABLE ICI
    tableName: 'users',
    timestamps: true
});

module.exports = User;