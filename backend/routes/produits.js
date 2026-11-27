const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Produit, Fournisseur, Service, User } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');
const multer = require('multer');

// 🔥 CONFIGURATION MULTER EN MÉMOIRE (Pour envoyer vers Firebase Storage ou repli local)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // Limite à 10 Mo
});

const saveBufferLocally = (file, folder, filename) => {
    const targetDir = path.join(__dirname, '..', 'uploads', folder);
    fs.mkdirSync(targetDir, { recursive: true });
    const fullPath = path.join(__dirname, '..', 'uploads', filename);
    fs.writeFileSync(fullPath, file.buffer);
    return `/uploads/${filename}`;
};

// Helper pour uploader un buffer vers Firebase Storage avec repli local sécurisé
const uploadBufferToFirebase = async (file, folder = 'produits') => {
    const ext = file.originalname
        ? String(file.originalname.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '') || 'jpg'
        : 'jpg';
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `${folder}/${Date.now()}-${randomStr}.${ext}`;

    try {
        const admin = require('../config/firebase-admin');
        if (!admin || !admin.apps || admin.apps.length === 0) {
            console.warn('⚠️ Firebase Admin non initialisé — repli vers stockage local /uploads');
            return saveBufferLocally(file, folder, filename);
        }

        const bucket = admin.storage().bucket();
        if (!bucket || !bucket.name) {
            console.warn('⚠️ Bucket Firebase introuvable — repli vers stockage local /uploads');
            return saveBufferLocally(file, folder, filename);
        }

        const fileRef = bucket.file(filename);
        await fileRef.save(file.buffer, {
            metadata: { contentType: file.mimetype || 'application/octet-stream' },
            resumable: false
        });

        try {
            await fileRef.makePublic();
        } catch (aclErr) {
            console.warn('⚠️ makePublic ignoré (vérifier règles IAM/Bucket si nécessaire) :', aclErr.message);
        }

        return `https://storage.googleapis.com/${bucket.name}/${filename}`;
    } catch (error) {
        console.error('❌ Erreur upload Firebase Storage (repli local activé) :', error.message);
        return saveBufferLocally(file, folder, filename);
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
                    model: Fournisseur,
                    as: 'fournisseur',
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

// ── POST /api/produits — créer un produit avec image
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
            image: imageUrl
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
                    model: Fournisseur,
                    as: 'fournisseur',
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

        const updateData = { ...req.body };
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