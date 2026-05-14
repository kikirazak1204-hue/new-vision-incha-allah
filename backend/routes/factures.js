const express = require('express');
const router = express.Router();
const { Facture, Commande, CommandeProduit, Produit, Fournisseur, User } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const facturesController = require('../controllers/facturesController');

/**
 * 🔹 ROUTE : GET /api/factures
 * Récupère toutes les factures selon le rôle :
 *  - Admin → toutes les factures
 *  - Fournisseur → ses propres factures
 *  - Utilisateur → ses factures client
 */
router.get('/', protect, async (req, res) => {
    try {
        const where = {};

        if (req.user.role === 'fournisseur') {
            const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
            if (fournisseur) where.fournisseurId = fournisseur.id;
        } else if (req.user.role === 'utilisateur') {
            where.clientId = req.user.id;
        }

        const factures = await Facture.findAll({
            where,
            include: [
                { model: Commande, as: 'factureCommande' },
                { model: Fournisseur, as: 'factureFournisseur' },
                { model: User, as: 'factureClient', attributes: ['nom', 'email', 'telephone'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({ success: true, count: factures.length, data: factures });
    } catch (error) {
        console.error('Erreur getFactures:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
});


/**
 * 🔹 ROUTE : GET /api/factures/fournisseur
 * Récupère toutes les factures du fournisseur connecté (pour le dashboard)
 */
router.get('/fournisseur', protect, authorize('fournisseur'), facturesController.getFacturesFournisseur);


/**
 * 🔹 ROUTE : GET /api/factures/:id
 * Récupère une facture par son ID
 */
router.get('/:id', protect, async (req, res) => {
    try {
        const facture = await Facture.findByPk(req.params.id, {
            include: [
                { model: Commande, as: 'factureCommande' },
                { model: Fournisseur, as: 'factureFournisseur' },
                { model: User, as: 'factureClient', attributes: ['nom', 'email', 'telephone'] }
            ]
        });

        if (!facture) {
            return res.status(404).json({ success: false, message: 'Facture non trouvée' });
        }

        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        const isFournisseur = fournisseur && facture.fournisseurId === fournisseur.id;
        const isClient = facture.clientId === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isFournisseur && !isClient && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }

        res.json({ success: true, data: facture });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
});


/**
 * 🔹 ROUTE : POST /api/factures
 * Création d’une facture par un fournisseur ou un admin
 */
router.post('/', protect, authorize('fournisseur', 'admin'), async (req, res) => {
    try {
        const { commandeId, tvaTaux } = req.body;

        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) {
            return res.status(400).json({ success: false, message: 'Profil fournisseur requis' });
        }

        const commande = await Commande.findByPk(commandeId, {
            include: [{ model: CommandeProduit, include: [{ model: Produit }] }]
        });

        if (!commande) {
            return res.status(404).json({ success: false, message: 'Commande non trouvée' });
        }

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
        res.status(500).json({ success: false, message: 'Erreur lors de la création de la facture', error: error.message });
    }
});


/**
 * 🔹 ROUTE : PUT /api/factures/:id/statut
 * Mise à jour du statut d’une facture (par fournisseur ou admin)
 */
router.put('/:id/statut', protect, async (req, res) => {
    try {
        const { statut } = req.body;
        const facture = await Facture.findByPk(req.params.id);

        if (!facture) {
            return res.status(404).json({ success: false, message: 'Facture non trouvée' });
        }

        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        const isFournisseur = fournisseur && facture.fournisseurId === fournisseur.id;
        const isAdmin = req.user.role === 'admin';

        if (!isFournisseur && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Non autorisé' });
        }

        await facture.update({ statut });
        res.json({ success: true, message: 'Statut mis à jour', data: facture });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour', error: error.message });
    }
});

module.exports = router;
