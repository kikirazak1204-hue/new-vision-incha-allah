const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./models');
const fs = require('fs');
const path = require('path');

// ── Configuration initiale ─────────────────────────────────────
dotenv.config();
const app = express();

// ── Création du dossier uploads ────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ── Configuration CORS ─────────────────────────────────────────
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://incha-allah-v2.vercel.app'
    ],
    credentials: true
}));

// ── Middlewares ────────────────────────────────────────────────
// ⚠️ IMPORTANT: JSON parser APRÈS multer routes pour les form-data
// Pour l'instant, on applique partout mais multer gère /api/reservations
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Connexion BDD ──────────────────────────────────────────────
sequelize.authenticate()
    .then(() => {
        console.log('✅ Base de données connectée.');
        return sequelize.sync({ alter: false });
    })
    .then(() => {
        console.log('✅ Tables synchronisées.');
    })
    .catch(err => console.error('❌ Erreur BDD :', err));
// ── Route de test ──────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        message: '🌍 API New Vision Opérationnelle',
        statut: '✅ Online',
        timestamp: new Date()
    });
});

// ── ROUTES API (toujours AVANT le 404) ────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/fournisseurs', require('./routes/fournisseurs'));
app.use('/api/produits', require('./routes/produits'));
app.use('/api/commandes', require('./routes/commandes'));
app.use('/api/factures', require('./routes/factures'));
app.use('/api/services', require('./routes/services'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/missions', require('./routes/missions'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/devis', require('./routes/devis'));
app.use('/api/soldes', require('./routes/soldes'));
app.use('/api/paiements', require('./routes/paiement'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/whatsapp', require('./routes/whatsapp'));


// ── 404 — toujours EN DERNIER ──────────────────────────────────
app.use((req, res) => {
    console.log(`🚫 404 - Route non trouvée : ${req.method} ${req.originalUrl}`);
    res.status(404).json({ success: false, message: 'Route introuvable sur le serveur.' });
});

// ── Lancement ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur New Vision démarré sur le port ${PORT}`);
    console.log(`📡 URL : http://localhost:${PORT}`);
});