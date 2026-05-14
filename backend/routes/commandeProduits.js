const express = require('express');
const router = express.Router();
const { CommandeProduit, Produit, Commande } = require('../models');
const { protect } = require('../middleware/auth');



// 📦 Ajouter un produit à une commande
router.post('/', protect, async (req, res) => {
    try {
        const { commandeId, produitId, quantite } = req.body;

        const commande = await Commande.findByPk(commandeId);
        const produit = await Produit.findByPk(produitId);

        if (!commande || !produit) {
            return res.status(404).json({ success: false, message: 'Commande ou produit introuvable.' });
        }

        const item = await CommandeProduit.create({ commandeId, produitId, quantite });

        res.status(201).json({ success: true, message: 'Produit ajouté à la commande.', data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de l’ajout du produit.', error: error.message });
    }
});

// 📦 Récupérer tous les produits d’une commande
router.get('/:commandeId', protect, async (req, res) => {
    try {
        const { commandeId } = req.params;

        const items = await CommandeProduit.findAll({
            where: { commandeId },
            include: [{ model: Produit, as: 'produit' }]
        });

        res.json({ success: true, count: items.length, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération.', error: error.message });
    }
});

// 📦 Modifier la quantité d’un produit dans une commande
router.put('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { quantite } = req.body;

        const item = await CommandeProduit.findByPk(id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Produit non trouvé dans la commande.' });
        }

        item.quantite = quantite;
        await item.save();

        res.json({ success: true, message: 'Quantité mise à jour.', data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour.', error: error.message });
    }
});

// 📦 Supprimer un produit d’une commande
router.delete('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;

        const item = await CommandeProduit.findByPk(id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Produit non trouvé.' });
        }

        await item.destroy();
        res.json({ success: true, message: 'Produit supprimé de la commande.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression.', error: error.message });
    }
});

module.exports = router;
