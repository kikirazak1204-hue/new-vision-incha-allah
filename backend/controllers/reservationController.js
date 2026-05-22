const { Reservation, Service, Fournisseur } = require('../models');
const { sendAdminNotificationEmail, sendAdminNotificationSMS } = require('../services/notificationService');
const adminConfig = require('../config/admin.json');

exports.creerReservation = async (req, res) => {
    try {
        const {
            telephone,
            description,
            clientNom,
            serviceNom,
            montantEstime,
            fournisseurId,
            serviceId,
            dateSouhaitee,
            adresseIntervention,
        } = req.body;

        // ✅ Validation stricte du téléphone
        if (!telephone || typeof telephone !== 'string' || telephone.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Le numéro de téléphone est obligatoire et valide.'
            });
        }

        const photo = req.files?.photo?.[0]?.filename || null;
        const audio = req.files?.audio?.[0]?.filename || null;
        const montantNet = montantEstime ? parseFloat(montantEstime) : 0;

        // ✅ Préparer les données avec validation
        const reservationData = {
            clientId: null,
            fournisseurId: fournisseurId ? parseInt(fournisseurId) : null,
            serviceId: serviceId ? parseInt(serviceId) : null,
            description: description && description.trim() ? description.trim().substring(0, 1000) : null,
            dateSouhaitee: dateSouhaitee ? new Date(dateSouhaitee) : new Date(),
            adresseIntervention: adresseIntervention && adresseIntervention.trim() ? adresseIntervention.trim().substring(0, 255) : 'Non précisée',
            telephone: telephone.trim().substring(0, 20),
            clientNom: clientNom && clientNom.trim() ? clientNom.trim().substring(0, 100) : 'Client anonyme',
            serviceNom: serviceNom && serviceNom.trim() ? serviceNom.trim().substring(0, 100) : 'Service non spécifié',
            photo,
            audio,
            statut: 'EN_ATTENTE',
            montantTotal: !isNaN(montantNet) ? Math.max(0, montantNet) : 0,
            acompte: null,
            acomptePaye: false,
            paiementLibere: false,
        };

        // ✅ Créer la réservation
        const reservation = await Reservation.create(reservationData);

        console.log(`✅ Réservation créée: ID=${reservation.id}, Téléphone=${reservation.telephone}`);

        // 📱 Envoyer notifications SMS + Email à l'admin (asynchrone, non-bloquant)
        setImmediate(async () => {
            try {
                const adminEmail = process.env.ADMIN_EMAIL || adminConfig?.adminEmail || 'admin@incha-allah.com';
                const adminPhone = adminConfig?.adminPhone;

                // Email
                if (adminEmail && adminEmail !== '') {
                    try {
                        await sendAdminNotificationEmail(adminEmail, reservation);
                    } catch (emailErr) {
                        console.error('⚠️ Erreur email:', emailErr.message);
                    }
                }

                // SMS
                if (adminPhone && adminPhone !== '') {
                    try {
                        await sendAdminNotificationSMS(adminPhone, reservation);
                    } catch (smsErr) {
                        console.error('⚠️ Erreur SMS:', smsErr.message);
                    }
                }
            } catch (err) {
                console.error('⚠️ Erreur lors des notifications:', err.message);
                // N'interrompt pas la réponse - les notifications sont optionnelles
            }
        });

        // ✅ Répondre immédiatement au client
        return res.status(201).json({
            success: true,
            message: 'Réservation créée avec succès. Vous serez contacté rapidement.',
            commandeId: reservation.id,
            montant_total: reservationData.montantTotal,
        });

    } catch (err) {
        console.error('❌ Erreur Reservation Controller:', err.message);
        console.error('Stack:', err.stack);

        // ✅ Retourner une erreur descriptive
        if (err.name === 'SequelizeValidationError') {
            const messages = err.errors.map(e => e.message).join('; ');
            return res.status(400).json({
                success: false,
                message: `Validation error: ${messages}`
            });
        }

        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                message: 'Cette réservation existe déjà.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création de la réservation. Veuillez réessayer.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};