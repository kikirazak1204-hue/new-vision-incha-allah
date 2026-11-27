require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Importation de la connexion Sequelize
const { sequelize } = require('./models');

// Job planifié : validation automatique des bons d'intervention après 24h
const { runAutoValiderBonsIntervention } = require('./jobs/autoValiderBonsIntervention');
const { runCreerVisitesAbonnements } = require('./jobs/creerVisitesAbonnements');

// ==========================================
// 🔥 INITIALISATION FIREBASE ADMIN SDK
// ==========================================
let firebaseBucket = null;
try {
    const admin = require('./config/firebase-admin');
    firebaseBucket = admin.storage().bucket();
    console.log('✅ Firebase Storage initialisé avec succès pour les images.');
} catch (fbErr) {
    console.warn('⚠️ Firebase Admin ou Storage n’a pas pu être chargé :', fbErr.message);
}

const app = express();

// ==========================================
// 🛡️ NETTOYEUR DE DOUBLE SLASH (Anti-404 URL)
// ==========================================
app.use((req, res, next) => {
    if (req.url.includes('//')) {
        req.url = req.url.replace(/\/+/g, '/');
    }
    next();
});

// ==========================================
// 📁 UPLOADS — dossier de secours local (fallback)
// ==========================================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Dossier "uploads" de secours créé automatiquement.');
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

// Sert les fichiers uploadés en local (si Firebase n'est pas utilisé pour un fichier spécifique)
app.use('/uploads', express.static(uploadDir));

// ==========================================
// 2. ROUTES DE DIAGNOSTIC (Health Check)
// ==========================================
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date(),
        uptime: process.uptime(),
        firebaseStorageActive: !!firebaseBucket
    });
});

// ==========================================
// 4. ENREGISTREMENT DES ROUTES API
// ==========================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/admin', require('./routes/admin'));

// Route dédiée Dossiers 360°, KYC, Contrats, Recrutement & Audit
const adminDossiersRoutePath = path.join(__dirname, 'routes', 'adminDossiers.js');
if (fs.existsSync(adminDossiersRoutePath)) {
    app.use('/api/admin/dossiers', require('./routes/adminDossiers'));
} else {
    console.warn('⚠️ Route ./routes/adminDossiers.js non trouvée : /api/admin/dossiers sera activée dès création du fichier.');
}

