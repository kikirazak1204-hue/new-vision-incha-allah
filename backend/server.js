const cors = require('cors');
const express = require('express');
const dotenv = require('dotenv');
const { sequelize } = require('./models');
const fs = require('fs');
const path = require('path');

dotenv.config();
const app = express();

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://incha-allah-v2.vercel.app',
    'https://new-vision-incha-allah.vercel.app'
];

const extraOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];

const trustedOrigins = [...new Set([...allowedOrigins, ...extraOrigins])];
const allowAllOrigins = process.env.ALLOW_ALL_ORIGINS === 'true';

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowAllOrigins || trustedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`CORS origin non autorisé : ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Preflight pour toutes les routes
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

sequelize.authenticate()
    .then(() => {
        console.log('✅ Base de données connectée.');
        return sequelize.sync({ alter: false });
    })
    .then(() => {
        console.log('✅ Tables synchronisées.');
    })
    .catch(err => console.error('❌ Erreur BDD :', err));

app.get('/', (req, res) => {
    res.json({
        message: '🌍 API New Vision Opérationnelle',
        statut: '✅ Online',
        timestamp: new Date()
    });
});

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
app.use('/api/seed', require('./routes/seedRoute'));

app.use((req, res) => {
    console.log(`🚫 404 - Route non trouvée : ${req.method} ${req.originalUrl}`);
    res.status(404).json({ success: false, message: 'Route introuvable sur le serveur.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur New Vision démarré sur le port ${PORT}`);
    console.log(`📡 URL : http://localhost:${PORT}`);
});