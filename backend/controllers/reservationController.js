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
        const {
            clientNom,
            telephone,
            adresse,
            dateIntervention,
            modePaiement,
            fournisseurId,
            services
        } = req.body;

        if (!clientNom || !telephone || !adresse || !services || !Array.isArray(services) || services.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Informations obligatoires manquantes dans la requête.'
            });
        }

        const parsedFournisseurId = fournisseurId ? parseInt(fournisseurId, 10) : null;
        const reservationsCreees = [];

        for (const srv of services) {
            const typeFormulaire = srv.typeFormulaire === 'candidature' ? 'candidature' : 'classique';
            const estCandidature = typeFormulaire === 'candidature';

            const fournisseurAssigne = estCandidature ? null : parsedFournisseurId;
            const statutInitial = fournisseurAssigne ? 'ASSIGNEE' : 'EN_ATTENTE';

            const reservation = await Reservation.create({
                clientNom,
                telephone,
                adresse,
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
                besoin: formaterBesoin(srv.detailsParticuliers),
                services: srv.detailsParticuliers || {}
            }, { transaction });

            reservationsCreees.push(reservation);
        }

        await transaction.commit();

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
        await transaction.rollback();
        console.error('Erreur critique createGlobalReservation :', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur lors de la création de la réservation.'
        });
    }
};

// ── GET /api/reservations/mes-reservations — Espace Client ─────
//
// ✅ CORRIGÉ : deux alias inventés faisaient planter cette route à CHAQUE
// appel :
//   - { model: Fournisseur, as: 'fournisseur' } → l'alias réel défini
//     dans models/index.js est 'prestataire', pas 'fournisseur'.
//   - { model: BonIntervention, as: 'BonIntervention' } → cet alias
//     n'existe pas du tout (seul 'bonIntervention', minuscule, existe).
//     Le "double include" pensé comme protection contre une erreur de
//     casse causait en réalité une EagerLoadingError garantie.
// Conservé : la recherche par téléphone en plus de clientId, utile si
// une réservation a été créée sans utilisateur connecté au départ.
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