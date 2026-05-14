const { Reservation } = require('../models');
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

        if (!telephone) {
            return res.status(400).json({
                success: false,
                message: 'Le numéro de téléphone est obligatoire.'
            });
        }

        const photo = req.files?.photo?.[0]?.filename || null;
        const audio = req.files?.audio?.[0]?.filename || null;
        const montantNet = montantEstime ? parseFloat(montantEstime) : 0;

        const reservation = await Reservation.create({
            clientId: null,           // pas de compte requis
            fournisseurId: fournisseurId || null,
            serviceId: serviceId || null,
            description: description || null,
            dateSouhaitee: dateSouhaitee ? new Date(dateSouhaitee) : new Date(),
            adresseIntervention: adresseIntervention || 'Non précisée',
            telephone,
            clientNom: clientNom || null,
            serviceNom: serviceNom || 'Plomberie',
            photo,
            audio,
            statut: 'EN_ATTENTE',
            montantTotal: montantNet,
            acompte: null,
            acomptePaye: false,
            paiementLibere: false,
        });

        // 📱 Envoyer notifications SMS + Email à l'admin
        setTimeout(async () => {
            try {
                // Email
                await sendAdminNotificationEmail(
                    process.env.ADMIN_EMAIL || adminConfig.adminEmail || 'admin@incha-allah.com',
                    reservation
                );
                
                // SMS
                await sendAdminNotificationSMS(
                    adminConfig.adminPhone,
                    reservation
                );
            } catch (err) {
                console.error('⚠️ Erreur notification:', err.message);
            }
        }, 500);
        
        res.status(201).json({
            success: true,
            message: 'Réservation créée.',
            commandeId: reservation.id,
            montant_total: montantNet,
        });

    } catch (err) {
        console.error('Erreur Controller Reservation:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};