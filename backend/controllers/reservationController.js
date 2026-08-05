const { Reservation, Fournisseur, Service, User } = require('../models');
const admin = require('../config/firebase-admin');
const { sendAdminNotificationEmail } = require('../services/notificationService');
const { ADMIN_EMAIL } = require('../config/admin');

const normalizeReservationStatut = (statut) => {
    if (typeof statut !== 'string') return null;
    const cleaned = statut
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^A-Z_]/g, '');

    const map = {
        EN_ATTENTE: 'EN_ATTENTE',
        ASSIGNEE: 'ASSIGNEE',
        EN_VALIDATION_ADMIN: 'EN_VALIDATION_ADMIN',
        EN_ATTENTE_VALIDATION: 'EN_VALIDATION_ADMIN',
        ACCEPTEE: 'ACCEPTEE',
        EN_PREPARATION: 'EN_PREPARATION',
        EN_COURS: 'EN_COURS',
        VALIDEE: 'VALIDEE',
        TERMINEE: 'TERMINEE',
        TERMINE: 'TERMINEE',
        ANNULEE: 'ANNULEE',
        ANNULE: 'ANNULEE'
    };

    return map[cleaned] || null;
};

// ── Helper Firebase Notification ────────────────────────────
const sendNotification = async ({ token, topic, title, body, data }) => {
    try {
        const payload = {
            notification: { title, body },
            ...(data && { data }),
            ...(token ? { token } : { topic })
        };
        await admin.messaging().send(payload);
    } catch (error) {
        console.error(`[FCM Error] ${title}:`, error.message);
    }
};

