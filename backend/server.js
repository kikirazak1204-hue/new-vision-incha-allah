require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importation de la connexion Sequelize
const { sequelize } = require('./models');

const app = express();

// ==========================================
// 1. MIDDLEWARES DE SÉCURITÉ & PARSING
// ==========================================

// Configuration CORS dynamique
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsing du JSON et des données de formulaires
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
// 3. ENREGISTREMENT DES ROUTES API
// ==========================================

// Enregistrement des routes API essentielles
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

    // Capture spécifique des erreurs Sequelize / MySQL
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

    // Erreur générique
    res.status(err.status || 500).json({
        error: err.message || 'Erreur interne du serveur.'
    });
});

// ==========================================
// 6. INITIALISATION ET DÉMARRAGE
// ==========================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Vérification de la connexion à MySQL
        await sequelize.authenticate();
        console.log('✅ Connexion réussie à la base de données MySQL.');

        // ==============================================================
        // 🚀 SCRIPT TEMPORAIRE POUR AIVEN (Contournement Proxy Bureau)
        // ==============================================================
        try {
            console.log("⏳ Exécution de la mise à jour de la table reservations sur Aiven...");
            await sequelize.query(`
                ALTER TABLE reservations 
                MODIFY statut VARCHAR(50) DEFAULT 'EN_ATTENTE',
                MODIFY type VARCHAR(30) DEFAULT 'classique',
                MODIFY parcours VARCHAR(30) DEFAULT 'assignation',
                MODIFY modePaiement VARCHAR(50) NULL,
                MODIFY commissionStatut VARCHAR(30) DEFAULT 'en_attente';
            `);
            console.log("✅ SUCCÈS : BASE AIVEN MISE À JOUR DEPUIS RENDER !");
        } catch (e) {
            console.log("⚠️ Info SQL (la table est peut-être déjà à jour) :", e.message);
        }
        // ==============================================================

        // Note : Évite { alter: true } en production pour ne pas altérer la structure par accident
        // await sequelize.sync(); 

        app.listen(PORT, () => {
            console.log(`🚀 Serveur en écoute sur le port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Impossible de se connecter à la base de données :', error);
        process.exit(1);
    }
};

startServer();

// Arrêt propre du serveur en cas d'interruption
process.on('SIGINT', async () => {
    console.log('\nFermeture du serveur et des connexions DB...');
    await sequelize.close();
    process.exit(0);
});