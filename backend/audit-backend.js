const fs = require('fs');
const path = require('path');
const sequelize = require('./config/database');
const models = require('./models');

(async () => {
    try {
        console.log('🔍 Audit du backend en cours...\n');

        // 1. Vérifier la connexion à la base
        await sequelize.authenticate();
        console.log('✅ Connexion à la base réussie');

        // 2. Vérifier que tous les modèles sont bien des instances Sequelize
        const modelNames = Object.keys(models).filter(name => name !== 'sequelize');
        for (const name of modelNames) {
            const model = models[name];
            if (typeof model?.findAll !== 'function') {
                console.error(`❌ Modèle "${name}" invalide ou mal exporté`);
            } else {
                console.log(`✅ Modèle "${name}" reconnu`);
            }
        }

        // 3. Vérifier les fichiers du dossier models
        const modelDir = path.join(__dirname, 'models');
        const modelFiles = fs.readdirSync(modelDir);
        for (const file of modelFiles) {
            const ext = path.extname(file);
            const base = path.basename(file, ext);
            if (ext === '.js' && base.toLowerCase() !== base) {
                console.warn(`⚠️ Fichier "${file}" a une casse mixte → recommande "${base.toLowerCase()}.js"`);
            }
        }

        // 4. Vérifier les routes
        const routeDir = path.join(__dirname, 'routes');
        if (fs.existsSync(routeDir)) {
            const routeFiles = fs.readdirSync(routeDir);
            for (const file of routeFiles) {
                const routePath = path.join(routeDir, file);
                const content = fs.readFileSync(routePath, 'utf-8');
                for (const name of modelNames) {
                    const expectedImport = `require('../models/${name}')`;
                    if (!content.includes(expectedImport)) {
                        console.warn(`⚠️ Route "${file}" n'importe pas explicitement "${name}"`);
                    }
                }
            }
        }

        console.log('\n🎉 Audit terminé. Ton backend est prêt à briller !');

        await sequelize.close();
    } catch (error) {
        console.error('❌ Erreur pendant l’audit :', error.message);
    }
})();
