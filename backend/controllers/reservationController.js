const { Reservation, Fournisseur, Service, User } = require('../models');
const admin = require('../config/firebase-admin');

// ── POST /api/reservations ─────────────────────────────────
exports.createReservation = async (req, res) => {
    try {
        const { fournisseurId, serviceId, serviceNom } = req.body;
        const parcours = fournisseurId ? 'direct' : 'assignation';

        const reservation = await Reservation.create({
            ...req.body,
            parcours,
            statut: parcours === 'direct' ? 'assigne' : 'en_attente',
        });

        if (parcours === 'direct') {
            const fournisseur = await Fournisseur.findByPk(fournisseurId);
            if (fournisseur?.fcmToken) {
                admin.messaging().send({
                    notification: { title: '🔔 Nouvelle réservation directe', body: `Un client a réservé votre service : ${serviceNom || 'intervention'}` },
                    token: fournisseur.fcmToken
                }).catch(e => console.error('Erreur notif presta:', e.message));
            }
        } else if (serviceId) {
            admin.messaging().send({
                notification: { title: '🔔 Nouvelle demande Kanari', body: `Un client a besoin de : ${serviceNom || 'votre service'}` },
                topic: `service_${serviceId}`
            }).catch(e => console.error('Erreur Firebase topic:', e.message));
        }

        res.status(201).json({ success: true, data: reservation });
    } catch (error) {
        console.error('Erreur création réservation:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET /api/reservations/mes-reservations/:userId ─────────
exports.getMesReservations = async (req, res) => {
    try {
        const reservations = await Reservation.findAll({
            where: { clientId: req.params.userId },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, data: reservations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PUT /api/reservations/:id/statut — usage générique admin ──
exports.updateStatut = async (req, res) => {
    try {
        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation non trouvée' });
        reservation.statut = req.body.statut;
        await reservation.save();
        res.status(200).json({ success: true, data: reservation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PUT /api/reservations/:id/assigner — Admin assigne un presta ──
exports.assignerFournisseur = async (req, res) => {
    try {
        const { fournisseurId } = req.body;
        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation introuvable.' });

        await reservation.update({ fournisseurId, statut: 'assigne', refusePar: null, motifRefus: null });

        const fournisseur = await Fournisseur.findByPk(fournisseurId);
        if (fournisseur?.fcmToken) {
            admin.messaging().send({
                notification: { title: '🔔 Mission assignée par Kanari', body: `Une nouvelle mission vous a été assignée : ${reservation.serviceNom || 'intervention'}` },
                token: fournisseur.fcmToken
            }).catch(e => console.error('Erreur notif assignation:', e.message));
        }

        res.json({ success: true, data: reservation });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ── PUT /api/reservations/:id/presta-accepter — Presta accepte ──
exports.prestaAccepter = async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(404).json({ success: false, message: 'Profil fournisseur introuvable.' });

        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        if (reservation.fournisseurId !== fournisseur.id) return res.status(403).json({ success: false, message: 'Cette mission ne vous est pas assignée.' });

        await reservation.update({ statut: 'en_validation_admin' });
        res.json({ success: true, data: reservation, message: 'Acceptation transmise. En attente de validation Kanari.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ── PUT /api/reservations/:id/presta-refuser — Presta refuse ──
exports.prestaRefuser = async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(404).json({ success: false, message: 'Profil fournisseur introuvable.' });

        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        if (reservation.fournisseurId !== fournisseur.id) return res.status(403).json({ success: false, message: 'Cette mission ne vous est pas assignée.' });

        await reservation.update({
            statut: 'en_attente',
            fournisseurId: null,
            refusePar: fournisseur.id,
            motifRefus: req.body.motif || null,
        });
        res.json({ success: true, data: reservation, message: 'Mission refusée. Kanari va réassigner.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ── PUT /api/reservations/:id/autoriser — Admin valide après acceptation presta ──
exports.autoriserDemarrage = async (req, res) => {
    try {
        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation introuvable.' });

        await reservation.update({ statut: 'accepte' });

        const fournisseur = await Fournisseur.findByPk(reservation.fournisseurId);
        if (fournisseur?.fcmToken) {
            admin.messaging().send({
                notification: { title: '✅ Mission validée par Kanari', body: 'Vous pouvez démarrer l\'intervention.' },
                token: fournisseur.fcmToken
            }).catch(e => console.error('Erreur notif autorisation:', e.message));
        }

        res.json({ success: true, data: reservation, message: 'Démarrage autorisé.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ── GET /api/reservations/disponibles ──
exports.getReservationsDisponibles = async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(404).json({ success: false, message: 'Profil fournisseur introuvable.' });

        const reservations = await Reservation.findAll({
            where: { fournisseurId: fournisseur.id },
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: reservations });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ── POST /api/reservations/admin-creer ──
exports.adminCreerReservation = async (req, res) => {
    try {
        const { besoin, adresse, telephone, clientNom, serviceId, serviceNom, fournisseurId, type, dateIntervention } = req.body;

        if (!besoin || !adresse || !telephone || !serviceId) {
            return res.status(400).json({ success: false, message: 'Besoin, adresse, téléphone et service sont obligatoires.' });
        }

        const reservation = await Reservation.create({
            besoin, adresse, telephone, clientNom,
            serviceId, serviceNom,
            fournisseurId: fournisseurId || null,
            type: type || 'classique',
            dateIntervention: dateIntervention || null,
            parcours: fournisseurId ? 'direct' : 'assignation',
            statut: fournisseurId ? 'assigne' : 'en_attente',
        });

        if (fournisseurId) {
            const fournisseur = await Fournisseur.findByPk(fournisseurId);
            if (fournisseur?.fcmToken) {
                admin.messaging().send({
                    notification: { title: '🔔 Mission créée par Kanari', body: `Nouvelle mission : ${serviceNom || 'intervention'}` },
                    token: fournisseur.fcmToken
                }).catch(e => console.error('Erreur notif:', e.message));
            }
        }

        res.status(201).json({ success: true, data: reservation });
    } catch (error) {
        console.error('Erreur création admin réservation:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET /api/admin/reservations ──
exports.getAdminReservations = async (req, res) => {
    try {
        const reservations = await Reservation.findAll({
            include: [
                { model: Fournisseur, as: 'prestataire', attributes: ['id', 'nomEntreprise', 'telephone', 'note'] },
                { model: Service, as: 'service', attributes: ['id', 'nom', 'emoji'] },
                { model: User, as: 'client', attributes: ['id', 'nom', 'telephone', 'email'] },
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: reservations });
    } catch (error) {
        console.error('Erreur getAdminReservations:', error.message);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ── DELETE /api/reservations/:id ────────────────────────────
exports.deleteReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        await reservation.destroy();
        res.json({ success: true, message: 'Réservation supprimée.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ── NOUVEAU : POST /api/reservations/:id/terminer ────────
exports.terminerMission = async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) {
            return res.status(404).json({ success: false, message: 'Profil fournisseur introuvable.' });
        }

        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        }
        
        if (reservation.fournisseurId !== fournisseur.id) {
            return res.status(403).json({ success: false, message: 'Action non autorisée.' });
        }

        const { descriptionTravail, montantMainOeuvre, piecesFournies } = req.body;
        
        await reservation.update({
            descriptionTravail,
            montantMainOeuvre,
            piecesFournies,
            statut: 'termine'
        });

        res.status(200).json({ 
            success: true, 
            message: 'Bon d\'intervention enregistré avec succès.', 
            data: reservation 
        });
    } catch (error) {
        console.error('Erreur terminaison mission:', error.message);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};