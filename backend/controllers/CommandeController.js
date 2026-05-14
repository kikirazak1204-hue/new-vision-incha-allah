const { Commande, CommandeProduit, Produit } = require('../models');

// 📝 Créer une commande complète (Panier)
exports.create = async (req, res) => {
    try {
        const { produits, fraisLivraison } = req.body;

        if (!Array.isArray(produits) || produits.length === 0) {
            return res.status(400).json({ success: false, message: 'Le panier est vide.' });
        }

        let montantTotal = 0;
        // Calcul du montant sécurisé
        for (const item of produits) {
            const produit = await Produit.findByPk(item.produitId);
            if (produit) {
                montantTotal += produit.prix * item.quantite;
            }
        }
        montantTotal += (fraisLivraison || 0);

        const commande = await Commande.create({
            clientId: req.user.id,
            fraisLivraison: fraisLivraison || 0,
            montantTotal,
            statut: 'EN_ATTENTE'
        });

        // Insertion dans CommandeProduit
        for (const item of produits) {
            await CommandeProduit.create({
                commandeId: commande.id,
                produitId: item.produitId,
                quantite: item.quantite
            });
        }

        res.status(201).json({
            success: true,
            commandeId: commande.id,
            montant_total: montantTotal
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🔍 Récupérer toutes les commandes
exports.getAll = async (req, res) => {
    try {
        const where = req.user.role === 'admin' ? {} : { clientId: req.user.id };
        const commandes = await Commande.findAll({
            where,
            include: [{
                model: CommandeProduit,
                as: 'itemsCommande',
                include: [{ model: Produit, as: 'produitCommandeProduit' }]
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: commandes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🔍 Récupérer une commande par ID
exports.getById = async (req, res) => {
    try {
        const commande = await Commande.findByPk(req.params.id, {
            include: [{
                model: CommandeProduit,
                as: 'itemsCommande',
                include: [{ model: Produit, as: 'produitCommandeProduit' }]
            }]
        });
        if (!commande) return res.status(404).json({ success: false, message: 'Commande non trouvée' });
        res.json({ success: true, data: commande });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 📦 Ajouter un produit à une commande existante
exports.ajouterProduitALaCommande = async (req, res) => {
    try {
        const { commandeId, produitId, quantite } = req.body;
        const item = await CommandeProduit.create({ commandeId, produitId, quantite });
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};