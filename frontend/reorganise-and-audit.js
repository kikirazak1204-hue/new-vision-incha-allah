const fs = require('fs');
const path = require('path');

console.log('🔧 Réorganisation + Audit du frontend New Vision...\n');

// 🔁 Dossiers cibles
const targets = {
    'index.html': '.',
    'vite.config.js': '.',
    'postcss.config.js': '.',
    'main.jsx': 'src',
    'App.jsx': 'src',
    'Accueil.jsx': 'src/components',
    'api.js': 'src/utils',
    'assets/': 'src/assets',
};

// 🔍 Fichiers à déplacer (corrigé pour ignorer les dossiers déjà bien placés)
Object.entries(targets).forEach(([filename, correctDir]) => {
    const correctPath = path.join(correctDir, filename);
    const isFolder = filename.endsWith('/');

    if (isFolder) {
        // Vérifie que le dossier existe
        if (!fs.existsSync(correctPath)) {
            fs.mkdirSync(correctPath, { recursive: true });
            console.log(`📁 Dossier créé : ${correctPath}`);
        } else {
            console.log(`📁 Dossier déjà présent : ${correctPath}`);
        }
        return;
    }

    // Fichier à déplacer
    const searchDirs = ['.', 'src', 'src/components', 'src/pages', 'src/utils'];
    let foundPath = null;
    for (const dir of searchDirs) {
        const testPath = path.join(dir, filename);
        if (fs.existsSync(testPath)) {
            foundPath = testPath;
            break;
        }
    }

    if (foundPath && foundPath !== correctPath) {
        const destDir = path.dirname(correctPath);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        fs.renameSync(foundPath, correctPath);
        console.log(`🔄 ${filename} déplacé vers ${correctDir}/`);
    } else if (fs.existsSync(correctPath)) {
        console.log(`✅ ${filename} → OK`);
    } else {
        console.log(`❌ ${filename} → Manquant`);
    }
});

// 🔗 Vérification des imports
console.log('\n🔗 Vérification des liens entre fichiers...\n');

const checkImport = (from, mustInclude) => {
    const filePath = path.join(from);
    if (!fs.existsSync(filePath)) {
        console.log(`❌ ${from} → Fichier introuvable`);
        return;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes(mustInclude)) {
        console.log(`✅ ${from} importe ${mustInclude}`);
    } else {
        console.log(`❌ ${from} n'importe pas ${mustInclude}`);
    }
};

checkImport('src/main.jsx', 'App');
checkImport('src/App.jsx', 'Accueil');
checkImport('src/components/Accueil.jsx', 'fetchData');
