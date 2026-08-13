require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Importation de la connexion Sequelize
const { sequelize } = require('./models');

// ==========================================
// 🔥 INITIALISATION FIREBASE ADMIN SDK
// ==========================================
try {
    require('./config/firebase-admin');
} catch (fbErr) {
    console.warn('⚠️ Firebase Admin n’a pas pu être chargé au démarrage :', fbErr.message);
}

const app = express();

// ==========================================
// 📁 UPLOADS — dossier + route statique
// ==========================================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Dossier "uploads" créé automatiquement.');
}

// ==========================================
// 1. MIDDLEWARES DE SÉCURITÉ & PARSING
// ==========================================

app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sert les fichiers uploadés (images produits, CNI, selfies...)
app.use('/uploads', express.static(uploadDir));

// ==========================================
// 2. ROUTES DE DIAGNOSTIC (Health Check)
// ==========================================

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// ==========================================
// 3. ENREGISTREMENT DES ROUTES API (Avec Priorité Globale)
// ==========================================

// 🌍 ROUTE GLOBALE DE RÉSERVATION (MULTI-SERVICES)
// Placée stratégiquement ICI pour éviter tout conflit 404 avec le routeur de réservations
app.post('/api/reservations/global', async (req, res) => {
    try {
        const {
            clientNom,
            telephone,
            adresse,
            dateIntervention,
            modePaiement,
            commentaireGlobal,
            fournisseurId,
            services
        } = req.body;

        // Validation rapide
        if (!clientNom || !telephone || !adresse || !services || !Array.isArray(services) || services.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Informations incomplètes pour enregistrer le projet."
            });
        }

        const simulatedId = "kanari_proj_" + Date.now();

        console.log("✅ Projet global reçu par Kanari Backend :", {
            client: clientNom,
            telephone,
            totalServices: services.length,
            modePaiement
        });

        // Réponse envoyée au frontend
        return res.status(201).json({
            success: true,
            id: simulatedId,
            message: "Projet global enregistré avec succès !"
        });

    } catch (error) {
        console.error("❌ Erreur serveur /api/reservations/global :", error);
        return res.status(500).json({
            success: false,
            message: "Erreur interne du serveur Kanari."
        });
    }
});

// Enregistrement des autres routeurs
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/paiements', require('./routes/paiement'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/produits', require('./routes/produits'));
app.use('/api/services', require('./routes/services'));
app.use('/api/fournisseurs', require('./routes/fournisseurs'));
app.use('/api/bons-intervention', require('./routes/bonsIntervention'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/devis', require('./routes/devis'));
app.use('/api/commandes', require('./routes/commandes'));
app.use('/api/commande-produits', require('./routes/commandeProduits'));
app.use('/api/factures', require('./routes/factures'));
app.use('/api/soldes', require('./routes/soldes'));
app.use('/api/missions', require('./routes/missions'));
app.use('/api/whatsapp', require('./routes/whatsapp'));

// ==========================================
// 4. GESTION DES ROUTES INEXISTANTES (404)
// ==========================================

app.use((req, res, next) => {
    res.status(404).json({
        error: `La route demandée ${req.originalUrl} n'existe pas sur ce serveur.`
    });
});

// ==========================================
// 5. MIDDLEWARE GLOBAL DE GESTION D'ERREURS
// ==========================================

app.use((err, req, res, next) => {
    console.error('❌ ERREUR SERVEUR :', err);

    if (err.name === 'SequelizeDatabaseError') {
        return res.status(400).json({
            error: 'Erreur SQL (données tronquées, type invalide ou contrainte violée).',
            details: err.message
        });
    }

    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            error: 'Erreur de validation des champs.',
            details: err.errors.map(e => e.message)
        });
    }

    if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Jeton d’authentification invalide ou expiré.' });
    }

    return res.status(err.status || 500).json({
        error: err.message || 'Erreur interne du serveur.'
    });
});

// ==========================================
// 🛠️ RÉPARATION AUTOMATIQUE DE COLONNES
// ==========================================
const repairDatabase = async () => {
    const queries = [
        "ALTER TABLE produits ADD COLUMN categorie VARCHAR(255);",
        "ALTER TABLE produits ADD COLUMN quantite INT DEFAULT 0;",
        "ALTER TABLE users ADD COLUMN fcm_token TEXT;"
    ];

    console.log("🛠️ Vérification des colonnes manquantes...");
    for (const q of queries) {
        try {
            await sequelize.query(q);
            console.log(`✅ Colonne ajoutée : ${q}`);
        } catch (error) {
            if (error.message.includes('Duplicate column') || error.message.includes('ER_DUP_FIELDNAME')) {
                console.log(`ℹ️ Déjà présente, ignorée.`);
            } else {
                console.log(`⚠️ Erreur ignorée :`, error.message);
            }
        }
    }
    console.log("✅ Vérification des colonnes terminée.");
};

// ==========================================
// 6. INITIALISATION ET DÉMARRAGE
// ==========================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // 1. Connexion MySQL
        await sequelize.authenticate();
        console.log('✅ Connexion réussie à la base de données MySQL.');

        // 2. Ajout des colonnes requises si absentes
        await repairDatabase();

        // 3. Synchronisation Sequelize globale
        await sequelize.sync();
        console.log('✅ Base de données synchronisée.');

        // 4. Lancement d'Express
        app.listen(PORT, () => {
            console.log(`🚀 Serveur en écoute sur le port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Impossible de se connecter ou de synchroniser la base de données :', error);
        process.exit(1);
    }
};

startServer();

// Arrêt propre du serveur
process.on('SIGINT', async () => {
    console.log('\nFermeture du serveur et des connexions DB...');
    await sequelize.close();
    process.exit(0);
});