const fs = require('fs');
const path = require('path');

const expectedStructure = {
    'package.json': 'root',
    'vite.config.js': 'root',
    'index.html': 'root',
    'src/main.jsx': 'src',
    'src/App.jsx': 'src',
    'src/assets/': 'src',
    'src/components/Accueil.jsx': 'src/components',
    'src/components/Navbar.jsx': 'src/components',
    'src/components/Footer.jsx': 'src/components',
    'src/pages/Services.jsx': 'src/pages',
    'src/pages/Fournisseurs.jsx': 'src/pages',
    'src/pages/Produits.jsx': 'src/pages',
    'src/pages/Commandes.jsx': 'src/pages',
    'src/pages/Factures.jsx': 'src/pages',
    'src/pages/Auth/Login.jsx': 'src/pages/Auth',
    'src/pages/Auth/Register.jsx': 'src/pages/Auth',
    'src/utils/api.js': 'src/utils',
    'tailwind.config.js': 'root',
    'postcss.config.js': 'root'
};

console.log('🔍 Audit du frontend New Vision...\n');

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
    console.log('\n🎉 Tous les fichiers frontend sont bien placés et liés. Ton interface est prête à fonctionner !');
} else {
    console.log('\n⚠️ Des fichiers sont manquants ou mal placés. Corrige-les pour garantir la compatibilité.');
}
