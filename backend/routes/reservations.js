const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const { Reservation, Fournisseur, Service, User } = require('../models');
const reservationController = require('../controllers/reservationController');

// Multer
const uploadDir = 'uploads/reservations/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }
    next();
};

// ✅ POST PUBLIC — sans token, sans protect
router.post(
    '/',
    upload.fields([{ name: 'photo' }, { name: 'audio' }]),
    reservationController.creerReservation
);

// GET mes-reservations
router.get('/mes-reservations', protect, async (req, res) => {
    try {
        const reservations = await Reservation.findAll({
            where: { clientId: req.user.id },
            include: [
                { model: Fournisseur, as: 'prestataire', attributes: ['id', 'nomEntreprise', 'adresse', 'telephone'] },
                { model: Service, as: 'service', attributes: ['id', 'nom', 'emoji'] },
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: reservations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// GET mes-missions
router.get('/mes-missions', protect, async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(404).json({ success: false, message: 'Profil fournisseur introuvable.' });

        const missions = await Reservation.findAll({
            where: { fournisseurId: fournisseur.id },
            include: [
                { model: User, as: 'client', attributes: ['id', 'nom', 'telephone', 'email'] },
                { model: Service, as: 'service', attributes: ['id', 'nom', 'emoji'] },
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: missions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// GET admin
router.get('/admin', protect, adminOnly, async (req, res) => {
    try {
        const reservations = await Reservation.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: reservations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// PATCH statut
router.patch('/:id/statut', protect, adminOnly, async (req, res) => {
    try {
        const { statut } = req.body;
        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Introuvable.' });
        await reservation.update({ statut });
        res.json({ success: true, data: reservation });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;