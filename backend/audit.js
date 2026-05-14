const fs = require('fs');
const path = require('path');

const expectedStructure = {
    'server.js': 'root',
    'package.json': 'root',
    'config/database.js': 'config',
    'models/index.js': 'models',
    'models/User.js': 'models',
    'models/Fournisseur.js': 'models',
    'models/Produit.js': 'models',
    'models/Commande.js': 'models',
    'models/CommandeProduit.js': 'models',
    'models/Facture.js': 'models',
    'routes/auth.js': 'routes',
    'routes/users.js': 'routes',
    'routes/fournisseurs.js': 'routes',
    'routes/produits.js': 'routes',
    'routes/commandes.js': 'routes',
    'routes/commandeProduits.js': 'routes',
    'routes/factures.js': 'routes',
    'scripts/setup-test.js': 'scripts'
};

console.log('🔍 Audit du projet New Vision...\n');

let allGood = true;

for (const [filePath, folder] of Object.entries(expectedStructure)) {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${filePath} → OK`);
    } else {
        console.log(`❌ ${filePath} → Manquant ou mal placé`);
        allGood = false;
    }
}

if (allGood) {
    console.log('\n🎉 Tous les fichiers sont bien placés et liés. Ton projet est prêt à fonctionner !');
} else {
    console.log('\n⚠️ Des fichiers sont manquants ou mal placés. Corrige-les pour garantir la compatibilité.');
}
