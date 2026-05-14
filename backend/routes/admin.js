const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Fournisseur, User, Reservation, Paiement, Produit, Commande } = require('../models');

// ✅ ADMIN — cohérent avec la BDD et le token
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs.' });
    }
    next();
};

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
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ✅ AJOUTE — réservations pour l'admin
router.get('/reservations', protect, adminOnly, async (req, res) => {
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