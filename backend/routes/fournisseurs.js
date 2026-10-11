const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');

const {
    createFournisseur,
    getAllFournisseurs,
    getFournisseurById,
    getProduitsByFournisseurId
} = require('../controllers/fournisseurController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
        cb(null, `${Date.now()}-${base}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

const normaliser = (req, res, next) => {
    try {
        const b = req.body || {};
        if (!b.serviceId) {
            let ids = [];
            if (b.serviceIds) {
                try { ids = JSON.parse(b.serviceIds); } catch { ids = []; }
            }
            if (!ids.length && b['serviceIds[]']) {
                ids = Array.isArray(b['serviceIds[]']) ? b['serviceIds[]'] : [b['serviceIds[]']];
            }
            if (ids.length) b.serviceId = String(ids[0]);
        }
        if (req.files?.vehicule?.[0] && !req.files.photoVehicule) {
            req.files.photoVehicule = [req.files.vehicule[0]];
        }
        next();
    } catch (err) {
        next(err);
    }
};

router.post(
    '/',
    protect,
    upload.fields([
        { name: 'cniRecto', maxCount: 1 },
        { name: 'cniVerso', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
        { name: 'diplome', maxCount: 1 },
        { name: 'photoVehicule', maxCount: 1 },
        { name: 'vehicule', maxCount: 1 },
        { name: 'justificatifVehicule', maxCount: 1 },
        { name: 'justificatifEntreprise', maxCount: 1 },
        { name: 'documentFiscal', maxCount: 1 },
        { name: 'catalogue', maxCount: 1 }
    ]),
    normaliser,
    createFournisseur
);

router.get('/:id/produits', getProduitsByFournisseurId);
router.get('/:id', getFournisseurById);

router.get('/', async (req, res) => {
    try {
        if (!getAllFournisseurs) {
            return res.status(501).json({ success: false, message: 'getAllFournisseurs non implémenté' });
        }
        return await getAllFournisseurs(req, res);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
