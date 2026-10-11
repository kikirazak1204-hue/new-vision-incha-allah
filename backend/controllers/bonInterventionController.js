const { BonIntervention, Reservation, Fournisseur, User, Setting } = require('../models');
const { Op } = require('sequelize');
const { sendPushNotification } = require('../utils/firebaseNotifier');

const TAUX_COMMISSION_DEFAUT = 10;

async function getTauxCommission() {
    try {
        const setting = await Setting.findOne({ where: { cle: 'commission.taux_standard' } });
        if (!setting) return TAUX_COMMISSION_DEFAUT;
        const taux = parseFloat(setting.valeur);
        return isNaN(taux) ? TAUX_COMMISSION_DEFAUT : taux;
    } catch {
        return TAUX_COMMISSION_DEFAUT;
    }
}

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

               if (!reservationId || !descriptionTravail) {
            return res.status(400).json({ success: false, message: 'reservationId et descriptionTravail sont obligatoires.' });
        }
        

        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) {
            return res.status(403).json({ success: false, message: 'Profil fournisseur introuvable.' });
        }

        const reservation = await Reservation.findByPk(reservationId, {
            include: [{ model: User, as: 'client', attributes: ['id', 'fcmToken', 'prenom', 'nom'] }]
        });

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        }

        if (reservation.fournisseurId !== fournisseur.id) {
            return res.status(403).json({ success: false, message: 'Cette réservation ne vous est pas assignée.' });
        }
        
                const estAbonnement = !!reservation.abonnementId;
        if (!estAbonnement && montantMainOeuvre === undefined) {
            return res.status(400).json({ success: false, message: 'reservationId, descriptionTravail et montantMainOeuvre sont obligatoires.' });
        }

        const existant = await BonIntervention.findOne({ where: { reservationId } });
        if (existant) {
            return res.status(409).json({
                success: false,
                message: 'Un bon d\'intervention existe déjà pour cette réservation.'
            });
        }

              const mainOeuvre = parseFloat(montantMainOeuvre) || 0;
        const montantPieces = montantPiecesOutils ? parseFloat(montantPiecesOutils) : 0;
        const montantFinal = mainOeuvre + montantPieces;

        let bon;
        if (estAbonnement) {
            // Visite d'abonnement : le bon valide seulement la visite, aucun calcul de paiement
            bon = await BonIntervention.create({
                reservationId, fournisseurId: fournisseur.id, descriptionTravail,
                montantMainOeuvre: 0, piecesOutils: piecesOutils || null, montantPiecesOutils: 0,
                tauxCommissionApplique: 0, montantCommission: 0, montantNet: 0
            });
            await reservation.update({ statut: 'TERMINEE' });
        } else {
            const tauxCommission = await getTauxCommission();
            const montantCommission = Math.round((montantFinal * tauxCommission) / 100 * 100) / 100;
            const montantNet = Math.round((montantFinal - montantCommission) * 100) / 100;
            const commissionDateLimite = new Date();
            commissionDateLimite.setHours(commissionDateLimite.getHours() + 48);

            bon = await BonIntervention.create({
                reservationId, fournisseurId: fournisseur.id, descriptionTravail,
                montantMainOeuvre: mainOeuvre, piecesOutils: piecesOutils || null, montantPiecesOutils: montantPieces,
                montantFinal, tauxCommissionApplique: tauxCommission, montantCommission, montantNet
            });
            await reservation.update({ statut: 'TERMINEE', commissionDateLimite });
        }
        try {
            if (reservation.clientId && typeof sendPushNotification === 'function') {
                await sendPushNotification({
                    userId: reservation.clientId,
                    title: "Bon d'intervention reçu",
                                       body: estAbonnement
                        ? `Votre visite d'abonnement #${reservationId} est terminée. Validez-la pour la clôturer.`
                        : `Le prestataire a terminé l'intervention #${reservationId}. Validez le montant (${montantFinal.toLocaleString()} FCFA) pour clôturer la mission.`,
                    data: {
                        type: 'BON_INTERVENTION',
                        reservationId: String(reservationId),
                        bonId: String(bon.id)
                    }
                });
            }
        } catch (notifErr) {
            console.error('Avertissement notification push :', notifErr.message);
        }

        return res.status(201).json({
            success: true,
            message: "Bon d'intervention créé avec succès et envoyé au client.",
            data: bon
        });

    } catch (err) {
        console.error('Erreur creerBonIntervention:', err.message);
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
        console.error('Erreur getBonParReservation:', err.message);
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

        const reservation = await Reservation.findByPk(bon.reservationId);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Réservation associée introuvable.' });
        }

        const isClientAuthorized = reservation.clientId === req.user.id || (req.user.telephone && reservation.telephone === req.user.telephone);
        if (!isClientAuthorized) {
            return res.status(403).json({ success: false, message: 'Seul le client concerné peut valider cette prestation.' });
        }

        await bon.update({
            valide: true,
            valideLe: new Date(),
            valideAutomatiquement: false,
            note: note || null,
            commentaire: commentaire || null,
        });

        await reservation.update({ statut: 'VALIDEE' });

        if (note && !isNaN(note)) {
            const fournisseur = await Fournisseur.findByPk(bon.fournisseurId);
            if (fournisseur) {
                const noteSaisie = parseFloat(note);
                const noteActuelle = parseFloat(fournisseur.note) || 0;
                const nombreAvisActuel = parseInt(fournisseur.nombreAvis) || 0;

                const nouveauNombreAvis = nombreAvisActuel + 1;
                const nouvelleMoyenne = ((noteActuelle * nombreAvisActuel) + noteSaisie) / nouveauNombreAvis;

                await fournisseur.update({
                    note: parseFloat(nouvelleMoyenne.toFixed(2)),
                    nombreAvis: nouveauNombreAvis
                });
            }
        }

        return res.json({ success: true, data: bon, message: 'Prestation validée avec succès.' });

    } catch (err) {
        console.error('Erreur validerBon:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── PUT /api/bons-intervention/:id/valider-admin — l'admin valide pour un client sans smartphone ──
exports.validerBonParAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Réservé aux administrateurs.' });
        }
        const bon = await BonIntervention.findByPk(req.params.id);
        if (!bon) return res.status(404).json({ success: false, message: 'Bon d\'intervention introuvable.' });
        if (bon.valide) return res.status(400).json({ success: false, message: 'Ce bon a déjà été validé.' });

        const reservation = await Reservation.findByPk(bon.reservationId);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation associée introuvable.' });
        if (reservation.statut !== 'TERMINEE') {
            return res.status(400).json({ success: false, message: `La réservation n'est pas à valider (statut : ${reservation.statut}).` });
        }

        const n = parseInt(req.body.note, 10);
        const noteOk = n >= 1 && n <= 5 ? n : null;

        await bon.update({
            valide: true, valideLe: new Date(), valideAutomatiquement: false, valideParAdmin: true,
            note: noteOk, commentaire: req.body.commentaire || null
        });
        await reservation.update({ statut: 'VALIDEE' });

        if (noteOk) {
            const f = await Fournisseur.findByPk(bon.fournisseurId);
            if (f) {
                const actuelle = parseFloat(f.note) || 0;
                const nb = parseInt(f.nombreAvis) || 0;
                await f.update({ note: parseFloat((((actuelle * nb) + noteOk) / (nb + 1)).toFixed(2)), nombreAvis: nb + 1 });
            }
        }
        return res.json({ success: true, data: bon, message: 'Prestation validée par l\'administration.' });
    } catch (err) {
        console.error('Erreur validerBonParAdmin:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── GET /api/bons-intervention/en-attente — Pour le job de validation auto ──
exports.getBonsEnAttenteValidation = async (req, res) => {
    try {
        const setting = await Setting.findOne({ where: { cle: 'bon_intervention.delai_validation_auto_heures' } });
        const delaiHeures = setting ? parseInt(setting.valeur, 10) : 24;

        const limite = new Date();
        limite.setHours(limite.getHours() - delaiHeures);

        const bons = await BonIntervention.findAll({
            where: {
                valide: false,
                createdAt: { [Op.lte]: limite }
            }
        });

        return res.json({ success: true, data: bons });
    } catch (err) {
        console.error('Erreur getBonsEnAttenteValidation:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

exports.getTauxCommission = getTauxCommission;