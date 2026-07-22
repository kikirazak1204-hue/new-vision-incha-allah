const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const Paiement = require('../models/Paiement');
const Commande = require('../models/Commande');
const CommandeProduit = require('../models/CommandeProduit');
const Produit = require('../models/Produit');
const Fournisseur = require('../models/Fournisseur');

const buildCommandeFromPayload = async (commandeId, articles, userId) => {
    let commande = null;
    const numericId = Number(commandeId);

    if (commandeId && Number.isInteger(numericId)) {
        commande = await Commande.findByPk(numericId);
    }

    if (!commande && Array.isArray(articles) && articles.length > 0) {
        commande = await Commande.create({
            clientId: userId,
            fraisLivraison: 0,
            montantTotal: 0,
            statut: 'en_attente'
        });

        let montantCalcule = 0;
        for (const item of articles) {
            const produitId = item.produitId || item.id;
            const quantite = Number(item.quantite || 1);
            if (!produitId || quantite <= 0) continue;

            const produit = await Produit.findByPk(produitId);
            if (!produit) continue;

            montantCalcule += produit.prix * quantite;
            await CommandeProduit.create({
                commandeId: commande.id,
                produitId,
                quantite
            });
        }

        commande.montantTotal = montantCalcule;
        await commande.save();
    }

    return commande;
};

const handleMobileMoneyPaiement = async (req, res) => {
    try {
        const {
            commandeId,
            montant,
            telephone,
            modePaiement,
            referenceClient,
            referenceTransaction,
            nom,
            messageClient,
            articles
        } = req.body;

        const reference = referenceClient || referenceTransaction;
        if (!telephone || !reference) {
            return res.status(400).json({
                success: false,
                message: "Informations de paiement manquantes (Téléphone ou Référence)."
            });
        }

        const commande = await buildCommandeFromPayload(commandeId, articles, req.user.id);
        if (!commande) {
            return res.status(404).json({
                success: false,
                message: 'Commande introuvable et aucun panier valide n a été fourni.'
            });
        }

        const montantPaiement = Number(montant) || Number(commande.montantTotal) || 0;
        if (montantPaiement <= 0) {
            return res.status(400).json({ success: false, message: 'Montant de paiement invalide.' });
        }

        const internalTxnId = "NV-TRX-" + Date.now();

        const nouveauPaiement = await Paiement.create({
            commandeId: commande.id,
            clientId: req.user.id,
            transactionId: internalTxnId,
            referenceClient: reference,
            montant: montantPaiement,
            telephone,
            nom: nom || req.user.nom || "Client",
            modePaiement: modePaiement || 'mobile_money',
            statut: 'en_attente',
            messageClient: messageClient || null
        });

        await Commande.update(
            { statutPaiement: 'en_attente_verification' },
            { where: { id: commande.id } }
        );

        return res.status(201).json({
            success: true,
            message: "Votre demande de paiement a été soumise avec succès et est en cours de vérification.",
            data: nouveauPaiement
        });

    } catch (err) {
        console.error('❌ Erreur Enregistrement Paiement:', err);

        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: "Cette référence de transaction a déjà été utilisée."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de l'enregistrement de votre paiement."
        });
    }
};

// 1. CÔTÉ CLIENT : Soumettre une preuve de paiement
router.post('/', protect, handleMobileMoneyPaiement);
router.post('/mobile-money', protect, handleMobileMoneyPaiement);

// 2. CÔTÉ CLIENT / UTILISATEUR : Récupérer son propre historique de paiements
router.get('/historique', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let whereCondition = {};

        if (userRole === 'client') {
            whereCondition = { clientId: userId };
        }
        else if (userRole === 'prestataire' || userRole === 'fournisseur') {
            const fournisseur = await Fournisseur.findOne({ where: { userId } });
            if (!fournisseur) {
                return res.status(200).json({ success: true, data: [] });
            }

            const commandesPrestataire = await Commande.findAll({
                where: { fournisseurId: fournisseur.id },
                attributes: ['id']
            });
            const commandeIds = commandesPrestataire.map(c => c.id);
            if (commandeIds.length === 0) {
                return res.status(200).json({ success: true, data: [] });
            }
            whereCondition = { commandeId: commandeIds };
        }

        const paiements = await Paiement.findAll({
            where: whereCondition,
            include: [
                {
                    model: Commande,
                    as: 'commande'
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: paiements
        });

    } catch (err) {
        console.error('❌ Erreur Récupération Historique Paiements:', err);
        return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération de votre historique de paiements."
        });
    }
});

// 3. CÔTÉ ADMIN : Récupérer tous les paiements
router.get('/admin/liste', protect, adminOnly, async (req, res) => {
    try {
        const paiements = await Paiement.findAll({
            include: [
                {
                    model: Commande,
                    as: 'commande'
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: paiements
        });
    } catch (err) {
        console.error('❌ Erreur Récupération Paiements Admin:', err);
        return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération de la liste des paiements."
        });
    }
});

// 4. CÔTÉ ADMIN : Valider un paiement
router.put('/admin/:id/valider', protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;

        const paiement = await Paiement.findByPk(id);
        if (!paiement) {
            return res.status(404).json({ success: false, message: "Paiement introuvable." });
        }

        paiement.statut = 'valide';
        paiement.confirmationDate = new Date();
        await paiement.save();

        await Commande.update(
            { statutPaiement: 'paye', statut: 'en_cours' },
            { where: { id: paiement.commandeId } }
        );

        return res.status(200).json({
            success: true,
            message: "Paiement validé avec succès !",
            data: paiement
        });
    } catch (err) {
        console.error('❌ Erreur Validation Paiement:', err);
        return res.status(500).json({ success: false, message: "Erreur lors de la validation." });
    }
});

// 5. CÔTÉ ADMIN : Rejeter un paiement
router.put('/admin/:id/rejeter', protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;

        const paiement = await Paiement.findByPk(id);
        if (!paiement) {
            return res.status(404).json({ success: false, message: "Paiement introuvable." });
        }

        paiement.statut = 'rejete';
        await paiement.save();

        await Commande.update(
            { statutPaiement: 'echec' },
            { where: { id: paiement.commandeId } }
        );

        return res.status(200).json({
            success: true,
            message: "Paiement rejeté.",
            data: paiement
        });
    } catch (err) {
        console.error('❌ Erreur Rejet Paiement:', err);
        return res.status(500).json({ success: false, message: "Erreur lors du rejet." });
    }
});

module.exports = router;