// ── POST /api/reservations ─────────────────────────────────
exports.createReservation = async (req, res) => {
    try {
        const { fournisseurId, serviceId, serviceNom } = req.body;
        const parcours = fournisseurId ? 'direct' : 'assignation';

        const statutFromBody = normalizeReservationStatut(req.body.statut);
        if (req.body.statut && !statutFromBody) {
            return res.status(400).json({ success: false, message: 'Statut de réservation invalide.' });
        }

        const statut = statutFromBody || (fournisseurId ? 'ASSIGNEE' : 'EN_ATTENTE');

        const reservation = await Reservation.create({
            ...req.body,
            parcours,
            statut,
        });

        if (parcours === 'direct') {
            const fournisseur = await Fournisseur.findByPk(fournisseurId);
            if (fournisseur?.fcmToken) {
                sendNotification({
                    token: fournisseur.fcmToken,
                    title: '🔔 Nouvelle réservation directe',
                    body: `Un client a réservé votre service : ${serviceNom || 'intervention'}`,
                    data: {
                        categorie: 'Réservation',
                        reservationId: String(reservation.id),
                        serviceNom: String(serviceNom || 'intervention')
                    }
                });
            }
        } else if (serviceId) {
            sendNotification({
                topic: `service_${serviceId}`,
                title: '🔔 Nouvelle demande Kanari',
                body: `Un client a besoin de : ${serviceNom || 'votre service'}`,
                data: {
                    categorie: 'Demande',
                    reservationId: String(reservation.id),
                    serviceNom: String(serviceNom || 'votre service')
                }
            });
        }

        if (ADMIN_EMAIL) {
            sendAdminNotificationEmail(ADMIN_EMAIL, reservation)
                .catch(() => null);
        }

        res.status(201).json({ success: true, data: reservation });
    } catch (error) {
        console.error('Erreur création réservation:', error.stack);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET /api/reservations/mes-reservations ─────────────────
exports.getMesReservations = async (req, res) => {
    try {
        const clientId = req.user?.id || req.params.userId;

        const reservations = await Reservation.findAll({
            where: { clientId },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, data: reservations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PUT /api/reservations/:id/statut — Admin générique ──────
exports.updateStatut = async (req, res) => {
    try {
        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation non trouvée' });

        const statut = normalizeReservationStatut(req.body.statut);
        if (!statut) return res.status(400).json({ success: false, message: 'Statut invalide.' });

        reservation.statut = statut;
        await reservation.save();
        res.status(200).json({ success: true, data: reservation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PUT /api/reservations/:id/assigner — Admin assigne ─────
exports.assignerFournisseur = async (req, res) => {
    try {
        const { fournisseurId } = req.body;
        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation introuvable.' });

        if (fournisseurId === undefined || fournisseurId === null || fournisseurId === '') {
            return res.status(400).json({ success: false, message: 'Identifiant du prestataire requis.' });
        }

        const parsedFournisseurId = parseInt(fournisseurId, 10);
        if (Number.isNaN(parsedFournisseurId) || parsedFournisseurId <= 0) {
            return res.status(400).json({ success: false, message: 'Identifiant de prestataire invalide.' });
        }

        const fournisseur = await Fournisseur.findByPk(parsedFournisseurId);
        if (!fournisseur) {
            return res.status(404).json({ success: false, message: 'Prestataire introuvable.' });
        }

        // ✅ Standardisation : la mission est désormais clairement assignée
        await reservation.update({
            fournisseurId: parsedFournisseurId,
            statut: 'ASSIGNEE',
            refusePar: null,
            motifRefus: null
        });

        if (fournisseur.fcmToken) {
            sendNotification({
                token: fournisseur.fcmToken,
                title: '🔔 Mission assignée par Kanari',
                body: `Une nouvelle mission vous a été assignée : ${reservation.serviceNom || 'intervention'}`,
                data: {
                    categorie: 'Mission',
                    reservationId: String(reservation.id),
                    serviceNom: String(reservation.serviceNom || 'intervention')
                }
            });
        }

        res.json({ success: true, data: reservation });
    } catch (error) {
        console.error('Erreur assignerFournisseur:', error.stack);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ── PUT /api/reservations/:id/presta-accepter ─────────────
exports.prestaAccepter = async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(404).json({ success: false, message: 'Profil fournisseur introuvable.' });

        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        if (reservation.fournisseurId !== fournisseur.id) return res.status(403).json({ success: false, message: 'Cette mission ne vous est pas assignée.' });

        await reservation.update({ statut: 'EN_VALIDATION_ADMIN' });
        res.json({ success: true, data: reservation, message: 'Acceptation transmise. En attente de validation Kanari.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ── PUT /api/reservations/:id/presta-refuser ──────────────
exports.prestaRefuser = async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(404).json({ success: false, message: 'Profil fournisseur introuvable.' });

        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        if (reservation.fournisseurId !== fournisseur.id) return res.status(403).json({ success: false, message: 'Cette mission ne vous est pas assignée.' });

        await reservation.update({
            statut: 'EN_ATTENTE',
            fournisseurId: null,
            refusePar: fournisseur.id,
            motifRefus: req.body.motif || null,
        });
        res.json({ success: true, data: reservation, message: 'Mission refusée. Kanari va réassigner.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ── PUT /api/reservations/:id/autoriser ────────────────────
exports.autoriserDemarrage = async (req, res) => {
    try {
        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation introuvable.' });

        await reservation.update({ statut: 'ACCEPTEE' });

        const fournisseur = await Fournisseur.findByPk(reservation.fournisseurId);
        if (fournisseur?.fcmToken) {
            sendNotification({
                token: fournisseur.fcmToken,
                title: '✅ Mission validée par Kanari',
                body: 'Vous pouvez démarrer l\'intervention.',
                data: {
                    categorie: 'Validation',
                    reservationId: String(reservation.id),
                    serviceNom: String(reservation.serviceNom || 'intervention')
                }
            });
        }

        res.json({ success: true, data: reservation, message: 'Démarrage autorisé.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ── GET /api/reservations/disponibles ──────────────────────
exports.getReservationsDisponibles = async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(404).json({ success: false, message: 'Profil fournisseur introuvable.' });

        const where = { fournisseurId: null, statut: 'EN_ATTENTE' };
        if (fournisseur.serviceId) where.serviceId = fournisseur.serviceId;

        const reservations = await Reservation.findAll({
            where,
            include: [
                { model: Service, as: 'service', attributes: ['id', 'nom', 'emoji'] },
                { model: User, as: 'client', attributes: ['id', 'nom', 'telephone'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: reservations });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ── POST /api/reservations/admin-creer ─────────────────────
exports.adminCreerReservation = async (req, res) => {
    try {
        const { besoin, adresse, telephone, clientNom, serviceId, serviceNom, fournisseurId, type, dateIntervention } = req.body;

        if (!besoin || !adresse || !telephone || !serviceId) {
            return res.status(400).json({ success: false, message: 'Besoin, adresse, téléphone et service sont obligatoires.' });
        }

        // ✅ CORRIGÉ : 'ASSIGNEE' → 'EN_ATTENTE' (même avec un fournisseurId déjà précisé,
        // il doit encore accepter la mission — cohérent avec le reste du flux)
        const reservation = await Reservation.create({
            besoin, adresse, telephone, clientNom,
            serviceId, serviceNom,
            fournisseurId: fournisseurId || null,
            type: type || 'classique',
            dateIntervention: dateIntervention || null,
            parcours: fournisseurId ? 'direct' : 'assignation',
            statut: fournisseurId ? 'ASSIGNEE' : 'EN_ATTENTE',
        });

        if (fournisseurId) {
            const fournisseur = await Fournisseur.findByPk(fournisseurId);
            if (fournisseur?.fcmToken) {
                sendNotification({
                    token: fournisseur.fcmToken,
                    title: '🔔 Mission créée par Kanari',
                    body: `Nouvelle mission : ${serviceNom || 'intervention'}`,
                    data: {
                        categorie: 'Mission',
                        reservationId: String(reservation.id),
                        serviceNom: String(serviceNom || 'intervention')
                    }
                });
            }
        }

        if (ADMIN_EMAIL) {
            sendAdminNotificationEmail(ADMIN_EMAIL, reservation)
                .catch(() => null);
        }

        res.status(201).json({ success: true, data: reservation });
    } catch (error) {
        console.error('Erreur création admin réservation:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET /api/admin/reservations ────────────────────────────
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

// ── POST /api/reservations/:id/terminer ───────────────────
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
            statut: 'TERMINEE'
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