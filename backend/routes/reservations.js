const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configuration de Multer pour stocker temporairement les fichiers envoyés via le formulaire
const upload = multer({ dest: 'uploads/' });

const { protect } = require('../middleware/auth');
const resController = require('../controllers/reservationController');

// ════════════════════════════════════════════════════════════════
// Nettoyé : toutes les routes d'accepter/refuser/démarrer/terminer/
// assigner/autoriser/créer-par-admin/supprimer une mission vivent
// désormais UNIQUEMENT dans routes/missions.js (prestataire) et
// routes/admin.js (admin).
// ════════════════════════════════════════════════════════════════

// ── Création de réservation (public ou connecté) avec support des fichiers (upload.any()) ──
router.post('/global', upload.any(), resController.createGlobalReservation);
router.post('/', upload.any(), resController.createGlobalReservation);

// ── Espace Client ────────────────────────────────────────────────
router.get('/mes-reservations', protect, resController.getMesReservations);

// ── Espace Prestataire ───────────────────────────────────────────
router.get('/disponibles', protect, resController.getReservationsDisponibles);

module.exports = router;