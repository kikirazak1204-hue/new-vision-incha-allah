const Paiement = require('../models/Paiement');
const Commande = require('../models/Commande');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// 🔐 Paiements du client connecté
exports.getPaiementsClient = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Non autorisé. Utilisateur introuvable.' });
        }

        const paiements = await Paiement.findAll({
            where: { clientId: req.user.id },
            // 🛡️ Code robuste : On retire l'alias 'as' qui provoquait l'erreur
            include: [Commande],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({ success: true, data: paiements });
    } catch (error) {
        console.error('❌ Erreur getPaiementsClient:', error);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération des paiements', error: error.message });
    }
};

// 🛠️ Paiements pour l’admin (Tout l'historique)
exports.getAllPaiements = async (req, res) => {
    try {
        const paiements = await Paiement.findAll({
            // 🛡️ Code robuste : Pas d'alias
            include: [Commande],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({ success: true, data: paiements });
    } catch (error) {
        console.error('❌ Erreur getAllPaiements:', error);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération de l\'historique', error: error.message });
    }
};

// 🔍 Vérification par transactionId
exports.verifyPaiement = async (req, res) => {
    try {
        const { txId } = req.params;

        if (!txId) {
            return res.status(400).json({ success: false, message: 'Le paramètre txId est requis.' });
        }

        const paiement = await Paiement.findOne({
            where: { transactionId: txId },
            include: [Commande]
        });

        if (!paiement) {
            return res.status(404).json({ success: false, message: 'Paiement introuvable.' });
        }

        return res.status(200).json({ success: true, data: paiement });
    } catch (error) {
        console.error('❌ Erreur verifyPaiement:', error);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la vérification', error: error.message });
    }
};

// 💳 Création d’un paiement mobile money (Soumission par le client)
exports.createMobileMoneyPaiement = async (req, res) => {
    try {
        const { commandeId, montant, telephone, nom, messageClient, referenceClient, modePaiement } = req.body;

        // 🛡️ Validation stricte des données d'entrée
        if (!commandeId || !montant || !telephone) {
            return res.status(400).json({
                success: false,
                message: 'Informations obligatoires manquantes (commandeId, montant, telephone).'
            });
        }

        const commande = await Commande.findByPk(commandeId);
        if (!commande) {
            return res.status(404).json({ success: false, message: 'La commande associée est introuvable.' });
        }

        // 🛡️ Formatage des données
        const montantSecurise = parseFloat(montant);
        if (isNaN(montantSecurise) || montantSecurise <= 0) {
            return res.status(400).json({ success: false, message: 'Le montant doit être un nombre valide et supérieur à 0.' });
        }

        const transactionId = "NV-TRX-" + uuidv4().substring(0, 8).toUpperCase();
        const refEffective = referenceClient || `REF-${Date.now()}`;

        // 🛡️ Création du paiement
        const paiement = await Paiement.create({
            commandeId,
            clientId: req.user.id,
            montant: montantSecurise,
            telephone: telephone.trim(),
            nom: nom ? nom.trim() : (req.user.nom || 'Client'),
            statut: 'en_attente',
            modePaiement: modePaiement || 'mobile_money',
            transactionId,
            referenceClient: refEffective,
            messageClient: messageClient ? messageClient.trim() : null
        });

        // 🛡️ Mise à jour de la commande
        await Commande.update(
            { statutPaiement: 'en_attente_verification' },
            { where: { id: commandeId } }
        );

        return res.status(201).json({
            success: true,
            message: 'Paiement enregistré et transmis à l\'administration pour validation.',
            data: paiement
        });
    } catch (error) {
        console.error('❌ Erreur createMobileMoneyPaiement:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'Cette référence de paiement a déjà été enregistrée (doublon).'
            });
        }

        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la création du paiement', error: error.message });
    }
};

// 🛠️ Validation ou Rejet du paiement par l'Admin
exports.updateStatutPaiement = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;

        // 🛡️ Validation stricte du statut
        const statutsAutorises = ['valide', 'rejete', 'en_attente'];
        if (!statutsAutorises.includes(statut)) {
            return res.status(400).json({ success: false, message: `Statut invalide. Utilisez : ${statutsAutorises.join(', ')}` });
        }

        const paiement = await Paiement.findByPk(id);
        if (!paiement) {
            return res.status(404).json({ success: false, message: 'Paiement introuvable.' });
        }

        // Si le statut est déjà celui demandé, on ne fait rien
        if (paiement.statut === statut) {
            return res.status(200).json({ success: true, message: 'Le paiement possède déjà ce statut.', data: paiement });
        }

        // 🛡️ Mise à jour du paiement
        paiement.statut = statut;
        if (statut === 'valide') {
            paiement.confirmationDate = new Date();
        }
        await paiement.save();

        // 🛡️ Synchronisation de la commande associée
        if (statut === 'valide') {
            await Commande.update(
                { statutPaiement: 'paye', statut: 'en_cours' },
                { where: { id: paiement.commandeId } }
            );
        } else if (statut === 'rejete') {
            await Commande.update(
                { statutPaiement: 'echec' },
                { where: { id: paiement.commandeId } }
            );
        }

        return res.status(200).json({
            success: true,
            message: `Paiement mis à jour avec succès au statut : ${statut}.`,
            data: paiement
        });
    } catch (error) {
        console.error('❌ Erreur updateStatutPaiement:', error);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la mise à jour du statut', error: error.message });
    }
};