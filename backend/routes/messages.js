const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Message, User, Reservation } = require('../models');
const { Op } = require('sequelize');

// ── GET /api/messages/non-lus/:reservationId ───────────────────
// ⚠️ DOIT être AVANT /:reservationId sinon Express confond les routes
router.get('/non-lus/:reservationId', protect, async (req, res) => {
    try {
        const count = await Message.count({
            where: {
                reservationId: req.params.reservationId,
                lu: false,
                senderId: { [Op.ne]: req.user.id }
            }
        });
        res.json({ success: true, count });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── GET /api/messages/:reservationId ──────────────────────────
router.get('/:reservationId', protect, async (req, res) => {
    try {
        const messages = await Message.findAll({
            where: { reservationId: req.params.reservationId },
            include: [{ model: User, as: 'expediteur', attributes: ['id', 'nom', 'role'] }],
            order: [['createdAt', 'ASC']]
        });

        // Marquer comme lus les messages des autres
        await Message.update(
            { lu: true },
            { where: { reservationId: req.params.reservationId, lu: false, senderId: { [Op.ne]: req.user.id } } }
        );

        res.json({ success: true, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── POST /api/messages ─────────────────────────────────────────
router.post('/', protect, async (req, res) => {
    try {
        const { reservationId, contenu } = req.body;
        if (!contenu?.trim()) return res.status(400).json({ success: false, message: 'Message vide.' });

        const msg = await Message.create({
            reservationId,
            senderId: req.user.id,
            contenu: contenu.trim()
        });

        const complet = await Message.findByPk(msg.id, {
            include: [{ model: User, as: 'expediteur', attributes: ['id', 'nom', 'role'] }]
        });

        res.status(201).json({ success: true, data: complet });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur envoi.' });
    }
});

module.exports = router;