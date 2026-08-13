const express = require('express');
const router = express.Router();

// Assure-toi que ces middlewares pointent vers les bons fichiers dans ton architecture
const { protect, adminOnly } = require('../middleware/auth');

const {
    getPaiementsClient,
    getAllPaiements,
    verifyPaiement,
    createMobileMoneyPaiement,
    updateStatutPaiement
} = require('../controllers/paiementController');

// ==========================================
// 🧑‍💻 ROUTES CLIENTS (Nécessitent 'protect')
// ==========================================

// 💳 Création d'un paiement
router.post('/', protect, createMobileMoneyPaiement);
router.post('/mobile-money', protect, createMobileMoneyPaiement);

// 📜 Historique des paiements du client connecté
router.get('/historique', protect, getPaiementsClient);

// 🔍 Vérification d'un paiement par son transactionId
router.get('/verify/:txId', protect, verifyPaiement);


// ==========================================
// 🛡️ ROUTES ADMIN (Nécessitent 'protect' + 'adminOnly')
// ==========================================

// 📜 Administration : Récupérer tout l'historique des paiements
router.get('/admin/liste', protect, adminOnly, getAllPaiements);

// ⚙️ Administration : Valider ou rejeter un paiement
router.put('/admin/:id/statut', protect, adminOnly, updateStatutPaiement);

module.exports = router;