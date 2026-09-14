const { Commande, CommandeProduit, Produit, Fournisseur, User } = require('../models');
const { sendNotification } = require('../utils/notifications');

// 📝 Créer une commande complète (Panier) avec notification des fournisseurs
exports.create = async (req, res) => {
    try {
        const { produits, fraisLivraison } = req.body;

        if (!Array.isArray(produits) || produits.length === 0) {
            return res.status(400).json({ success: false, message: 'Le panier est vide.' });
        }

        let montantTotal = 0;
        const itemsDetails = [];

        // 1. Validation des produits et calcul du total + regroupement par fournisseur
        for (const item of produits) {
            const produit = await Produit.findByPk(item.produitId, {
                include: [{ model: Fournisseur, as: 'fournisseur' }]
            });
            if (produit) {
                const sousTotal = produit.prix * item.quantite;
                montantTotal += sousTotal;
                itemsDetails.push({
                    produit,
                    quantite: item.quantite,
                    sousTotal,
                    fournisseurId: produit.fournisseurId
                });
            }
        }

        montantTotal += (fraisLivraison || 0);

        // 2. Création de la commande globale
        const commande = await Commande.create({
            clientId: req.user.id,
            fraisLivraison: fraisLivraison || 0,
            montantTotal,
            statut: 'EN_ATTENTE'
        });

        // 3. Association des produits à la commande
        for (const item of produits) {
            await CommandeProduit.create({
                commandeId: commande.id,
                produitId: item.produitId,
                quantite: item.quantite
            });
        }

        // 4. 🔔 Notification automatique des fournisseurs concernés
        // Regrouper les articles par fournisseur pour envoyer une seule notification claire par fournisseur
        const fournisseursMap = {};
        for (const detail of itemsDetails) {
            if (detail.fournisseurId) {
                if (!fournisseursMap[detail.fournisseurId]) {
                    fournisseursMap[detail.fournisseurId] = [];
                }
                fournisseursMap[detail.fournisseurId].push(detail);
            }
        }

        for (const [fournisseurId, articles] of Object.entries(fournisseursMap)) {
            try {
                const fournisseur = await Fournisseur.findByPk(fournisseurId);
                if (fournisseur && fournisseur.fcmToken) {
                    const resumeArticles = articles
                        .map(a => `- ${a.produit.nom} (x${a.quantite})`)
                        .join('\n');

                    await sendNotification({
                        token: fournisseur.fcmToken,
                        title: '🛍️ Nouvelle Commande Reçue !',
                        body: `Commande #${commande.id}\n${resumeArticles}`,
                        data: {
                            type: 'COMMANDE',
                            commandeId: String(commande.id)
                        }
                    });
                }
            } catch (notifErr) {
                console.error(`Erreur notification fournisseur #${fournisseurId} :`, notifErr.message);
            }
        }

        res.status(201).json({
            success: true,
            commandeId: commande.id,
            montant_total: montantTotal,
            message: 'Commande validée et transmise aux fournisseurs avec succès.'
        });

    } catch (error) {
        console.error('Erreur create commande:', error);
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
                include: [{
                    model: Produit,
                    as: 'produitCommandeProduit',
                    include: [{ model: Fournisseur, as: 'fournisseur', attributes: ['id', 'nomEntreprise', 'telephone'] }]
                }]
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
                include: [{
                    model: Produit,
                    as: 'produitCommandeProduit',
                    include: [{ model: Fournisseur, as: 'fournisseur', attributes: ['id', 'nomEntreprise', 'telephone'] }]
                }]
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