const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDashboardClient, getDashboardFournisseur } = require('../controllers/dashboardController');

// Route pour les clients
router.get('/client', protect, authorize('utilisateur'), getDashboardClient);

// Route pour les fournisseurs
router.get('/fournisseur', protect, authorize('fournisseur'), getDashboardFournisseur);

module.exports = router;