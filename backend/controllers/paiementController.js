const Paiement = require('../models/Paiement');
const Commande = require('../models/Commande');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// 🔐 Paiements du client connecté
exports.getPaiementsClient = async (req, res) => {
    try {
        const paiements = await Paiement.findAll({
            where: { clientId: req.user.id },
            include: ['commandePaiement'],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: paiements });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

// 🛠️ Paiements pour l’admin
exports.getAllPaiements = async (req, res) => {
    try {
        const paiements = await Paiement.findAll({
            include: ['commandePaiement'],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: paiements });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

// 🔍 Vérification par transactionId
exports.verifyPaiement = async (req, res) => {
    try {
        const { txId } = req.params;
        const paiement = await Paiement.findOne({ where: { transactionId: txId } });

        if (!paiement) {
            return res.status(404).json({ success: false, message: 'Paiement introuvable' });
        }

        res.json({ success: true, data: paiement });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

// 💳 Création d’un paiement mobile money
exports.createMobileMoneyPaiement = async (req, res) => {
    try {
        const { commandeId, montant, telephone, nom, messageClient } = req.body;

        const commande = await Commande.findByPk(commandeId);
        if (!commande) {
            return res.status(404).json({ success: false, message: 'Commande introuvable' });
        }

        const transactionId = uuidv4();
        const referenceClient = `REF-${Date.now()}`;

        const paiement = await Paiement.create({
            commandeId,
            clientId: req.user.id,
            montant,
            telephone,
            nom,
            statut: 'en_attente',
            modePaiement: 'mobile_money',
            transactionId,
            referenceClient,
            messageClient
        });

        res.status(201).json({
            success: true,
            message: 'Paiement initié avec succès',
            data: paiement
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

// 🛠️ Mise à jour du statut (admin ou webhook)
exports.updateStatutPaiement = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, confirmationDate } = req.body;

        const paiement = await Paiement.findByPk(id);
        if (!paiement) {
            return res.status(404).json({ success: false, message: 'Paiement introuvable' });
        }

        paiement.statut = statut || paiement.statut;
        paiement.confirmationDate = confirmationDate || paiement.confirmationDate;

        await paiement.save();

        res.json({ success: true, message: 'Statut mis à jour', data: paiement });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};
