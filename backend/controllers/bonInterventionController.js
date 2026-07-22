const { BonIntervention, Reservation, Fournisseur, User } = require('../models');
// Import de ton utilitaire Firebase (adapte le chemin selon l'emplacement de ton fichier)
const { sendPushNotification } = require('../utils/firebaseNotifier');

// ── POST /api/bons-intervention — Le prestataire crée le bon ──
exports.creerBonIntervention = async (req, res) => {
    try {
        const {
            reservationId,
            descriptionTravail,
            montantMainOeuvre,
            piecesOutils,
            montantPiecesOutils
        } = req.body;

        // 1. Validation de la requête
        if (!reservationId || !descriptionTravail || montantMainOeuvre === undefined) {
            return res.status(400).json({
                success: false,
                message: 'reservationId, descriptionTravail et montantMainOeuvre sont obligatoires.'
            });
        }

        // 2. Vérification de la réservation + Récupération des infos du Client pour la notif
        const reservation = await Reservation.findByPk(reservationId, {
            include: [{ model: User, as: 'client', attributes: ['id', 'fcmToken', 'prenom', 'nom'] }]
        });

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        }

        // 3. Récupération du profil fournisseur de l'utilisateur connecté
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) {
            return res.status(404).json({ success: false, message: 'Profil fournisseur introuvable.' });
        }

        // 4. Empêcher les doublons
        const existant = await BonIntervention.findOne({ where: { reservationId } });
        if (existant) {
            return res.status(409).json({
                success: false,
                message: 'Un bon d\'intervention existe déjà pour cette réservation.'
            });
        }

        // 5. Calculs sécurisés des montants
        const mainOeuvre = parseFloat(montantMainOeuvre) || 0;
        const montantPieces = montantPiecesOutils ? parseFloat(montantPiecesOutils) : 0;
        const montantFinal = mainOeuvre + montantPieces;

        // 6. Date limite pour le dépôt de commission (48h)
        const commissionDateLimite = new Date();
        commissionDateLimite.setHours(commissionDateLimite.getHours() + 48);

        // 7. Enregistrement du Bon d'Intervention
        const bon = await BonIntervention.create({
            reservationId,
            fournisseurId: fournisseur.id,
            descriptionTravail,
            montantMainOeuvre: mainOeuvre,
            piecesOutils: piecesOutils || null,
            montantPiecesOutils: montantPieces,
            montantFinal
        });

        // 8. Mise à jour de la réservation
        await reservation.update({
            statut: 'TERMINEE',
            commissionDateLimite
        });

        // 📲 9. NOTIFICATION PUSH FIREBASE CLIENT (Non bloquante)
        try {
            if (reservation.clientId && typeof sendPushNotification === 'function') {
                await sendPushNotification({
                    userId: reservation.clientId,
                    title: "📋 Bon d'intervention reçu !",
                    body: `Le prestataire a terminé l'intervention #${reservationId}. Validez le montant (${montantFinal.toLocaleString()} FCFA) pour clôturer la mission.`,
                    data: {
                        type: 'BON_INTERVENTION',
                        reservationId: String(reservationId),
                        bonId: String(bon.id)
                    }
                });
            }
        } catch (notifErr) {
            // L'échec d'envoi de la notif ne bloque pas la création du bon
            console.error('⚠️ Avertissement notification push :', notifErr.message);
        }

        return res.status(201).json({
            success: true,
            message: "Bon d'intervention créé avec succès et envoyé au client.",
            data: bon
        });

    } catch (err) {
        console.error('❌ Erreur creerBonIntervention:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la création du bon.' });
    }
};

// ── GET /api/bons-intervention/reservation/:id — Voir le bon ──
exports.getBonParReservation = async (req, res) => {
    try {
        const bon = await BonIntervention.findOne({
            where: { reservationId: req.params.id },
            include: [
                { model: Fournisseur, as: 'fournisseurBon', attributes: ['id', 'nomEntreprise', 'telephone'] }
            ]
        });
        if (!bon) {
            return res.status(404).json({ success: false, message: 'Aucun bon d\'intervention pour cette réservation.' });
        }
        return res.json({ success: true, data: bon });
    } catch (err) {
        console.error('❌ Erreur getBonParReservation:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── PUT /api/bons-intervention/:id/valider — Le client valide le bon ──
exports.validerBon = async (req, res) => {
    try {
        const { note, commentaire } = req.body;

        const bon = await BonIntervention.findByPk(req.params.id);
        if (!bon) {
            return res.status(404).json({ success: false, message: 'Bon d\'intervention introuvable.' });
        }
        if (bon.valide) {
            return res.status(400).json({ success: false, message: 'Ce bon a déjà été validé.' });
        }

        await bon.update({
            valide: true,
            valideLe: new Date(),
            valideAutomatiquement: false,
            note: note || null,
            commentaire: commentaire || null,
        });

        await Reservation.update(
            { statut: 'VALIDEE' },
            { where: { id: bon.reservationId } }
        );

        if (note) {
            const fournisseur = await Fournisseur.findByPk(bon.fournisseurId);
            if (fournisseur) {
                const nouvelleMoyenne =
                    (fournisseur.note * fournisseur.nombreAvis + parseInt(note)) /
                    (fournisseur.nombreAvis + 1);
                await fournisseur.update({
                    note: nouvelleMoyenne,
                    nombreAvis: fournisseur.nombreAvis + 1
                });
            }
        }

        return res.json({ success: true, data: bon, message: 'Prestation validée avec succès.' });

    } catch (err) {
        console.error('❌ Erreur validerBon:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── GET /api/bons-intervention/en-attente — Pour le job de validation auto 24h ──
exports.getBonsEnAttenteValidation = async (req, res) => {
    try {
        const limite24h = new Date();
        limite24h.setHours(limite24h.getHours() - 24);

        const bons = await BonIntervention.findAll({
            where: {
                valide: false,
                createdAt: { [require('sequelize').Op.lte]: limite24h }
            }
        });

        return res.json({ success: true, data: bons });
    } catch (err) {
        console.error('❌ Erreur getBonsEnAttenteValidation:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};