const express = require('express');
const router = express.Router();
const { Produit, Fournisseur, Service, User } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');
const multer = require('multer');

// 🔥 CONFIGURATION MULTER EN MÉMOIRE (Pour envoyer direct vers Firebase Storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // Limite à 10 Mo
});

// Helper pour uploader un buffer vers Firebase Storage
const uploadBufferToFirebase = async (file, folder = 'produits') => {
    try {
        const admin = require('../config/firebase-admin');
        const bucket = admin.storage().bucket();
        
       const ext = file.originalname ? file.originalname.split('.').pop() : 'jpg';
        // Correction ici : .substring(2, 8) s'applique après .toString(36)
        const randomStr = Math.random().toString(36).substring(2, 8);
        const filename = `${folder}/${Date.now()}-${randomStr}.${ext}`;
        const fileRef = bucket.file(filename);
        await fileRef.save(file.buffer, {
            metadata: { contentType: file.mimetype },
            public: true
        });

        // Récupération de l'URL publique permanente
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        return publicUrl;
    } catch (error) {
        console.error('❌ Erreur upload Firebase Storage :', error);
        throw new Error('Échec de l\'enregistrement de l\'image sur Firebase.');
    }
};

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
                    include: [{ model: User, as: 'userFournisseur', attributes: ['email', 'telephone'] }]
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

// ── POST /api/produits — créer un produit avec image sur Firebase Storage
router.post('/', protect, authorize('fournisseur', 'admin'), upload.single('image'), async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(400).json({ success: false, message: 'Profil fournisseur requis' });

        const count = await Produit.count({ where: { fournisseurId: fournisseur.id } });
        if (count >= 25) return res.status(400).json({ success: false, message: 'Limite de 25 produits atteinte.' });

        const { nom, description, prix, serviceId, categorie, quantite } = req.body;
        if (!nom || !prix) return res.status(400).json({ success: false, message: 'Nom et prix sont obligatoires.' });

        let imageUrl = null;
        if (req.file) {
            imageUrl = await uploadBufferToFirebase(req.file, 'kanari-produits');
        }

        const produit = await Produit.create({
            fournisseurId: fournisseur.id,
            serviceId: serviceId || fournisseur.serviceId,
            nom,
            description,
            prix,
            categorie: categorie || null,
            quantite: quantite ? Number(quantite) : 0,
            image: imageUrl // Stocke l'URL publique permanente Firebase
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
                    include: [{ model: User, as: 'userFournisseur', attributes: ['email', 'telephone'] }]
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

// ── PUT /api/produits/:id (avec gestion de mise à jour d'image optionnelle)
router.put('/:id', protect, upload.single('image'), async (req, res) => {
    try {
        const produit = await Produit.findByPk(req.params.id, { include: [{ model: Fournisseur, as: 'fournisseur' }] });
        if (!produit) return res.status(404).json({ success: false, message: 'Produit non trouvé' });

        if (!produit.fournisseur || (produit.fournisseur.userId !== req.user.id && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }

        let updateData = { ...req.body };
        if (req.file) {
            updateData.image = await uploadBufferToFirebase(req.file, 'kanari-produits');
        }

        await produit.update(updateData);
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

        if (!produit.fournisseur || (produit.fournisseur.userId !== req.user.id && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }

        await produit.destroy();
        res.json({ success: true, message: 'Produit supprimé ✅' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;