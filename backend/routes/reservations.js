const express = require('express');
const router = express.Router();
const resController = require('../controllers/reservationController');

router.post('/', resController.createReservation);
router.get('/mes-reservations/:userId', resController.getMesReservations);
router.put('/:id/statut', resController.updateStatut);

// ── Routes admin pour assignation manuelle (Parcours 1) ──
router.get('/disponibles', resController.getReservationsDisponibles);
router.put('/:id/assigner', resController.assignerFournisseur);

module.exports = router;