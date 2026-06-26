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
        // allow tools like Postman / mobile apps
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(null, true); 
    },
    // PATCH est inclus
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
// 🗄️ DATABASE & REPAIR (Version MySQL Stricte)
// =====================
const repairDatabase = async () => {
    // Liste des requêtes d'ajout de colonnes séparées
    const queries = [
        "ALTER TABLE reservations ADD COLUMN descriptionTravail TEXT;",
        "ALTER TABLE reservations ADD COLUMN montantMainOeuvre DECIMAL(10,2);",
        "ALTER TABLE reservations ADD COLUMN piecesFournies VARCHAR(255);"
    ];

    console.log("🛠️ Tentative d'ajout des colonnes manquantes...");
    
    // On exécute chaque requête une par une avec un try/catch pour éviter le crash global
    for (let q of queries) {
        try {
            await sequelize.query(q);
            console.log(`✅ Succès : Colonne ajoutée.`);
        } catch (error) {
            // Si l'erreur indique que la colonne existe déjà (Duplicate column), on ignore en douceur
            if (error.message.includes('Duplicate column') || error.message.includes('ER_DUP_FIELDNAME')) {
                console.log(`ℹ️ La colonne existe déjà, on passe à la suite.`);
            } else {
                console.log(`⚠️ Erreur ignorée :`, error.message);
            }
        }
    }
    console.log("✅ Vérification des colonnes terminée.");
};

sequelize.authenticate()
    .then(async () => {
        console.log('✅ Base de données connectée.');
        // 1. On force l'ajout des colonnes via MySQL pur
        await repairDatabase(); 
        // 2. On lance la synchro normale en désactivant alter pour éviter les bugs d'index
        return sequelize.sync({ alter: false }); 
    })
    .then(() => {
        console.log('✅ Tables synchronisées.');
    })
    .catch(err => console.error('❌ Erreur BDD :', err));

// =====================
// 🏠 TEST ROUTE
// =====================
app.get('/', (req, res) => {
    res.json({
        message: '🌍 API New Vision Opérationnelle',
        statut: '✅ Online',
        timestamp: new Date()
    });
});

// =====================
// 📦 ROUTES API
// =====================
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
// ❌ 404 HANDLER
// =====================
app.use((req, res) => {
    console.log(`🚫 404 - ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'Route introuvable'
    });
});

// =====================
// 🚀 START SERVER
// =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});