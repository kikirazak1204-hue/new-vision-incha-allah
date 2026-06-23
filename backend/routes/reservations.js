const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const resController = require('../controllers/reservationController');

// Public — créer une réservation client
router.post('/', resController.createReservation);

router.get('/mes-reservations/:userId', resController.getMesReservations);
router.put('/:id/statut', protect, resController.updateStatut);
router.delete('/:id', protect, resController.deleteReservation);

// ── Presta ────────────────────────────────────────────────
router.get('/disponibles', protect, resController.getReservationsDisponibles);
router.put('/:id/presta-accepter', protect, resController.prestaAccepter);
router.put('/:id/presta-refuser', protect, resController.prestaRefuser);

// ── Admin ─────────────────────────────────────────────────
router.put('/:id/assigner', protect, resController.assignerFournisseur);
router.put('/:id/autoriser', protect, resController.autoriserDemarrage);
router.post('/admin-creer', protect, resController.adminCreerReservation);

module.exports = router;
