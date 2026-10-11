const { Op } = require('sequelize');
const { Abonnement, AbonnementPrestataire, Reservation, Fournisseur } = require('../models');
const { sendPushNotification } = require('../utils/firebaseNotifier');
const { sendNotification } = require('../utils/notifications');

const JOURS_AVANCE = 3;

const toISO = (d) => d.toISOString().slice(0, 10);
const aujourdhui = () => toISO(new Date());
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return toISO(d); };
const addMonths = (iso, n) => {
    const d = new Date(iso + 'T00:00:00Z');
    const jour = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + n);
    const dernier = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(jour, dernier));
    return toISO(d);
};
const suivante = (iso, frequence) => {
    if (frequence === 'quinzaine') return addDays(iso, 14);
    if (frequence === 'mensuel') return addMonths(iso, 1);
    return addDays(iso, 7);
};
// Avance une date jusqu'à aujourd'hui (utile à la reprise après pause)
const rattraper = (iso, frequence) => {
    let d = iso || aujourdhui(), g = 0;
    while (d < aujourdhui() && g < 60) { d = suivante(d, frequence); g++; }
    return d;
};

async function runCreerVisitesAbonnements() {
    const limite = addDays(aujourdhui(), JOURS_AVANCE);
    const plancher = addDays(aujourdhui(), -3); // rattrape un job arrêté, sans créer de visites très anciennes
    let creees = 0;

    const abos = await Abonnement.findAll({
        where: { statut: 'ACTIF', prochaineVisite: { [Op.lte]: limite } }
    });

    for (const abo of abos) {
        try {
            const presta = await AbonnementPrestataire.findAll({
                where: { abonnementId: abo.id, actif: true }, order: [['id', 'ASC']]
            });
            let date = abo.prochaineVisite;
            let garde = 0;

            while (date <= limite && garde < 10) {
                if (date >= plancher) {
                    // Idempotence : jamais deux visites à la même date pour le même abonnement
                    const existe = await Reservation.findOne({ where: { abonnementId: abo.id, dateIntervention: date } });
                    if (!existe) {
                        const nb = await Reservation.count({ where: { abonnementId: abo.id } });
                        const choisi = presta.length ? presta[nb % presta.length].fournisseurId : null;

                        const visite = await Reservation.create({
                            besoin: `Visite d'abonnement — ${abo.serviceNom || 'Service'}`,
                            adresse: abo.adresse,
                            telephone: abo.telephone,
                            clientNom: abo.clientNom,
                            dateIntervention: date,
                            heureIntervention: abo.heure,
                            type: 'contrat',
                            parcours: choisi ? 'direct' : 'assignation',
                            statut: choisi ? 'ASSIGNEE' : 'EN_ATTENTE',
                            modePaiement: 'aucun',
                            montantTotal: 0,
                            clientId: abo.clientId,
                            fournisseurId: choisi,
                            fournisseurPrevuId: choisi,
                            serviceId: abo.serviceId,
                            serviceNom: abo.serviceNom,
                            abonnementId: abo.id
                        });
                        creees++;

                        try {
                            if (abo.clientId) {
                                await sendPushNotification({
                                    userId: abo.clientId,
                                    title: 'Visite d\'abonnement programmée',
                                    body: `Votre prochaine visite (${abo.serviceNom || 'service'}) est prévue le ${date}.`,
                                    data: { type: 'ABONNEMENT_VISITE', reservationId: String(visite.id) }
                                });
                            }
                            if (choisi) {
                                const f = await Fournisseur.findByPk(choisi);
                                if (f?.fcmToken) {
                                    await sendNotification({
                                        token: f.fcmToken,
                                        title: 'Visite d\'abonnement',
                                        body: `${abo.serviceNom || 'Service'} le ${date} — ${abo.adresse}`,
                                        data: { type: 'RESERVATION', reservationId: String(visite.id) }
                                    });
                                }
                            }
                        } catch (e) { console.warn('[abonnements] notification non envoyée :', e.message); }
                    }
                }
                date = suivante(date, abo.frequence);
                garde++;
            }
            await abo.update({ prochaineVisite: date });
        } catch (err) {
            console.error(`[abonnements] Erreur sur l'abonnement #${abo.id} :`, err.message);
        }
    }
    if (creees > 0) console.log(`[abonnements] ${creees} visite(s) créée(s).`);
    return { creees };
}

module.exports = { runCreerVisitesAbonnements, suivante, rattraper, aujourdhui };