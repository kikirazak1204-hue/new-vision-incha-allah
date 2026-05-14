// controllers/factureController.js
const { Facture, Commande, CommandeProduit, Produit, Fournisseur, User } = require('../models');

/**
 * 🔹 Obtenir toutes les factures (admin ou client)
 */
exports.getAll = async (req, res) => {
    try {
        const where = req.user.role === 'admin' ? {} : { clientId: req.user.id };

        const factures = await Facture.findAll({
            where,
            include: [
                { model: Commande, as: 'factureCommande', include: [{ model: CommandeProduit, include: [{ model: Produit }] }] },
                { model: Fournisseur, as: 'factureFournisseur', attributes: ['id', 'nomEntreprise'] },
                { model: User, as: 'factureClient', attributes: ['id', 'nom', 'prenom', 'email', 'telephone'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({ success: true, count: factures.length, data: factures });
    } catch (error) {
        console.error('Erreur getAll factures:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

/**
 * 🔹 Obtenir une facture par ID (client, fournisseur ou admin)
 */
exports.getById = async (req, res) => {
    try {
        const facture = await Facture.findByPk(req.params.id, {
            include: [
                { model: Commande, as: 'factureCommande', include: [{ model: CommandeProduit, include: [{ model: Produit }] }] },
                { model: Fournisseur, as: 'factureFournisseur', attributes: ['id', 'nomEntreprise'] },
                { model: User, as: 'factureClient', attributes: ['id', 'nom', 'prenom', 'email', 'telephone'] }
            ]
        });

        if (!facture) return res.status(404).json({ success: false, message: 'Facture non trouvée' });

        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        const isFournisseur = fournisseur && facture.fournisseurId === fournisseur.id;
        const isClient = facture.clientId === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isFournisseur && !isClient && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }

        res.json({ success: true, data: facture });
    } catch (error) {
        console.error('Erreur getById facture:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

/**
 * 🔹 Créer une facture (fournisseur ou admin)
 */
exports.create = async (req, res) => {
    try {
        const { commandeId, tvaTaux } = req.body;

        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(400).json({ success: false, message: 'Profil fournisseur requis' });

        const commande = await Commande.findByPk(commandeId, {
            include: [{ model: CommandeProduit, include: [{ model: Produit }] }]
        });

        if (!commande) return res.status(404).json({ success: false, message: 'Commande non trouvée' });

        const montantHT = commande.montantTotal - (commande.fraisLivraison || 0);
        const taux = tvaTaux || 19;
        const tvaMontant = (montantHT * taux) / 100;
        const montantTotal = montantHT + tvaMontant;

        const facture = await Facture.create({
            commandeId: commande.id,
            fournisseurId: fournisseur.id,
            clientId: commande.clientId,
            montantHT,
            tvaTaux: taux,
            tvaMontant,
            montantTotal,
            statut: 'en_attente',
            dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        res.status(201).json({ success: true, message: 'Facture créée avec succès', data: facture });
    } catch (error) {
        console.error('Erreur create facture:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

/**
 * 🔹 Mettre à jour le statut d’une facture
 */
exports.updateStatut = async (req, res) => {
    try {
        const { statut } = req.body;
        const facture = await Facture.findByPk(req.params.id);

        if (!facture) return res.status(404).json({ success: false, message: 'Facture non trouvée' });

        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        const isFournisseur = fournisseur && facture.fournisseurId === fournisseur.id;
        const isAdmin = req.user.role === 'admin';

        if (!isFournisseur && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }

        await facture.update({ statut });
        res.json({ success: true, message: 'Statut mis à jour', data: facture });
    } catch (error) {
        console.error('Erreur updateStatut facture:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

/**
 * 🔹 Obtenir les factures du fournisseur connecté (pour le Dashboard)
 */
exports.getFacturesFournisseur = async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(404).json({ success: false, message: 'Fournisseur non trouvé' });

        const factures = await Facture.findAll({
            where: { fournisseurId: fournisseur.id },
            include: [
                {
                    model: Commande,
                    as: 'factureCommande',
                    include: [{ model: User, as: 'commandeClient', attributes: ['id', 'nom', 'prenom', 'email', 'telephone'] }]
                },
                { model: User, as: 'factureClient', attributes: ['id', 'nom', 'prenom', 'email', 'telephone'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({ success: true, count: factures.length, data: factures });
    } catch (error) {
        console.error('Erreur getFacturesFournisseur:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};
