const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Devis, Reservation } = require('../models');

const RETOUR_CLIENT = 1350;

// ── POST /api/devis ────────────────────────────────────────────
router.post('/', protect, authorize('fournisseur'), async (req, res) => {
    try {
        const { reservationId, montant, description } = req.body;
        if (!reservationId || !montant)
            return res.status(400).json({ success: false, message: 'Données manquantes.' });

        const reservation = await Reservation.findByPk(reservationId);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation introuvable.' });

        // Remplacer l'ancien devis EN_ATTENTE
        await Devis.update({ statut: 'REFUSE' }, { where: { reservationId, statut: 'EN_ATTENTE' } });

        const devis = await Devis.create({ reservationId, montant, description });
        res.status(201).json({ success: true, data: devis });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── PUT /api/devis/:id/accepter ────────────────────────────────
router.put('/:id/accepter', protect, async (req, res) => {
    try {
        const devis = await Devis.findByPk(req.params.id);
        if (!devis) return res.status(404).json({ success: false, message: 'Devis introuvable.' });

        await devis.update({ statut: 'ACCEPTE' });

        const resteAPayer = Math.max(0, Number(devis.montant) - RETOUR_CLIENT);
        await Reservation.update(
            { montantTotal: devis.montant, statut: 'ACCEPTEE' },
            { where: { id: devis.reservationId } }
        );

        res.json({ success: true, data: devis, resteAPayer });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── PUT /api/devis/:id/refuser ─────────────────────────────────
router.put('/:id/refuser', protect, async (req, res) => {
    try {
        const devis = await Devis.findByPk(req.params.id);
        if (!devis) return res.status(404).json({ success: false, message: 'Devis introuvable.' });
        await devis.update({ statut: 'REFUSE' });
        res.json({ success: true, message: 'Devis refusé.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── GET /api/devis/reservation/:id ────────────────────────────
router.get('/reservation/:id', protect, async (req, res) => {
    try {
        const devis = await Devis.findAll({
            where: { reservationId: req.params.id },
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: devis });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── PUT /api/devis/annuler/:reservationId ──────────────────────
router.put('/annuler/:reservationId', protect, async (req, res) => {
    try {
        const reservation = await Reservation.findByPk(req.params.reservationId);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation introuvable.' });

        const dejaAcceptee = ['ACCEPTEE', 'EN_COURS', 'EN_PREPARATION'].includes(reservation.statut);

        const remboursement = dejaAcceptee ? 750 : 1350;
        const message = dejaAcceptee
            ? `Remboursement 750 FCFA. New Vision garde 375 FCFA. Prestataire reçoit 375 FCFA.`
            : `Remboursement 1 350 FCFA. New Vision garde 150 FCFA.`;

        await reservation.update({ statut: 'ANNULEE', acompteStatut: 'REMBOURSE' });
        res.json({ success: true, remboursement, message, dejaAcceptee });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;