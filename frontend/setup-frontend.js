const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Initialisation du frontend New Vision...\n');

// 1. Créer les dossiers
['src/utils', 'src/assets'].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Dossier créé : ${dir}`);
    } else {
        console.log(`📁 Dossier déjà présent : ${dir}`);
    }
});

// 2. Déplacer index.html si mal placé
const srcIndex = path.join('src', 'index.html');
const rootIndex = 'index.html';

if (fs.existsSync(srcIndex)) {
    fs.renameSync(srcIndex, rootIndex);
    console.log('🔄 index.html déplacé de src/ vers racine');
} else if (fs.existsSync(rootIndex)) {
    console.log('✅ index.html déjà à la racine');
} else {
    console.log('❌ index.html introuvable — à créer manuellement');
}

// 3. Créer vite.config.js
const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 }
});
`;

if (!fs.existsSync('vite.config.js')) {
    fs.writeFileSync('vite.config.js', viteConfig);
    console.log('✅ vite.config.js créé');
} else {
    console.log('⚠️ vite.config.js déjà présent');
}

// 4. Créer postcss.config.js
const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
`;

if (!fs.existsSync('postcss.config.js')) {
    fs.writeFileSync('postcss.config.js', postcssConfig);
    console.log('✅ postcss.config.js créé');
} else {
    console.log('⚠️ postcss.config.js déjà présent');
}

// 5. Créer src/utils/api.js
const apiJs = `export const API_BASE = 'http://localhost:5000/api';

export async function fetchData(endpoint) {
  const res = await fetch(\`\${API_BASE}/\${endpoint}\`);
  if (!res.ok) throw new Error('Erreur API');
  return res.json();
}
`;

const apiPath = path.join('src', 'utils', 'api.js');
if (!fs.existsSync(apiPath)) {
    fs.writeFileSync(apiPath, apiJs);
    console.log('✅ src/utils/api.js créé');
} else {
    console.log('⚠️ src/utils/api.js déjà présent');
}

// 6. Installer les dépendances
console.log('\n📦 Installation des dépendances...');
execSync('npm install', { stdio: 'inherit' });

// 7. Lancer le serveur
console.log('\n🚀 Lancement du frontend New Vision...');
execSync('npm run dev', { stdio: 'inherit' });
