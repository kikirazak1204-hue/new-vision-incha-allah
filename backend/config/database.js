const { Sequelize } = require('sequelize');
require('dotenv').config();

// 1. On affiche la config AVANT d'initialiser Sequelize
console.log("🔍 DB CONFIG:");
console.log("HOST =", process.env.DB_HOST);
console.log("DB =", process.env.DB_NAME);

// 2. Initialisation propre
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD, // <--- Virgule ici (pas de point-virgule)
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: console.log, // Active le log pour voir les requêtes réelles dans ton terminal
        dialectOptions: {
            connectTimeout: 10000
        }
    }
);

// 3. Log de vérification (à l'extérieur)
console.log("--------------------------------------------------");
console.log("DEBUG : Application connectée à la base :", process.env.DB_NAME);
console.log("--------------------------------------------------");

module.exports = sequelize;