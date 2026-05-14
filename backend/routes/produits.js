const express = require('express');
const router = express.Router();
const { Produit, Fournisseur, Service } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = file.originalname.replace(ext, '').replace(/\s+/g, '-');
        cb(null, `${name}-${Date.now()}${ext}`);
    }
});
const upload = multer({ storage });

// ── GET /api/produits — public avec filtres
router.get('/', async (req, res) => {
    try {
        const { categorie, fournisseurId, serviceId, actif, search } = req.query;
        const where = {};
        if (categorie) where.categorie = categorie;
        if (fournisseurId) where.fournisseurId = fournisseurId;
        if (serviceId) where.serviceId = serviceId;
        if (actif !== undefined) where.actif = actif === 'true';
        if (search) where.nom = { [Op.like]: `%${search}%` };

        const produits = await Produit.findAll({
            where,
            include: [
                {
                    model: Fournisseur, as: 'fournisseur',
                    attributes: ['id', 'nomEntreprise', 'adresse'],
                    include: [{ model: require('../models').User, as: 'userFournisseur', attributes: ['email', 'telephone'] }]
                },
                { model: Service, as: 'produitService', attributes: ['id', 'nom', 'description'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, count: produits.length, data: produits });
    } catch (error) {
        console.error('Erreur GET /api/produits:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
});

// ✅ IMPORTANT — cette route DOIT être avant /:id sinon Express confond "fournisseur" avec un id
// ── GET /api/produits/fournisseur — produits du fournisseur connecté
router.get('/fournisseur', protect, authorize('fournisseur'), async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(404).json({ success: false, message: 'Fournisseur introuvable' });

        const produits = await Produit.findAll({
            where: { fournisseurId: fournisseur.id },
            include: [{ model: Service, as: 'produitService' }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: produits });
    } catch (error) {
        console.error('Erreur GET /api/produits/fournisseur:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
});

// ── POST /api/produits — créer un produit
router.post('/', protect, authorize('fournisseur', 'admin'), upload.single('image'), async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(400).json({ success: false, message: 'Profil fournisseur requis' });

        const count = await Produit.count({ where: { fournisseurId: fournisseur.id } });
        if (count >= 25) return res.status(400).json({ success: false, message: 'Limite de 25 produits atteinte.' });

        const { nom, description, prix, serviceId } = req.body;
        if (!nom || !prix) return res.status(400).json({ success: false, message: 'Nom et prix sont obligatoires.' });

        const produit = await Produit.create({
            fournisseurId: fournisseur.id,
            serviceId: serviceId || fournisseur.serviceId,
            nom, description, prix,
            image: req.file?.filename || null
        });
        res.status(201).json({ success: true, message: 'Produit créé ✅', data: produit });
    } catch (error) {
        console.error('Erreur création produit:', error);
        res.status(500).json({ success: false, message: 'Erreur création produit', error: error.message });
    }
});

// ── GET /api/produits/:id — public
router.get('/:id', async (req, res) => {
    try {
        const produit = await Produit.findByPk(req.params.id, {
            include: [
                {
                    model: Fournisseur, as: 'fournisseur',
                    attributes: ['id', 'nomEntreprise', 'adresse'],
                    include: [{ model: require('../models').User, as: 'userFournisseur', attributes: ['email', 'telephone'] }]
                },
                { model: Service, as: 'produitService', attributes: ['id', 'nom', 'description'] }
            ]
        });
        if (!produit) return res.status(404).json({ success: false, message: 'Produit non trouvé' });
        res.json({ success: true, data: produit });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
});

// ── PUT /api/produits/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const produit = await Produit.findByPk(req.params.id, { include: [{ model: Fournisseur, as: 'fournisseur' }] });
        if (!produit) return res.status(404).json({ success: false, message: 'Produit non trouvé' });
        if (produit.fournisseur.userId !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        await produit.update(req.body);
        res.json({ success: true, message: 'Produit mis à jour ✅', data: produit });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
});

// ── DELETE /api/produits/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const produit = await Produit.findByPk(req.params.id, { include: [{ model: Fournisseur, as: 'fournisseur' }] });
        if (!produit) return res.status(404).json({ success: false, message: 'Produit non trouvé' });
        if (produit.fournisseur.userId !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        await produit.destroy();
        res.json({ success: true, message: 'Produit supprimé ✅' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;