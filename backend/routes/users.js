const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// 🔐 GET /api/users — admin uniquement
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });

        res.json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
});

// 🔐 GET /api/users/:id — accès personnel ou admin
router.get('/:id', protect, async (req, res) => {
    try {
        const isOwner = req.user.id === parseInt(req.params.id);
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }

        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
});

// 🔐 PUT /api/users/:id — mise à jour sécurisée
router.put('/:id', protect, async (req, res) => {
    try {
        const isOwner = req.user.id === parseInt(req.params.id);
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }

        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        // Interdire la modification du rôle sauf pour admin
        if (req.body.role && !isAdmin) {
            delete req.body.role;
        }

        const updated = await user.update(req.body);
        const userResponse = updated.toJSON();
        delete userResponse.password;

        res.json({ success: true, message: 'Profil mis à jour - Incha Allah', data: userResponse });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour', error: error.message });
    }
});

module.exports = router;
