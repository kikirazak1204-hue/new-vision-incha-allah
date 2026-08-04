const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const resController = require('../controllers/reservationController');

// Public — créer une réservation client
router.post('/', resController.createReservation);

router.get('/mes-reservations/:userId', protect, resController.getMesReservations);
router.put('/:id/statut', protect, adminOnly, resController.updateStatut);
router.delete('/:id', protect, adminOnly, resController.deleteReservation);

// ── Presta ────────────────────────────────────────────────
router.get('/disponibles', protect, resController.getReservationsDisponibles);
router.put('/:id/presta-accepter', protect, resController.prestaAccepter);
router.put('/:id/presta-refuser', protect, resController.prestaRefuser);

// ── Admin ─────────────────────────────────────────────────
router.put('/:id/assigner', protect, adminOnly, resController.assignerFournisseur);
router.put('/:id/autoriser', protect, adminOnly, resController.autoriserDemarrage);
router.post('/admin-creer', protect, adminOnly, resController.adminCreerReservation);

module.exports = router;
