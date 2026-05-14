const express = require('express');
const router = express.Router();

// 🔹 Méthodes liées aux services
const { getAllServices, getServiceById } = require('../controllers/serviceController');

// 🔹 Méthode liée aux fournisseurs par service
const { getFournisseursParService } = require('../controllers/fournisseurController'); // ✅ importer depuis le bon contrôleur

// 🔹 Récupérer tous les services
router.get('/', getAllServices);

// 🔹 Récupérer un service par ID
router.get('/:id', getServiceById);

// 🔹 Récupérer les fournisseurs liés à un service
router.get('/:id/fournisseurs', getFournisseursParService); // ✅ route active et fonctionnelle

module.exports = router;
