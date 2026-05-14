const { CommandeProduit, Produit } = require('../models');

// 📦 Ajouter un produit à une commande
exports.ajouterProduit = async (req, res) => {
    try {
        const { commandeId, produitId, quantite } = req.body;

        const item = await CommandeProduit.create({ commandeId, produitId, quantite });
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de l’ajout du produit à la commande.' });
    }
};

// 📦 Récupérer tous les produits d’une commande
exports.lireProduits = async (req, res) => {
    try {
        const { commandeId } = req.params;

        const items = await CommandeProduit.findAll({
            where: { commandeId },
            include: [{ model: Produit, as: 'produit' }]
        });

        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des produits.' });
    }
};

// 📦 Modifier la quantité d’un produit dans une commande
exports.modifierProduit = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantite } = req.body;

        const item = await CommandeProduit.findByPk(id);
        if (!item) return res.status(404).json({ error: 'Produit non trouvé dans la commande.' });

        item.quantite = quantite;
        await item.save();

        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
    }
};

// 📦 Supprimer un produit d’une commande
exports.supprimerProduit = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await CommandeProduit.findByPk(id);
        if (!item) return res.status(404).json({ error: 'Produit non trouvé.' });

        await item.destroy();
        res.json({ message: 'Produit supprimé de la commande.' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression.' });
    }
};

