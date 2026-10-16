const express = require('express');
const router = express.Router();

const { protect, adminOnly } = require('../middleware/auth');

const {
    getPaiementsClient,
    getAllPaiements,
    verifyPaiement,
    getAPayer,
    definirModeReservation,
    createMobileMoneyPaiement,
    updateStatutPaiement,
    getPaiementsFournisseur,
    getClientMissions,
    getPortefeuilleFournisseur
} = require('../controllers/paiementController');

// ── CLIENTS / PRESTATAIRES (protect) ──────────────────────
router.post('/', protect, createMobileMoneyPaiement);
router.post('/mobile-money', protect, createMobileMoneyPaiement);

router.get('/historique', protect, getPaiementsClient);
router.get('/a-payer', protect, getAPayer);                       // montant calculé par le serveur
router.post('/mode-reservation', protect, definirModeReservation); // choix : en ligne / sur place
router.get('/fournisseur', protect, getPaiementsFournisseur);
router.get('/fournisseur/portefeuille', protect, getPortefeuilleFournisseur); // solde, encaissements, commissions + retard
router.get('/client/missions', protect, getClientMissions);                   // 1 mission = 1 bon = 1 paiement      // total / commission / net
router.get('/verify/:txId', protect, verifyPaiement);

// ── ADMIN (protect + adminOnly) ───────────────────────────
router.get('/admin/liste', protect, adminOnly, getAllPaiements);
router.put('/admin/:id/statut', protect, adminOnly, updateStatutPaiement);

module.exports = router;