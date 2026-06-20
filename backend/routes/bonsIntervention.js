const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    creerBonIntervention,
    getBonParReservation,
    validerBon,
    getBonsEnAttenteValidation
} = require('../controllers/bonInterventionController');

// ── Prestataire crée le bon après la mission ──
router.post('/', protect, creerBonIntervention);

// ── Voir le bon d'une réservation (client ou presta) ──
router.get('/reservation/:id', protect, getBonParReservation);

// ── Client valide le bon (+ note optionnelle) ──
router.put('/:id/valider', protect, validerBon);

// ── Liste des bons en attente depuis +24h (pour job auto) ──
router.get('/en-attente', protect, getBonsEnAttenteValidation);

module.exports = router;