const { Produit, Fournisseur, Service } = require('../models');
// 📡 Importation de Firebase (s'adapte automatiquement en local ou sur Render)
const admin = require('../config/firebase-admin');

// 🔍 Obtenir tous les produits avec relations
exports.getAll = async (req, res) => {
    try {
        const produits = await Produit.findAll({
            order: [['createdAt', 'DESC']],
            include: [
                { model: Fournisseur, as: 'fournisseur' },
                { model: Service, as: 'service' }
            ]
        });
        res.json({ success: true, count: produits.length, data: produits });
    } catch (error) {
        console.error('❌ Erreur getAll produits :', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

// 🔍 Obtenir un produit par ID avec relations
exports.getById = async (req, res) => {
    try {
        const produit = await Produit.findByPk(req.params.id, {
            include: [
                { model: Fournisseur, as: 'fournisseur' },
                { model: Service, as: 'service' }
            ]
        });
        if (!produit) {
            return res.status(404).json({ success: false, message: 'Produit non trouvé' });
        }
        res.json({ success: true, data: produit });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

// 📝 Créer un produit avec notification Movie Box !
exports.create = async (req, res) => {
    try {
        // 1. Création du produit en BDD (Ton code d'origine)
        const produit = await Produit.create({
            ...req.body,
            fournisseurId: req.user?.id || req.body.fournisseurId
        });

        // 2. 🚀 ENVOI DE LA NOTIFICATION MOVIE BOX EN ARRIÈRE-PLAN
        try {
            // On récupère le nom du fournisseur pour personnaliser le message
            const fournisseur = await Fournisseur.findByPk(produit.fournisseurId);
            const nomFournisseur = fournisseur ? fournisseur.nomEntreprise : 'Un prestataire';

            // On récupère l'image s'il y en a une (gère Multer req.file ou req.body.image)
            const imageName = req.file ? req.file.filename : (produit.image || req.body.image || null);
            const imageUrl = imageName ? `https://ton-api-render.onrender.com/uploads/${imageName}` : '';

            admin.messaging().send({
                notification: {
                    title: `🛍️ Nouveau produit : ${produit.nom}`,
                    body: `${nomFournisseur} vient d'ajouter une nouveauté à sa boutique.`
                },
                // Les métadonnées lues par ton composant React Movie Box
                data: {
                    categorie: 'Boutique',
                    produitId: String(produit.id),
                    image: String(imageUrl) // L'image qui s'affichera style "Affiche de film"
                },
                topic: 'nouveaux_produits' // Diffusé à tous les clients abonnés au catalogue
            }).then(() => {
                console.log(`📣 Notif envoyée pour le produit : ${produit.nom}`);
            }).catch(e => {
                console.warn('⚠️ Notification Firebase ignorée ou non configurée :', e.message);
            });

        } catch (notifError) {
            // Si la préparation de la notif échoue, on loggue mais on ne bloque pas la création du produit
            console.error('⚠️ Erreur lors de la préparation de la notification :', notifError.message);
        }

        res.status(201).json({ success: true, message: 'Produit créé - Incha Allah', data: produit });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

// ✏️ Modifier un produit
exports.update = async (req, res) => {
    try {
        const produit = await Produit.findByPk(req.params.id);
        if (!produit) {
            return res.status(404).json({ success: false, message: 'Produit non trouvé' });
        }

        if (produit.fournisseurId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }

        const updated = await produit.update(req.body);
        res.json({ success: true, message: 'Produit mis à jour - Incha Allah', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

// 🗑️ Supprimer un produit
exports.delete = async (req, res) => {
    try {
        const produit = await Produit.findByPk(req.params.id);
        if (!produit) {
            return res.status(404).json({ success: false, message: 'Produit non trouvé' });
        }

        if (produit.fournisseurId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }

        await produit.destroy();
        res.json({ success: true, message: 'Produit supprimé - Incha Allah' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};