const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');

const {
    createFournisseur,
    getAllFournisseurs,
    getProduitsByFournisseurId // Import ajouté ici
} = require('../controllers/fournisseurController');

// =======================
// 📁 MULTER CONFIG
// =======================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// =======================
// 🚀 ROUTE CREATE FOURNISSEUR
// =======================
router.post(
    '/',
    protect,
    upload.fields([
        { name: 'cniRecto', maxCount: 1 },
        { name: 'cniVerso', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
        { name: 'diplome', maxCount: 1 },
        { name: 'photoVehicule', maxCount: 1 }
    ]),
    createFournisseur
);

// =======================
// 📦 GET PRODUITS FOURNISSEUR (La route corrigée)
// =======================
router.get('/:id/produits', getProduitsByFournisseurId);

// =======================
// 📦 GET ALL FOURNISSEURS (SAFE)
// =======================
router.get('/', async (req, res) => {
    try {
        if (!getAllFournisseurs) {
            return res.status(501).json({
                success: false,
                message: "getAllFournisseurs non implémenté"
            });
        }
        return await getAllFournisseurs(req, res);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;