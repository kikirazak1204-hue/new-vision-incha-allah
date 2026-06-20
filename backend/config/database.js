const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log("🔍 DB CONFIG:");
console.log("HOST =", process.env.DB_HOST);
console.log("PORT =", process.env.DB_PORT);
console.log("USER =", process.env.DB_USER);
console.log("DB =", process.env.DB_NAME);

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
            connectTimeout: 10000
        }
    }
);

module.exports = sequelize;