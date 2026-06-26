const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Fournisseur, User, Reservation, Paiement, Produit, Commande } = require('../models');

// ============================================================
// 🛡️ MIDDLEWARE DE CONTRÔLE ADMIN
// ============================================================
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs.' });
    }
    next();
};

// ============================================================
// 📊 STATISTIQUES & UTILISATEURS
// ============================================================

router.get('/stats', protect, adminOnly, async (req, res) => {
    try {
        const [totalFournisseurs, enAttente, conformes, totalMissions] = await Promise.all([
            Fournisseur.count(),
            Fournisseur.count({ where: { statut: 'EN_ATTENTE' } }),
            Fournisseur.count({ where: { statut: 'CONFORME' } }),
            Reservation.count(),
        ]);
        res.json({ success: true, data: { totalFournisseurs, enAttente, conformes, totalMissions } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

router.get('/utilisateurs', protect, adminOnly, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'nom', 'prenom', 'email', 'role', 'telephone', 'ville', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

router.delete('/utilisateurs/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
        await user.destroy();
        res.json({ success: true, message: 'Utilisateur supprimé.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ============================================================
// 🧑‍💼 GESTION DES FOURNISSEURS
// ============================================================

router.get('/fournisseurs', protect, adminOnly, async (req, res) => {
    try {
        const { statut } = req.query;
        const where = statut ? { statut } : {};
        const fournisseurs = await Fournisseur.findAll({
            where,
            include: [{ model: User, as: 'userFournisseur', attributes: ['id', 'nom', 'email', 'telephone'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: fournisseurs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

router.put('/fournisseurs/:id/statut', protect, adminOnly, async (req, res) => {
    try {
        const { statut } = req.body;
        const statutsValides = ['EN_ATTENTE', 'EN_EVALUATION', 'CONFORME', 'SUSPENDU'];
        if (!statutsValides.includes(statut)) {
            return res.status(400).json({ success: false, message: 'Statut invalide.' });
        }
        const fournisseur = await Fournisseur.findByPk(req.params.id);
        if (!fournisseur) return res.status(404).json({ success: false, message: 'Fournisseur introuvable.' });
        await fournisseur.update({ statut });
        res.json({ success: true, message: `Statut mis à jour : ${statut}`, data: fournisseur });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ============================================================
// 📅 GESTION DES RÉSERVATIONS (MISSIONS KANARI)
// ============================================================

// 🟢 URL réelle : GET /api/admin/reservations
router.get('/reservations', protect, adminOnly, async (req, res) => {
    try {
        const reservations = await Reservation.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: reservations });
    } catch (err) {
        console.error("❌ Erreur GET /reservations :", err);
        res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
    }
});

// 🟢 URL réelle : PATCH /api/admin/reservations/:id/statut
router.patch('/reservations/:id/statut', protect, adminOnly, async (req, res) => {
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

// 🟢 URL réelle : PUT /api/admin/reservations/:id/assigner
router.put('/reservations/:id/assigner', protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { fournisseurId } = req.body;

        const reservation = await Reservation.findByPk(id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        }

        await reservation.update({
            fournisseurId,
            statut: 'assigne'
        });

        res.json({ success: true, message: 'Fournisseur assigné avec succès.', data: reservation });
    } catch (err) {
        console.error("❌ Erreur PUT /assigner :", err);
        res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
    }
});

// 🟢 URL réelle : PUT /api/admin/reservations/:id/autoriser
router.put('/reservations/:id/autoriser', protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;

        const reservation = await Reservation.findByPk(id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        }

        await reservation.update({ statut: 'accepte' });

        res.json({ success: true, message: 'Démarrage de la mission autorisé.', data: reservation });
    } catch (err) {
        console.error("❌ Erreur PUT /autoriser :", err);
        res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
    }
});

// 🟢 URL réelle : POST /api/admin/reservations/admin-creer
router.post('/reservations/admin-creer', protect, adminOnly, async (req, res) => {
    try {
        const newReservation = await Reservation.create(req.body);
        res.status(201).json({ success: true, message: 'Réservation créée par l’admin.', data: newReservation });
    } catch (err) {
        console.error("❌ Erreur POST /admin-creer :", err);
        res.status(500).json({ success: false, message: 'Erreur lors de la création.', error: err.message });
    }
});

// ============================================================
// 💳 GESTION DES PAIEMENTS
// ============================================================

router.get('/paiements', protect, adminOnly, async (req, res) => {
    try {
        const paiements = await Paiement.findAll({
            include: [{
                model: Commande,
                as: 'commandePaiement',
                include: [{ model: User, as: 'clientCommande', attributes: ['id', 'nom', 'email'] }]
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: paiements });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

router.put('/paiements/:id', protect, adminOnly, async (req, res) => {
    try {
        const { statut } = req.body;
        const paiement = await Paiement.findByPk(req.params.id);
        if (!paiement) return res.status(404).json({ success: false, message: 'Paiement introuvable.' });
        await paiement.update({ statut });
        res.json({ success: true, data: paiement });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ============================================================
// 📦 GESTION DES PRODUITS
// ============================================================

router.get('/produits', protect, adminOnly, async (req, res) => {
    try {
        const produits = await Produit.findAll({
            include: [{ model: Fournisseur, as: 'fournisseur', attributes: ['id', 'nomEntreprise'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: produits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

router.delete('/produits/:id', protect, adminOnly, async (req, res) => {
    try {
        const produit = await Produit.findByPk(req.params.id);
        if (!produit) return res.status(404).json({ success: false, message: 'Produit introuvable.' });
        await produit.destroy();
        res.json({ success: true, message: 'Produit supprimé.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;