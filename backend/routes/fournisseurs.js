// routes/fournisseurs.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    createFournisseur,
    getAllFournisseurs
} = require('../controllers/fournisseurController');

// Créer un fournisseur
router.post('/', protect, createFournisseur);

// Récupérer tous les fournisseurs
router.get('/', getAllFournisseurs);

module.exports = router;
