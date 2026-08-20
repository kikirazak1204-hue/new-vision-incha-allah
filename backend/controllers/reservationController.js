const admin = require('../config/firebase-admin');
const { sendAdminNotificationEmail } = require('../services/notificationService');
const { ADMIN_EMAIL } = require('../config/admin');

// Helper pour charger les modèles dynamiquement et éviter les références circulaires
const getModels = () => require('../models');

// Normalisation des statuts de réservation
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

// ── POST /api/reservations (Réservation simple) ──────────────
exports.createReservation = async (req, res) => {
    try {
        const { Reservation, Fournisseur } = getModels();
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
            statutPaiement: 'non_paye', // 💡 Statut de paiement initial
            clientId: req.user?.id || req.body.clientId || null
        });

        // Notifications
        if (parcours === 'direct' && fournisseurId) {
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
            sendAdminNotificationEmail(ADMIN_EMAIL, reservation).catch(() => null);
        }

        res.status(201).json({ success: true, data: reservation });
    } catch (error) {
        console.error('Erreur createReservation:', error.message);
        res.status(500).json({ success: false, message: 'Erreur lors de la création de la réservation.' });
    }
};

// ── POST /api/reservations/global (Réservation Multi-services) ─
exports.createGlobalReservation = async (req, res) => {
    const { Reservation, ReservationItem, sequelize } = getModels();
    const t = await sequelize.transaction();

    try {
        const { 
            clientNom, 
            telephone, 
            adresse, 
            dateIntervention, 
            heureIntervention,
            modePaiement, 
            commentaireGlobal, 
            fournisseurId, 
            montantTotal, 
            services 
        } = req.body;

        const clientId = req.user?.id || null;

        const reservation = await Reservation.create({
            clientNom: clientNom || req.user?.nom || 'Client',
            telephone,
            adresse,
            dateIntervention,
            heureIntervention: heureIntervention || null,
            modePaiement: modePaiement || 'mobile_money',
            commentaireGlobal: commentaireGlobal || null,
            fournisseurId: fournisseurId || null,
            montantTotal: parseFloat(montantTotal) || 0,
            parcours: fournisseurId ? 'direct' : 'assignation',
            statut: fournisseurId ? 'ASSIGNEE' : 'EN_ATTENTE',
            statutPaiement: 'non_paye', // 💡 Par défaut non payé
            clientId
        }, { transaction: t });

        if (Array.isArray(services) && services.length > 0) {
            const items = services.map(srv => ({
                reservationId: reservation.id,
                serviceId: String(srv.serviceId || srv.id),
                nom: srv.nom || srv.titre,
                prix: parseFloat(srv.prix) || 0,
                detailsParticuliers: srv.detailsParticuliers || srv.reponsesQuestionnaire || null
            }));
            await ReservationItem.bulkCreate(items, { transaction: t });
        }

        await t.commit();

        // Notifications (après commit)
        const nomDesServices = services?.map(s => s.nom || s.titre).join(', ') || 'Service(s)';

        if (fournisseurId) {
            const { Fournisseur } = getModels();
            const fournisseur = await Fournisseur.findByPk(fournisseurId);
            if (fournisseur?.fcmToken) {
                sendNotification({
                    token: fournisseur.fcmToken,
                    title: '🔔 Nouvelle demande multi-services',
                    body: `Un client a réservé : ${nomDesServices}`,
                    data: { categorie: 'Réservation', reservationId: String(reservation.id) }
                });
            }
        }

        if (ADMIN_EMAIL) {
            sendAdminNotificationEmail(ADMIN_EMAIL, reservation).catch(() => null);
        }

        return res.status(201).json({ 
            success: true, 
            id: reservation.id, 
            data: reservation,
            message: 'Dossier de réservation créé avec succès.' 
        });

    } catch (error) {
        await t.rollback();
        console.error('Erreur createGlobalReservation:', error.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la création de la réservation.' });
    }
};

// ── GET /api/reservations/mes-reservations ─────────────────
exports.getMesReservations = async (req, res) => {
    try {
        const { Reservation, ReservationItem } = getModels();
        const clientId = req.user?.id || req.params.userId;

        if (!clientId) {
            return res.status(401).json({ success: false, message: 'Utilisateur non identifié.' });
        }

        const reservations = await Reservation.findAll({
            where: { clientId },
            include: [
                { model: ReservationItem, as: 'items', required: false }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ success: true, data: reservations });
    } catch (error) {
        console.error('Erreur getMesReservations:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PUT /api/reservations/:id/statut ───────────────────────
exports.updateStatut = async (req, res) => {
    try {
        const { Reservation } = getModels();
        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation non trouvée' });

        const statut = normalizeReservationStatut(req.body.statut);
        if (!statut) return res.status(400).json({ success: false, message: 'Statut invalide.' });

        await reservation.update({ statut });
        res.status(200).json({ success: true, data: reservation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PUT /api/reservations/:id/assigner ─────────────────────
exports.assignerFournisseur = async (req, res) => {
    try {
        const { Reservation, Fournisseur } = getModels();
        const { fournisseurId } = req.body;

        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation introuvable.' });

        const pId = parseInt(fournisseurId, 10);
        if (isNaN(pId) || pId <= 0) return res.status(400).json({ success: false, message: 'ID prestataire invalide.' });

        const fournisseur = await Fournisseur.findByPk(pId);
        if (!fournisseur) return res.status(404).json({ success: false, message: 'Prestataire introuvable.' });

        await reservation.update({
            fournisseurId: pId,
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
        console.error('Erreur assignerFournisseur:', error.message);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};