app.use('/api/paiements', require('./routes/paiement'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/produits', require('./routes/produits'));
app.use('/api/services', require('./routes/services'));
app.use('/api/fournisseurs', require('./routes/fournisseurs'));
app.use('/api/bons-intervention', require('./routes/bonsIntervention'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/devis', require('./routes/devis'));
app.use('/api/commandes', require('./routes/commandes'));
app.use('/api/factures', require('./routes/factures'));
app.use('/api/soldes', require('./routes/soldes'));
app.use('/api/missions', require('./routes/missions'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/abonnements', require('./routes/abonnements'));
app.use('/api/branches', require('./routes/branches'));

// ==========================================
// 5. GESTION DES ROUTES INEXISTANTES (404)
// ==========================================
app.use((req, res, next) => {
    res.status(404).json({
        error: `La route demandée ${req.originalUrl} n'existe pas sur ce serveur.`
    });
});

// ==========================================
// 6. MIDDLEWARE GLOBAL DE GESTION D'ERREURS
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
// 🛠️ RÉPARATION AUTOMATIQUE DE COLONNES & TABLES
// ==========================================
const repairDatabase = async () => {
    const queries = [
        "ALTER TABLE produits ADD COLUMN categorie VARCHAR(255);",
        "ALTER TABLE produits ADD COLUMN quantite INT DEFAULT 0;",
        "ALTER TABLE users ADD COLUMN fcm_token TEXT;",
        "ALTER TABLE users ADD COLUMN role_admin VARCHAR(255) NULL;",
        "ALTER TABLE users ADD COLUMN statut_compte VARCHAR(50) NOT NULL DEFAULT 'ACTIF';",
        "ALTER TABLE reservations ADD COLUMN services JSON;",
        "ALTER TABLE reservations ADD COLUMN montantTotal DECIMAL(10,2) DEFAULT 0;",
        "ALTER TABLE reservations ADD COLUMN type VARCHAR(50) DEFAULT 'classique';",
        "ALTER TABLE reservations ADD COLUMN parcours VARCHAR(50);",
        "ALTER TABLE reservations ADD COLUMN statutPaiement VARCHAR(50) DEFAULT 'non_paye';",
        "ALTER TABLE reservations ADD COLUMN commissionStatut VARCHAR(50) DEFAULT 'en_attente';",
        "ALTER TABLE reservations ADD COLUMN clientId INT;",
        "ALTER TABLE reservations ADD COLUMN fournisseurId INT;",
        "ALTER TABLE reservations ADD COLUMN serviceId INT;",
        "ALTER TABLE reservations ADD COLUMN serviceNom VARCHAR(255);",
        "ALTER TABLE reservations ADD COLUMN valideAutomatiquement BOOLEAN DEFAULT false;",
        "ALTER TABLE reservations ADD COLUMN besoin TEXT;",
        "ALTER TABLE reservations ADD COLUMN heureIntervention VARCHAR(20);",
        "ALTER TABLE services ADD COLUMN categorie VARCHAR(50) DEFAULT 'default';",
        "ALTER TABLE reservations ADD COLUMN commentaireGlobal TEXT;",
        "ALTER TABLE paiements ADD COLUMN reservationId INT;",
        "ALTER TABLE reservations ADD COLUMN abonnementId INT;",
        "ALTER TABLE reservations ADD COLUMN fournisseurPrevuId INT;",
        "ALTER TABLE reservations ADD COLUMN absent BOOLEAN DEFAULT false;",
        "ALTER TABLE reservations ADD COLUMN motifAbsence TEXT;",
        "ALTER TABLE reservations ADD COLUMN demarreLe DATETIME;",
        "ALTER TABLE bons_intervention ADD COLUMN valideParAdmin BOOLEAN DEFAULT false;",
        "ALTER TABLE bons_intervention ADD COLUMN tauxCommissionApplique DECIMAL(5,2) DEFAULT 0;",
        "ALTER TABLE bons_intervention ADD COLUMN montantCommission DECIMAL(10,2) DEFAULT 0;",
        "ALTER TABLE bons_intervention ADD COLUMN montantNet DECIMAL(10,2) DEFAULT 0;",
        "ALTER TABLE paiements ADD COLUMN typePaiement VARCHAR(20) NOT NULL DEFAULT 'COMMANDE';",
        "ALTER TABLE paiements ADD COLUMN fournisseurId INT NULL;",
        "ALTER TABLE paiements ADD COLUMN tauxCommission DECIMAL(5,2) NOT NULL DEFAULT 0;",
        "ALTER TABLE paiements ADD COLUMN commissionKanari DECIMAL(12,2) NOT NULL DEFAULT 0;",
        "ALTER TABLE paiements ADD COLUMN montantNet DECIMAL(12,2) NOT NULL DEFAULT 0;",
        "ALTER TABLE paiements ADD COLUMN soldeCredite BOOLEAN NOT NULL DEFAULT false;",
        "ALTER TABLE paiements ADD COLUMN motif TEXT;",
        "UPDATE paiements SET typePaiement = 'MISSION' WHERE reservationId IS NOT NULL AND typePaiement = 'COMMANDE';",
        "ALTER TABLE factures ADD COLUMN reservationId INT NULL;",
        "ALTER TABLE factures ADD COLUMN paiementId INT NULL;",
        "ALTER TABLE factures ADD COLUMN commissionKanari DECIMAL(12,2) DEFAULT 0;",
        "ALTER TABLE factures ADD COLUMN montantNet DECIMAL(12,2) DEFAULT 0;",
        "ALTER TABLE reservations ADD COLUMN modePaiement VARCHAR(50);",
        "ALTER TABLE reservations ADD COLUMN commissionDateLimite DATETIME;",
        "ALTER TABLE commandes ADD COLUMN statutPaiement VARCHAR(30) NOT NULL DEFAULT 'non_paye';",
        "ALTER TABLE commandes ADD COLUMN adresseLivraison TEXT;",
        "ALTER TABLE commandes ADD COLUMN telephoneLivraison VARCHAR(30);",
        "ALTER TABLE commande_produits ADD COLUMN prixUnitaire DECIMAL(12,2) NULL;",
        "ALTER TABLE commande_produits ADD COLUMN nomProduit VARCHAR(255) NULL;",
        "ALTER TABLE commande_produits ADD COLUMN fournisseurId INT NULL;",
        "ALTER TABLE commande_produits ADD COLUMN statutLivraison VARCHAR(20) NOT NULL DEFAULT 'a_preparer';",
        "ALTER TABLE retraits MODIFY COLUMN operateur VARCHAR(20) NOT NULL;",
        "ALTER TABLE retraits MODIFY COLUMN telephone VARCHAR(40) NOT NULL;",
        "ALTER TABLE retraits MODIFY COLUMN fournisseurId INT NULL;",
        "ALTER TABLE retraits ADD COLUMN userId INT NULL;",
        "ALTER TABLE retraits ADD COLUMN source VARCHAR(10) NOT NULL DEFAULT 'GAINS';",
        "ALTER TABLE retraits ADD COLUMN reference VARCHAR(80) NULL;",
        "ALTER TABLE retraits ADD COLUMN motif TEXT NULL;",
        "ALTER TABLE retraits ADD COLUMN traitePar INT NULL;",
        "ALTER TABLE retraits ADD COLUMN traiteLe DATETIME NULL;",
        "ALTER TABLE fournisseurs ADD COLUMN fondsSoutienActif BOOLEAN NOT NULL DEFAULT false;",
        "ALTER TABLE fournisseurs ADD COLUMN fondsSoutienAccepteLe DATETIME NULL;",
        "ALTER TABLE paiements MODIFY COLUMN modePaiement VARCHAR(50) NOT NULL DEFAULT 'mobile_money';",
        "ALTER TABLE paiements MODIFY COLUMN statut VARCHAR(30) NOT NULL DEFAULT 'en_attente';",
        "ALTER TABLE paiements ADD COLUMN referenceClient VARCHAR(255) NULL;",
        "ALTER TABLE paiements ADD COLUMN messageClient TEXT NULL;",
        "ALTER TABLE paiements ADD COLUMN confirmationDate DATETIME NULL;",
        "UPDATE commandes SET statutPaiement = 'paye' WHERE statutPaiement = 'non_paye' AND id IN (SELECT commandeId FROM paiements WHERE statut = 'valide' AND commandeId IS NOT NULL);"
    ];

    console.log("🛠️ Vérification des colonnes manquantes...");
    for (const q of queries) {
        try {
            await sequelize.query(q);
        } catch (error) {
            // Ignore les erreurs de colonnes déjà existantes
        }
    }
    console.log("✅ Vérification des colonnes terminée.");
};

// ==========================================
// ⏱️ PLANIFICATION DES JOBS
// ==========================================
const INTERVALLE_JOB_MS = 60 * 60 * 1000; // 1 heure
let intervalleJobBons = null;

const demarrerJobAutoValidation = () => {
    setTimeout(() => {
        runAutoValiderBonsIntervention().catch(err =>
            console.error('[auto-validation] Erreur au passage initial :', err.message)
        );
    }, 10_000);

    intervalleJobBons = setInterval(() => {
        runAutoValiderBonsIntervention().catch(err =>
            console.error('[auto-validation] Erreur lors du passage planifié :', err.message)
        );
    }, INTERVALLE_JOB_MS);

    setTimeout(() => {
        runCreerVisitesAbonnements().catch(err => console.error('[abonnements] Erreur passage initial :', err.message));
    }, 20_000);

    setInterval(() => {
        runCreerVisitesAbonnements().catch(err => console.error('[abonnements] Erreur passage planifié :', err.message));
    }, INTERVALLE_JOB_MS);

    console.log(`⏱️ Jobs automatiques planifiés.`);
};

// ==========================================
// 7. INITIALISATION ET DÉMARRAGE
// ==========================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connexion réussie à la base de données MySQL.');

        await repairDatabase();

        await sequelize.sync();
        console.log('✅ Base de données synchronisée.');

        app.listen(PORT, () => {
            console.log(`🚀 Serveur en écoute sur le port ${PORT}`);
        });

        demarrerJobAutoValidation();
    } catch (error) {
        console.error('❌ Impossible de se connecter ou de synchroniser la base de données :', error);
        process.exit(1);
    }
};

startServer();

process.on('SIGINT', async () => {
    console.log('\nFermeture du serveur et des connexions DB...');
    if (intervalleJobBons) clearInterval(intervalleJobBons);
    await sequelize.close();
    process.exit(0);
});