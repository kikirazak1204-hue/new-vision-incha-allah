const express = require('express');
const router = express.Router();
const { Produit, Fournisseur, Service, User } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');
const multer = require('multer');

// ── Règles de la boutique ─────────────────────────────────
const MAX_PHOTOS = 4;                                                         // photos par produit
const MAX_PRODUITS = Number(process.env.PRODUITS_MAX_PAR_FOURNISSEUR) || 500; // produits par fournisseur
const MAX_STOCK = 1000000;                                                    // unités en stock par produit
const TYPES_IMAGE = ['image/jpeg', 'image/png', 'image/webp'];

// 🔥 CONFIGURATION MULTER EN MÉMOIRE (Pour envoyer direct vers Firebase Storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: MAX_PHOTOS + 1 } // 10 Mo par photo
});

// Accepte « images » (jusqu'à 4) et l'ancien champ « image » (1), avec des messages d'erreur clairs
const recevoirPhotos = (req, res, next) => {
    upload.fields([{ name: 'images', maxCount: MAX_PHOTOS }, { name: 'image', maxCount: 1 }])(req, res, (err) => {
        if (!err) return next();
        const messages = {
            LIMIT_UNEXPECTED_FILE: `${MAX_PHOTOS} photos maximum par produit.`,
            LIMIT_FILE_COUNT: `${MAX_PHOTOS} photos maximum par produit.`,
            LIMIT_FILE_SIZE: 'Chaque photo doit faire 10 Mo maximum.'
        };
        return res.status(400).json({ success: false, message: messages[err.code] || err.message });
    });
};

// Fichiers reçus, dans l'ordre (la première photo est la principale)
const photosRecues = (req) => [...(req.files?.images || []), ...(req.files?.image || [])];

const verifierPhotos = (fichiers) => {
    if (fichiers.length > MAX_PHOTOS) return `${MAX_PHOTOS} photos maximum par produit.`;
    if (fichiers.some((f) => !TYPES_IMAGE.includes(f.mimetype))) return 'Seules les images JPEG, PNG ou WebP sont acceptées.';
    return null;
};

const quantiteValide = (q) => Math.min(Math.max(Math.floor(Number(q) || 0), 0), MAX_STOCK);

// Helper pour uploader un buffer vers Firebase Storage
const uploadBufferToFirebase = async (file, folder = 'produits') => {
    try {
        const admin = require('../config/firebase-admin');
        const bucket = admin.storage().bucket();

        const ext = file.originalname ? file.originalname.split('.').pop() : 'jpg';
        const randomStr = Math.random().toString(36).substring(2, 8);
        const filename = `${folder}/${Date.now()}-${randomStr}.${ext}`;
        const fileRef = bucket.file(filename);
        await fileRef.save(file.buffer, {
            metadata: { contentType: file.mimetype },
            public: true
        });

        // Récupération de l'URL publique permanente
        return `https://storage.googleapis.com/${bucket.name}/${filename}`;
    } catch (error) {
        console.error('❌ Erreur upload Firebase Storage :', error);
        throw new Error('Échec de l\'enregistrement de l\'image sur Firebase.');
    }
};

const envoyerPhotos = (fichiers) => Promise.all(fichiers.map((f) => uploadBufferToFirebase(f, 'kanari-produits')));

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

// ── POST /api/produits — créer un produit (jusqu'à 4 photos sur Firebase Storage)
router.post('/', protect, authorize('fournisseur', 'admin'), recevoirPhotos, async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(400).json({ success: false, message: 'Profil fournisseur requis' });

        const count = await Produit.count({ where: { fournisseurId: fournisseur.id } });
        if (count >= MAX_PRODUITS) {
            return res.status(400).json({ success: false, message: `Limite de ${MAX_PRODUITS} produits atteinte.` });
        }

        const { nom, description, prix, serviceId, categorie, quantite } = req.body;
        if (!nom || !String(nom).trim() || !prix) return res.status(400).json({ success: false, message: 'Nom et prix sont obligatoires.' });
        if (!(Number(prix) > 0)) return res.status(400).json({ success: false, message: 'Le prix doit être supérieur à zéro.' });

        const fichiers = photosRecues(req);
        const erreurPhotos = verifierPhotos(fichiers);
        if (erreurPhotos) return res.status(400).json({ success: false, message: erreurPhotos });

        const urls = await envoyerPhotos(fichiers);

        const produit = await Produit.create({
            fournisseurId: fournisseur.id,
            serviceId: serviceId || fournisseur.serviceId,
            nom: String(nom).trim(),
            description,
            prix,
            categorie: categorie || null,
            quantite: quantiteValide(quantite),
            image: urls[0] || null, // photo principale (compatibilité boutique)
            images: urls
        });

        res.status(201).json({ success: true, message: 'Produit créé', data: produit });
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

// ── PUT /api/produits/:id (nouvelles photos facultatives : elles remplacent la galerie)
router.put('/:id', protect, recevoirPhotos, async (req, res) => {
    try {
        const produit = await Produit.findByPk(req.params.id, { include: [{ model: Fournisseur, as: 'fournisseur' }] });
        if (!produit) return res.status(404).json({ success: false, message: 'Produit non trouvé' });

        if (!produit.fournisseur || (produit.fournisseur.userId !== req.user.id && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }

        // Seuls ces champs sont modifiables (jamais le propriétaire ni l'identifiant)
        const updateData = {};
        for (const champ of ['nom', 'description', 'prix', 'categorie', 'serviceId']) {
            if (req.body[champ] !== undefined) updateData[champ] = req.body[champ];
        }
        if (req.body.quantite !== undefined) updateData.quantite = quantiteValide(req.body.quantite);
        if (updateData.prix !== undefined && !(Number(updateData.prix) > 0)) {
            return res.status(400).json({ success: false, message: 'Le prix doit être supérieur à zéro.' });
        }

        const fichiers = photosRecues(req);
        if (fichiers.length) {
            const erreurPhotos = verifierPhotos(fichiers);
            if (erreurPhotos) return res.status(400).json({ success: false, message: erreurPhotos });
            const urls = await envoyerPhotos(fichiers);
            updateData.images = urls;
            updateData.image = urls[0];
        }

        await produit.update(updateData);
        res.json({ success: true, message: 'Produit mis à jour', data: produit });
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
        res.json({ success: true, message: 'Produit supprimé' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;