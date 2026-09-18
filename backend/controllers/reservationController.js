const { sequelize, Reservation, Fournisseur, BonIntervention } = require('../models');
const { sendNotification } = require('../utils/notifications');
const { Op } = require('sequelize');

function formaterBesoin(detailsParticuliers = {}) {
    const lignes = Object.entries(detailsParticuliers)
        .filter(([, valeur]) => valeur !== undefined && valeur !== null && valeur !== '')
        .map(([cle, valeur]) => `${cle} : ${valeur}`);
    return lignes.join('\n') || null;
}

// ── POST /api/reservations/global (et /api/reservations) ───────
exports.createGlobalReservation = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        // Analyse du FormData : si req.body.donneesReservation existe, on le parse, sinon on prend req.body directement
        let donneesVoyageantes = req.body;
        if (req.body && req.body.donneesReservation) {
            try {
                donneesVoyageantes = JSON.parse(req.body.donneesReservation);
            } catch (e) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Format de données JSON invalide dans donneesReservation.'
                });
            }
        }

        const {
            clientNom,
            telephone,
            adresse,
            coordonneesGps,
            dateIntervention,
            modePaiement,
            fournisseurId,
            services
        } = donneesVoyageantes;

        // Règle de validation alignée sur le front : Seul le téléphone et les services sont obligatoires
        if (!telephone || !services || !Array.isArray(services) || services.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Le numéro de téléphone et au moins un service sont obligatoires.'
            });
        }

        const parsedFournisseurId = fournisseurId ? parseInt(fournisseurId, 10) : null;
        const reservationsCreees = [];

        // Les fichiers reçus via le middleware Multer (photos, documents et vocaux)
        const fichiersRecus = req.files || [];

        for (const srv of services) {
            const typeFormulaire = srv.typeFormulaire === 'candidature' ? 'candidature' : 'classique';
            const estCandidature = typeFormulaire === 'candidature';

            const fournisseurAssigne = estCandidature ? null : parsedFournisseurId;
            const statutInitial = fournisseurAssigne ? 'ASSIGNEE' : 'EN_ATTENTE';

            // Filtrer les fichiers spécifiques à ce service via son safeId
            const photosService = fichiersRecus
                .filter(f => f.fieldname === `photo_${srv.safeId}`)
                .map(f => f.path || f.filename);

            const documentsService = fichiersRecus
                .filter(f => f.fieldname === `document_${srv.safeId}`)
                .map(f => f.path || f.filename);

            const vocalService = fichiersRecus.find(f => f.fieldname === `vocal_${srv.safeId}`);
            const vocalUrl = vocalService ? (vocalService.path || vocalService.filename) : null;

            // Regroupement des détails du besoin pour ce service
            const detailsComplets = {
                description: srv.description || '',
                photos: photosService,
                documents: documentsService,
                vocal: vocalUrl,
                ...(srv.detailsParticuliers || {})
            };

            const reservation = await Reservation.create({
                clientNom: clientNom || 'Client Kanari',
                telephone: telephone.trim(),
                adresse: adresse || 'Non renseignée',
                coordonneesGps: coordonneesGps ? JSON.stringify(coordonneesGps) : null,
                dateIntervention: dateIntervention ? new Date(dateIntervention) : new Date(),
                modePaiement: estCandidature ? 'aucun' : (modePaiement || 'depot_kanari'),
                montantTotal: estCandidature ? 0 : Number(srv.prix || srv.tarif || 0),
                statut: statutInitial,
                type: typeFormulaire,
                parcours: fournisseurAssigne ? 'direct' : 'assignation',
                clientId: req.user ? req.user.id : null,
                fournisseurId: fournisseurAssigne,
                serviceId: srv.serviceId || null,
                serviceNom: srv.nom || 'Service',
                besoin: srv.description || formaterBesoin(srv.detailsParticuliers),
                services: detailsComplets
            }, { transaction });

            reservationsCreees.push(reservation);
        }

        await transaction.commit();

        // Envoi des notifications de manière asynchrone
        for (const reservation of reservationsCreees) {
            try {
                if (reservation.fournisseurId) {
                    const fournisseur = await Fournisseur.findByPk(reservation.fournisseurId);
                    if (fournisseur?.fcmToken) {
                        await sendNotification({
                            token: fournisseur.fcmToken,
                            title: 'Nouvelle mission Kanari',
                            body: `${reservation.serviceNom} — ${reservation.clientNom} — ${reservation.adresse}`,
                            data: { type: 'RESERVATION', reservationId: String(reservation.id) }
                        });
                    }
                } else if (reservation.serviceId) {
                    await sendNotification({
                        topic: `service_${reservation.serviceId}`,
                        title: 'Nouvelle demande',
                        body: `${reservation.serviceNom} à ${reservation.adresse}`,
                        data: { type: 'DEMANDE_GENERALE', reservationId: String(reservation.id) }
                    });
                }
            } catch (notifErr) {
                console.error(`Notification non envoyée pour la réservation #${reservation.id} :`, notifErr.message);
            }
        }

        const montantTotalAPayer = reservationsCreees
            .filter(r => r.type !== 'candidature')
            .reduce((acc, r) => acc + Number(r.montantTotal || 0), 0);

        return res.status(201).json({
            success: true,
            id: reservationsCreees[0].id,
            ids: reservationsCreees.map(r => r.id),
            montantTotal: montantTotalAPayer,
            message: `${reservationsCreees.length} demande(s) enregistrée(s) avec succès.`
        });

    } catch (error) {
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }
        console.error('Erreur critique createGlobalReservation :', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur lors de la création de la réservation.'
        });
    }
};

// ── GET /api/reservations/mes-reservations — Espace Client ─────
exports.getMesReservations = async (req, res) => {
    try {
        const conditions = [{ clientId: req.user.id }];
        if (req.user.telephone) {
            conditions.push({ telephone: req.user.telephone });
        }

        const reservations = await Reservation.findAll({
            where: { [Op.or]: conditions },
            include: [
                { model: Fournisseur, as: 'prestataire', attributes: ['id', 'nomEntreprise', 'telephone', 'note'] },
                { model: BonIntervention, as: 'bonIntervention' }
            ],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({ success: true, data: reservations });
    } catch (error) {
        console.error('Erreur getMesReservations :', error);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── GET /api/reservations/disponibles — Espace Prestataire ─────
exports.getReservationsDisponibles = async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) {
            return res.status(403).json({ success: false, message: 'Profil fournisseur introuvable.' });
        }

        const reservations = await Reservation.findAll({
            where: {
                statut: 'EN_ATTENTE',
                fournisseurId: null,
                serviceId: fournisseur.serviceId
            },
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({ success: true, data: reservations });
    } catch (error) {
        console.error('Erreur getReservationsDisponibles :', error);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};