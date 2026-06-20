const express = require('express');
const router = express.Router();
const {
    getAllServices,
    getServiceById,
    getFournisseursParService
} = require('../controllers/serviceController');

router.get('/', getAllServices);
router.get('/:id', getServiceById);
router.get('/:id/fournisseurs', getFournisseursParService);

module.exports = router;