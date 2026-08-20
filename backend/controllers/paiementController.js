const Paiement = require('../models/Paiement');
const Commande = require('../models/Commande');
const Reservation = require('../models/Reservation'); // 💡 Prise en charge des Réservations
const sequelize = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// 🔐 1. Paiements du client connecté (Historique)
exports.getPaiementsClient = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: 'Non autorisé. Utilisateur introuvable.' });
        }

        const paiements = await Paiement.findAll({
            where: { clientId: req.user.id },
            include: [
                { model: Commande, as: 'commande', required: false },
                { model: Reservation, as: 'reservation', required: false } // 💡 Inclus aussi les réservations
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({ success: true, data: paiements });
    } catch (error) {
        console.error('❌ Erreur getPaiementsClient:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des paiements',
            error: error.message
        });
    }
};

// 🛠️ 2. Paiements pour l’admin (Historique complet)
exports.getAllPaiements = async (req, res) => {
    try {
        const paiements = await Paiement.findAll({
            include: [
                { model: Commande, as: 'commande', required: false },
                { model: Reservation, as: 'reservation', required: false }
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({ success: true, data: paiements });
    } catch (error) {
        console.error('❌ Erreur getAllPaiements:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération de l\'historique',
            error: error.message
        });
    }
};

// 🔍 3. Vérification d'un paiement par transactionId ou referenceClient
exports.verifyPaiement = async (req, res) => {
    try {
        const { txId } = req.params;

        if (!txId) {
            return res.status(400).json({ success: false, message: 'Le paramètre txId est requis.' });
        }

        const paiement = await Paiement.findOne({
            where: { transactionId: txId },
            include: [
                { model: Commande, as: 'commande', required: false },
                { model: Reservation, as: 'reservation', required: false }
            ]
        });

        if (!paiement) {
            return res.status(404).json({ success: false, message: 'Paiement introuvable.' });
        }

        return res.status(200).json({ success: true, data: paiement });
    } catch (error) {
        console.error('❌ Erreur verifyPaiement:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la vérification',
            error: error.message
        });
    }
};

// 💳 4. Création d’un paiement (Gère COMMANDE et RÉSERVATION)
exports.createMobileMoneyPaiement = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { 
            commandeId, 
            reservationId, 
            montant, 
            telephone, 
            nom, 
            messageClient, 
            referenceClient, 
            modePaiement 
        } = req.body;

        // Vérification d'authentification
        if (!req.user?.id) {
            await transaction.rollback();
            return res.status(401).json({ success: false, message: 'Session expirée ou utilisateur non identifié.' });
        }

        // 💡 Doit fournir SOIT une commande, SOIT une réservation
        if ((!commandeId && !reservationId) || !montant || !telephone) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Informations obligatoires manquantes (commandeId ou reservationId, montant, telephone).'
            });
        }

        // Vérification de l'existence de la Commande si transmise
        if (commandeId) {
            const commande = await Commande.findByPk(commandeId, { transaction });
            if (!commande) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'La commande associée est introuvable.' });
            }
        }

        // Vérification de l'existence de la Réservation si transmise
        if (reservationId) {
            const reservation = await Reservation.findByPk(reservationId, { transaction });
            if (!reservation) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'La réservation associée est introuvable.' });
            }
        }

        // Validation du montant
        const montantSecurise = parseFloat(montant);
        if (isNaN(montantSecurise) || montantSecurise <= 0) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'Le montant doit être un nombre valide et supérieur à 0.' });
        }

        const transactionId = "NV-TRX-" + uuidv4().substring(0, 8).toUpperCase();
        const refEffective = referenceClient ? referenceClient.trim() : `REF-${Date.now()}`;

        // 1️⃣ Enregistrement de la ligne de Paiement
        const paiement = await Paiement.create({
            commandeId: commandeId || null,
            reservationId: reservationId || null,
            clientId: req.user.id,
            montant: montantSecurise,
            telephone: telephone.trim(),
            nom: nom ? nom.trim() : (req.user.nom || 'Client'),
            statut: 'en_attente',
            modePaiement: modePaiement || 'mobile_money',
            transactionId,
            referenceClient: refEffective,
            messageClient: messageClient ? messageClient.trim() : null
        }, { transaction });

        // 2️⃣ Mise à jour du statut de la Commande ou de la Réservation
        if (commandeId) {
            await Commande.update(
                { statutPaiement: 'en_attente_verification' },
                { where: { id: commandeId }, transaction }
            );
        }

        if (reservationId) {
            await Reservation.update(
                { statutPaiement: 'en_attente_verification' },
                { where: { id: reservationId }, transaction }
            );
        }

        await transaction.commit();

        return res.status(201).json({
            success: true,
            message: 'Paiement enregistré et transmis à l\'administration pour validation.',
            data: paiement
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Erreur createMobileMoneyPaiement:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'Cette référence de paiement a déjà été enregistrée.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création du paiement',
            error: error.message
        });
    }
};

// 🛠️ 5. Validation ou Rejet du paiement par l'Admin
exports.updateStatutPaiement = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;
        const { statut } = req.body;

        const statutsAutorises = ['valide', 'rejete', 'en_attente'];
        if (!statutsAutorises.includes(statut)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Statut invalide. Utilisez : ${statutsAutorises.join(', ')}`
            });
        }

        const paiement = await Paiement.findByPk(id, { transaction });
        if (!paiement) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Paiement introuvable.' });
        }

        if (paiement.statut === statut) {
            await transaction.rollback();
            return res.status(200).json({ success: true, message: 'Le paiement possède déjà ce statut.', data: paiement });
        }

        // 1️⃣ Mise à jour du statut de paiement
        paiement.statut = statut;
        if (statut === 'valide') {
            paiement.confirmationDate = new Date();
        }
        await paiement.save({ transaction });

        // 2️⃣ Synchronisation de la Commande OU de la Réservation associée
        if (statut === 'valide') {
            if (paiement.commandeId) {
                await Commande.update(
                    { statutPaiement: 'paye', statut: 'en_cours' },
                    { where: { id: paiement.commandeId }, transaction }
                );
            }
            if (paiement.reservationId) {
                await Reservation.update(
                    { statutPaiement: 'paye', statut: 'confirmee' },
                    { where: { id: paiement.reservationId }, transaction }
                );
            }
        } else if (statut === 'rejete') {
            if (paiement.commandeId) {
                await Commande.update(
                    { statutPaiement: 'echec' },
                    { where: { id: paiement.commandeId }, transaction }
                );
            }
            if (paiement.reservationId) {
                await Reservation.update(
                    { statutPaiement: 'echec' },
                    { where: { id: paiement.reservationId }, transaction }
                );
            }
        }

        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: `Paiement mis à jour avec succès au statut : ${statut}.`,
            data: paiement
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Erreur updateStatutPaiement:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la mise à jour du statut',
            error: error.message
        });
    }
};