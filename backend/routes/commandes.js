const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const commandeController = require('../controllers/CommandeController');

// 🛡️ Protection globale : toutes les routes nécessitent d'être connecté
router.use(protect);

// 📝 POST /api/commandes (Création depuis panier)
router.post('/', authorize('utilisateur', 'admin'), commandeController.create);

// 🔍 GET /api/commandes (Liste)
router.get('/', commandeController.getAll);

// 🔍 GET /api/commandes/:id (Détails)
router.get('/:id', commandeController.getById);

// 📦 POST /api/commandes/ajouter-item
router.post('/ajouter-item', authorize('utilisateur', 'admin'), commandeController.ajouterProduitALaCommande);

module.exports = router;