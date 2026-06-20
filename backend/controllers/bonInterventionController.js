const { BonIntervention, Reservation, Fournisseur } = require('../models');

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

        if (!reservationId || !descriptionTravail || !montantMainOeuvre) {
            return res.status(400).json({
                success: false,
                message: 'reservationId, descriptionTravail et montantMainOeuvre sont obligatoires.'
            });
        }

        const reservation = await Reservation.findByPk(reservationId);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        }

        // Récupère le profil fournisseur de l'utilisateur connecté
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) {
            return res.status(404).json({ success: false, message: 'Profil fournisseur introuvable.' });
        }

        // Vérifie qu'un bon n'existe pas déjà pour cette réservation
        const existant = await BonIntervention.findOne({ where: { reservationId } });
        if (existant) {
            return res.status(409).json({ success: false, message: 'Un bon d\'intervention existe déjà pour cette réservation.' });
        }

        const montantPieces = montantPiecesOutils ? parseFloat(montantPiecesOutils) : 0;
        const montantFinal = parseFloat(montantMainOeuvre) + montantPieces;

        // Calcul de la date limite de dépôt commission (48h après création du bon)
        const commissionDateLimite = new Date();
        commissionDateLimite.setHours(commissionDateLimite.getHours() + 48);

        const bon = await BonIntervention.create({
            reservationId,
            fournisseurId: fournisseur.id,
            descriptionTravail,
            montantMainOeuvre: parseFloat(montantMainOeuvre),
            piecesOutils: piecesOutils || null,
            montantPiecesOutils: montantPieces,
            montantFinal,
        });

        // Met à jour la réservation : statut terminé + date limite commission
        await reservation.update({
            statut: 'termine',
            commissionDateLimite
        });

        return res.status(201).json({ success: true, data: bon });

    } catch (err) {
        console.error('❌ Erreur creerBonIntervention:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
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

// ── PUT /api/bons-intervention/:id/valider — Le client valide ──
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

        // Met à jour la réservation en 'valide'
        await Reservation.update(
            { statut: 'valide' },
            { where: { id: bon.reservationId } }
        );

        // Si une note a été donnée, on met à jour la moyenne du prestataire
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