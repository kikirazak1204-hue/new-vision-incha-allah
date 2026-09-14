const { Produit, Fournisseur, Service } = require('../models');
const admin = require('../config/firebase-admin');

// 🔍 Obtenir tous les produits avec relations
exports.getAll = async (req, res) => {
    try {
        const produits = await Produit.findAll({
            order: [['createdAt', 'DESC']],
            include: [
                { model: Fournisseur, as: 'fournisseur', attributes: ['id', 'nomEntreprise', 'telephone'] },
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
                { model: Fournisseur, as: 'fournisseur', attributes: ['id', 'nomEntreprise', 'telephone'] },
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

// 📝 Créer un produit avec notification Movie Box
exports.create = async (req, res) => {
    try {
        // Récupérer le bon ID fournisseur lié à l'utilisateur connecté
        let fournisseurId = req.body.fournisseurId;
        if (req.user) {
            const fournisseurProfil = await Fournisseur.findOne({ where: { userId: req.user.id } });
            if (fournisseurProfil) {
                fournisseurId = fournisseurProfil.id;
            }
        }

        const imageName = req.file ? req.file.filename : (req.body.image || null);

        const produit = await Produit.create({
            ...req.body,
            image: imageName,
            fournisseurId: fournisseurId || null
        });

        // 🚀 Notification en arrière-plan
        try {
            const fournisseur = await Fournisseur.findByPk(fournisseurId);
            const nomFournisseur = fournisseur ? fournisseur.nomEntreprise : 'Un prestataire';
            
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const imageUrl = imageName ? `${baseUrl}/uploads/${imageName}` : '';

            admin.messaging().send({
                notification: {
                    title: `🛍️ Nouveau produit : ${produit.nom}`,
                    body: `${nomFournisseur} vient d'ajouter une nouveauté à sa boutique.`
                },
                data: {
                    categorie: 'Boutique',
                    produitId: String(produit.id),
                    image: String(imageUrl)
                },
                topic: 'nouveaux_produits'
            }).catch(e => {
                console.warn('⚠️ Notification Firebase ignorée :', e.message);
            });
        } catch (notifError) {
            console.error('⚠️ Erreur préparation notification :', notifError.message);
        }

        res.status(201).json({ success: true, message: 'Produit créé avec succès', data: produit });
    } catch (error) {
        console.error('Erreur create produit:', error);
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

        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        const estProprietaire = fournisseur && produit.fournisseurId === fournisseur.id;

        if (!estProprietaire && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }

        const updated = await produit.update(req.body);
        res.json({ success: true, message: 'Produit mis à jour', data: updated });
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

        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        const estProprietaire = fournisseur && produit.fournisseurId === fournisseur.id;

        if (!estProprietaire && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }

        await produit.destroy();
        res.json({ success: true, message: 'Produit supprimé' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};