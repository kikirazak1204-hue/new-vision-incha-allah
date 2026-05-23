const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 60000,
            idle: 10000,
            evict: 5000,
        },
        dialectOptions: {
            connectTimeout: 60000,
            keepAlive: true,
        },
        retry: {
            max: 3
        }
    }
);

module.exports = sequelize;