const { Produit, Fournisseur, Service } = require('../models');

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

// 📝 Créer un produit
exports.create = async (req, res) => {
    try {
        const produit = await Produit.create({
            ...req.body,
            fournisseurId: req.user?.id || req.body.fournisseurId
        });
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
