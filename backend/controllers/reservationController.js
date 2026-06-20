const { Reservation, Fournisseur } = require('../models');
const admin = require('../config/firebase-admin');

// ── POST /api/reservations ─────────────────────────────────
exports.createReservation = async (req, res) => {
    try {
        const { fournisseurId, serviceId, serviceNom } = req.body;

        // Détermine le parcours selon la présence d'un fournisseurId
        const parcours = fournisseurId ? 'direct' : 'assignation';

        const reservation = await Reservation.create({
            ...req.body,
            parcours,
            statut: parcours === 'direct' ? 'assigne' : 'en_attente',
        });

        // ── Notification ────────────────────────────────
        if (parcours === 'direct') {
            // Parcours 2 : notifie uniquement le prestataire choisi
            const fournisseur = await Fournisseur.findByPk(fournisseurId);
            if (fournisseur?.fcmToken) {
                const message = {
                    notification: {
                        title: '🔔 Nouvelle réservation directe',
                        body: `Un client a réservé votre service : ${serviceNom || 'intervention'}`
                    },
                    token: fournisseur.fcmToken
                };
                admin.messaging().send(message)
                    .then(r => console.log('Notif presta envoyée:', r))
                    .catch(e => console.error('Erreur notif presta:', e.message));
            }
        } else if (serviceId) {
            // Parcours 1 : notifie tous les prestas abonnés au topic du service
            const message = {
                notification: {
                    title: '🔔 Nouvelle demande Kanari',
                    body: `Un client a besoin de : ${serviceNom || 'votre service'}`
                },
                topic: `service_${serviceId}`
            };
            admin.messaging().send(message)
                .then(r => console.log('Notification topic envoyée:', r))
                .catch(e => console.error('Erreur Firebase topic:', e.message));
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
        console.error('Erreur lors du GET:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PUT /api/reservations/:id/statut ────────────────────────
exports.updateStatut = async (req, res) => {
    try {
        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Réservation non trouvée' });
        }
        reservation.statut = req.body.statut;
        await reservation.save();
        res.status(200).json({ success: true, data: reservation });
    } catch (error) {
        console.error('Erreur lors du PUT:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PUT /api/reservations/:id/assigner — Admin assigne un presta ──
exports.assignerFournisseur = async (req, res) => {
    try {
        const { fournisseurId } = req.body;
        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        }

        await reservation.update({ fournisseurId, statut: 'assigne' });

        const fournisseur = await Fournisseur.findByPk(fournisseurId);
        if (fournisseur?.fcmToken) {
            const message = {
                notification: {
                    title: '🔔 Mission assignée par Kanari',
                    body: `Une nouvelle mission vous a été assignée : ${reservation.serviceNom || 'intervention'}`
                },
                token: fournisseur.fcmToken
            };
            admin.messaging().send(message)
                .then(r => console.log('Notif assignation envoyée:', r))
                .catch(e => console.error('Erreur notif assignation:', e.message));
        }

        res.json({ success: true, data: reservation });
    } catch (error) {
        console.error('Erreur assignation:', error.message);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ── GET /api/reservations/disponibles — Admin voit les non assignées ──
exports.getReservationsDisponibles = async (req, res) => {
    try {
        const reservations = await Reservation.findAll({
            where: { statut: 'en_attente', parcours: 'assignation' },
            order: [['createdAt', 'ASC']]
        });
        res.json({ success: true, data: reservations });
    } catch (error) {
        console.error('Erreur récupération réservations disponibles:', error.message);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};