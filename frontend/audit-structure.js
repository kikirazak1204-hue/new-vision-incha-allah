const fs = require('fs');
const path = require('path');

console.log('🔍 Audit de la structure du frontend New Vision...\n');

const expectedStructure = {
    'index.html': 'root',
    'vite.config.js': 'root',
    'postcss.config.js': 'root',
    'src/main.jsx': 'src',
    'src/App.jsx': 'src',
    'src/components/Accueil.jsx': 'src/components',
    'src/utils/api.js': 'src/utils',
    'src/assets/': 'src/assets',
};

const links = [
    { from: 'src/main.jsx', mustImport: 'App' },
    { from: 'src/App.jsx', mustImport: 'Accueil' },
    { from: 'src/components/Accueil.jsx', mustImport: 'fetchData' },
];

function checkStructure() {
    Object.entries(expectedStructure).forEach(([file, location]) => {
        const fullPath = path.join(location, path.basename(file));
        if (fs.existsSync(fullPath)) {
            console.log(`✅ ${file} → OK`);
        } else {
            console.log(`❌ ${file} → Manquant ou mal placé`);
        }
    });
}

function checkImports() {
    console.log('\n🔗 Vérification des liens entre fichiers...\n');
    links.forEach(({ from, mustImport }) => {
        const filePath = path.join(from);
        if (!fs.existsSync(filePath)) {
            console.log(`❌ ${from} → Fichier introuvable`);
            return;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes(mustImport)) {
            console.log(`✅ ${from} importe ${mustImport}`);
        } else {
            console.log(`❌ ${from} n'importe pas ${mustImport}`);
        }
    });
}

checkStructure();
checkImports();
