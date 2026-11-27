const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/adminDossiersController');

const adminOnly = (req, res, next) => {
  const allowed =
    req.user?.role === 'admin' ||
    Boolean(req.user?.roleAdmin || req.user?.habilitationAdmin);

  if (!allowed) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs.',
    });
  }
  next();
};

// Fiche 360° & Dossier
router.get('/users/:id/360', protect, adminOnly, ctrl.getUser360);
router.put('/users/:id/dossier', protect, adminOnly, ctrl.upsertDossier);

// Pièces justificatives & Vérification KYC
router.post('/users/:id/documents', protect, adminOnly, ctrl.addDocument);
router.patch('/documents/:docId/verify', protect, adminOnly, ctrl.verifyDocument);

// Contrats
router.post('/users/:id/contrats', protect, adminOnly, ctrl.createContrat);
router.patch('/contrats/:contratId', protect, adminOnly, ctrl.updateContrat);

// Recrutement & Sélection
router.post('/users/:id/recrutement', protect, adminOnly, ctrl.upsertRecrutement);

module.exports = router;