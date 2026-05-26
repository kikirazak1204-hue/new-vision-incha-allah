const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

// Détection automatique : si on est sur Render ou qu'on utilise Aiven, on force la production
const isProduction = process.env.NODE_ENV === 'production' || (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com'));

const sequelize = new Sequelize(
    isProduction ? process.env.DB_NAME : 'newvision',
    isProduction ? process.env.DB_USER : 'root',
    isProduction ? process.env.DB_PASSWORD : 'kikirazak1204',
    {
        host: isProduction ? process.env.DB_HOST : '127.0.0.1',
        port: isProduction ? (process.env.DB_PORT || 27361) : 3306,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 60000,
            idle: 10000,
            evict: 5000,
        },
        dialectOptions: isProduction ? {
            connectTimeout: 60000,
            ssl: {
                rejectUnauthorized: false // Indispensable pour Aiven en ligne
            }
        } : {
            connectTimeout: 60000
        },
        retry: {
            max: 3
        }
    }
);

// Test immédiat au démarrage du serveur
sequelize.authenticate()
    .then(() => console.log('🚀 Connexion à la base de données réussie avec succès !'))
    .catch((e) => console.error('❌ Échec initial de connexion à la BDD:', e.message));

setInterval(async () => {
    try {
        await sequelize.authenticate();
    } catch (e) {
        console.error('⚠️ DB ping échoué:', e.message);
    }
}, 4 * 60 * 1000);

module.exports = sequelize;