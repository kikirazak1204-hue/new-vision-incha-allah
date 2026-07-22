const Paiement = require('../models/Paiement');
const Commande = require('../models/Commande');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// 🔐 Paiements du client connecté
exports.getPaiementsClient = async (req, res) => {
    try {
        const paiements = await Paiement.findAll({
            where: { clientId: req.user.id },
            include: [{ model: Commande, as: 'commande' }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: paiements });
    } catch (error) {
        console.error('❌ Erreur getPaiementsClient:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

// 🛠️ Paiements pour l’admin (Tout l'historique)
exports.getAllPaiements = async (req, res) => {
    try {
        const paiements = await Paiement.findAll({
            include: [{ model: Commande, as: 'commande' }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: paiements });
    } catch (error) {
        console.error('❌ Erreur getAllPaiements:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

// 🔍 Vérification par transactionId
exports.verifyPaiement = async (req, res) => {
    try {
        const { txId } = req.params;
        const paiement = await Paiement.findOne({
            where: { transactionId: txId },
            include: [{ model: Commande, as: 'commande' }]
        });

        if (!paiement) {
            return res.status(404).json({ success: false, message: 'Paiement introuvable' });
        }

        res.json({ success: true, data: paiement });
    } catch (error) {
        console.error('❌ Erreur verifyPaiement:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

// 💳 Création d’un paiement mobile money (Soumission par le client)
exports.createMobileMoneyPaiement = async (req, res) => {
    try {
        const { commandeId, montant, telephone, nom, messageClient, referenceClient, modePaiement } = req.body;

        if (!commandeId || !montant || !telephone) {
            return res.status(400).json({
                success: false,
                message: 'Informations obligatoires manquantes (commandeId, montant, telephone)'
            });
        }

        const commande = await Commande.findByPk(commandeId);
        if (!commande) {
            return res.status(404).json({ success: false, message: 'Commande introuvable' });
        }

        // Identifiant interne unique pour le système
        const transactionId = "NV-TRX-" + uuidv4().substring(0, 8).toUpperCase();

        // Si le client n'a pas fourni sa référence SMS, on génère un repli
        const refEffective = referenceClient || `REF-${Date.now()}`;

        const paiement = await Paiement.create({
            commandeId,
            clientId: req.user.id,
            montant: parseFloat(montant),
            telephone,
            nom: nom || req.user.nom || 'Client',
            statut: 'en_attente',
            modePaiement: modePaiement || 'mobile_money',
            transactionId,
            referenceClient: refEffective,
            messageClient: messageClient || null
        });

        // Met à jour le statut de la commande côté client
        await Commande.update(
            { statutPaiement: 'en_attente_verification' },
            { where: { id: commandeId } }
        );

        res.status(201).json({
            success: true,
            message: 'Paiement enregistré et transmis à l administration pour validation.',
            data: paiement
        });
    } catch (error) {
        console.error('❌ Erreur createMobileMoneyPaiement:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'Cette référence de paiement a déjà été enregistrée.'
            });
        }

        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

// 🛠️ Validation ou Rejet du paiement par l'Admin
exports.updateStatutPaiement = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body; // 'valide' ou 'rejete'

        if (!['valide', 'rejete', 'en_attente'].includes(statut)) {
            return res.status(400).json({ success: false, message: 'Statut invalide.' });
        }

        const paiement = await Paiement.findByPk(id);
        if (!paiement) {
            return res.status(404).json({ success: false, message: 'Paiement introuvable' });
        }

        paiement.statut = statut;

        if (statut === 'valide') {
            paiement.confirmationDate = new Date();
        }

        await paiement.save();

        // 🔄 Synchronisation automatique de la commande
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

        res.json({
            success: true,
            message: `Paiement passé au statut "${statut}" avec succès.`,
            data: paiement
        });
    } catch (error) {
        console.error('❌ Erreur updateStatutPaiement:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};