const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('./models');

dotenv.config();

const app = express();

// =====================
// 📁 Upload folder
// =====================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// =====================
// 🌐 CORS CONFIG
// =====================
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'https://kanari-service.vercel.app',
            'https://incha-allah-v2.vercel.app',
            'https://new-vision-incha-allah.vercel.app'
        ];
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(null, true); 
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// =====================
// 🧠 MIDDLEWARES
// =====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

// =====================
// 🗄️ DATABASE & REPAIR
// =====================
const repairDatabase = async () => {
    try {
        await sequelize.query(`
            ALTER TABLE reservations 
            ADD COLUMN IF NOT EXISTS descriptionTravail TEXT,
            ADD COLUMN IF NOT EXISTS montantMainOeuvre DECIMAL(10,2),
            ADD COLUMN IF NOT EXISTS piecesFournies VARCHAR(255);
        `);
        console.log("✅ Colonnes vérifiées/créées avec succès.");
    } catch (error) {
        console.log("⚠️ Note: Les colonnes existent déjà ou erreur de structure:", error.message);
    }
};

sequelize.authenticate()
    .then(async () => {
        console.log('✅ Base de données connectée.');
        await repairDatabase(); // Force la structure avant le sync
        return sequelize.sync({ alter: false }); 
    })
    .then(() => {
        console.log('✅ Tables synchronisées.');
    })
    .catch(err => console.error('❌ Erreur BDD :', err));

// =====================
// 🏠 TEST ROUTE & ROUTES API
// =====================
app.get('/', (req, res) => {
    res.json({ message: '🌍 API New Vision Opérationnelle', statut: '✅ Online' });
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
app.use('/api/bons-intervention', require('./routes/bonsIntervention'));
app.use('/api/soldes', require('./routes/soldes'));
app.use('/api/paiements', require('./routes/paiement'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/seed', require('./routes/seedRoute'));

// =====================
// 🚀 START SERVER
// =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});