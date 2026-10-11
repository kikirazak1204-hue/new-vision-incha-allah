const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { protect, adminOnly } = require('../middleware/auth');
const {
    sequelize, User, Fournisseur, Reservation,
    Abonnement, AbonnementPrestataire, AbonnementVersement, AbonnementReglement
} = require('../models');
const { sendPushNotification } = require('../utils/firebaseNotifier');
const { sendNotification } = require('../utils/notifications');
const { rattraper, aujourdhui } = require('../jobs/creerVisitesAbonnements');

const TAUX_COMMISSION_ABONNEMENT = 5; // non modifiable
const FREQUENCES = ['hebdomadaire', 'quinzaine', 'mensuel'];
const MODES_FACTURATION = ['mois', 'semaine', 'visite'];
const MODES_PAIEMENT = ['mobile_money', 'nita', 'amanata', 'especes', 'autre'];
const STATUTS = ['EN_ETUDE', 'PROPOSE', 'ACTIF', 'EN_PAUSE', 'RESILIE', 'REFUSE'];
const RE_DATE = /^\d{4}-\d{2}-\d{2}$/;

const num = (v) => Number(v || 0);
const arrondi = (n) => Math.round(n * 100) / 100;
const fcfa = (n) => `${num(n).toLocaleString('fr-FR')} FCFA`;

const finance = (abo) => {
    const versements = abo.versements || [];
    const paye = versements.reduce((a, v) => a + num(v.montant), 0);
    const total = num(abo.montantTotalDu);
    const acompte = abo.acompteDemande != null ? num(abo.acompteDemande) : arrondi(total * 0.5);
    return { total, paye, reste: Math.max(arrondi(total - paye), 0), acompteDemande: acompte, acompteRegle: acompte > 0 && paye >= acompte };
};
const avecFinance = (abo) => ({ ...abo.toJSON(), finance: finance(abo) });

async function pushClient(userId, title, body, data = {}) {
    if (!userId) return;
    try { await sendPushNotification({ userId, title, body, data }); }
    catch (e) { console.warn('[abonnements] push client non envoyé :', e.message); }
}
async function alerteAdmin(title, body, data = {}) {
    try { await sendNotification({ topic: 'admin_abonnements', title, body, data }); }
    catch (e) { console.warn('[abonnements] alerte admin non envoyée :', e.message); }
}

// ════════════════════════════════════════════════════════════
// ROUTES ADMIN  (définies en premier)
// ════════════════════════════════════════════════════════════

// GET /api/abonnements/admin/liste?statut=
router.get('/admin/liste', protect, adminOnly, async (req, res) => {
    try {
        const where = req.query.statut ? { statut: req.query.statut } : {};
        const abos = await Abonnement.findAll({
            where,
            include: [
                { model: AbonnementVersement, as: 'versements' },
                { model: AbonnementPrestataire, as: 'prestataires', include: [{ model: Fournisseur, as: 'fournisseur', attributes: ['id', 'nomEntreprise', 'telephone'] }] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: abos.map(avecFinance) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// POST /api/abonnements/admin/creer  (ACTIF direct après appel, ou PROPOSE)
router.post('/admin/creer', protect, adminOnly, async (req, res) => {
    try {
        const b = req.body;
        if (!b.telephone || !b.adresse || !b.serviceId) {
            return res.status(400).json({ success: false, message: 'Téléphone, adresse et service sont obligatoires.' });
        }
        if (!FREQUENCES.includes(b.frequence)) return res.status(400).json({ success: false, message: 'Fréquence invalide.' });
        const modeFact = b.modeFacturation || 'mois';
        if (!MODES_FACTURATION.includes(modeFact)) return res.status(400).json({ success: false, message: 'Mode de facturation invalide.' });
        const statut = b.statut === 'PROPOSE' ? 'PROPOSE' : 'ACTIF';
        if (statut === 'ACTIF' && !RE_DATE.test(b.dateDebut || '')) {
            return res.status(400).json({ success: false, message: 'dateDebut (AAAA-MM-JJ) obligatoire pour un abonnement actif.' });
        }

        let clientId = b.clientId || null;
        if (!clientId) {
            const users = await User.findAll({ where: { telephone: String(b.telephone).trim() }, attributes: ['id'] });
            if (users.length === 1) clientId = users[0].id;
        }

        const abo = await Abonnement.create({
            clientId, clientNom: b.clientNom || null, telephone: String(b.telephone).trim(), adresse: b.adresse,
            serviceId: b.serviceId, serviceNom: b.serviceNom || null,
            frequence: b.frequence, jourPrefere: b.jourPrefere || null, heure: b.heure || null, remarques: b.remarques || null,
            modeFacturation: modeFact, montant: b.montant ?? null, montantTotalDu: b.montantTotalDu ?? null, acompteDemande: b.acompteDemande ?? null,
            statut, dateDebut: b.dateDebut || null, prochaineVisite: statut === 'ACTIF' ? b.dateDebut : null,
            creeParAdmin: true, creePar: req.user.id
        });

        const ids = Array.isArray(b.fournisseurIds) ? b.fournisseurIds : [];
        if (ids.length) {
            const trouves = await Fournisseur.findAll({ where: { id: ids }, attributes: ['id'] });
            for (const f of trouves) {
                await AbonnementPrestataire.create({ abonnementId: abo.id, fournisseurId: f.id, actif: true, dateDebut: b.dateDebut || aujourdhui() });
            }
        }

        if (clientId) {
            await pushClient(clientId, 'Abonnement créé',
                statut === 'ACTIF' ? 'Votre abonnement Kanari est activé. Les visites apparaîtront dans Mes Réservations.' : 'Une offre d\'abonnement vous attend dans votre espace client.',
                { type: 'ABONNEMENT', abonnementId: String(abo.id) });
        }
        res.status(201).json({
            success: true, data: abo, clientLie: !!clientId,
            message: clientId ? 'Abonnement créé.' : 'Abonnement créé, mais aucun compte client unique trouvé pour ce téléphone (le client ne le verra pas dans son espace).'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur lors de la création.', error: err.message });
    }
});

// PUT /api/abonnements/admin/visites/:reservationId/absence
router.put('/admin/visites/:reservationId/absence', protect, adminOnly, async (req, res) => {
    try {
        const visite = await Reservation.findByPk(req.params.reservationId);
        if (!visite || !visite.abonnementId) return res.status(404).json({ success: false, message: 'Visite d\'abonnement introuvable.' });

        const { absent, remplacantId, motif } = req.body;
        const maj = {};
        if (!visite.fournisseurPrevuId && visite.fournisseurId) maj.fournisseurPrevuId = visite.fournisseurId; // garde l'identité du prévu
        maj.absent = !!absent;
        maj.motifAbsence = absent ? (motif || null) : null;
        if (absent && remplacantId) {
            maj.fournisseurId = parseInt(remplacantId, 10);
            if (['EN_ATTENTE', 'ASSIGNEE'].includes(visite.statut)) maj.statut = 'ASSIGNEE';
        }
        await visite.update(maj);
        res.json({ success: true, data: visite });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// PUT /api/abonnements/admin/reglements/:id/payer
router.put('/admin/reglements/:id/payer', protect, adminOnly, async (req, res) => {
    try {
        const r = await AbonnementReglement.findByPk(req.params.id);
        if (!r) return res.status(404).json({ success: false, message: 'Règlement introuvable.' });
        if (r.statut === 'PAYE') return res.status(400).json({ success: false, message: 'Déjà payé.' });
        const mode = req.body.modePaiement || r.modePaiement;
        if (!MODES_PAIEMENT.includes(mode)) return res.status(400).json({ success: false, message: 'Mode de paiement invalide.' });
        await r.update({ statut: 'PAYE', payeLe: new Date(), modePaiement: mode, note: req.body.note ?? r.note, enregistrePar: req.user.id });
        res.json({ success: true, data: r });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── Calcul du règlement mensuel (proposition, rien n'est enregistré)
async function calculerReglement(abo, debut, fin, brutForce) {
    const visites = await Reservation.findAll({
        where: { abonnementId: abo.id, dateIntervention: { [Op.between]: [debut, fin] }, statut: { [Op.ne]: 'ANNULEE' } },
        order: [['dateIntervention', 'ASC']]
    });
    const lignesP = await AbonnementPrestataire.findAll({ where: { abonnementId: abo.id } });
    const prevu = (v) => v.fournisseurPrevuId || v.fournisseurId;

    const montant = num(abo.montant);
    let brut;
    if (brutForce != null && brutForce !== '') brut = num(brutForce);
    else if (abo.modeFacturation === 'visite') brut = montant * visites.length;
    else if (abo.modeFacturation === 'semaine') {
        const jours = (Date.parse(fin + 'T00:00:00Z') - Date.parse(debut + 'T00:00:00Z')) / 86400000 + 1;
        brut = montant * Math.ceil(jours / 7);
    } else brut = montant;

    const ids = new Set();
    lignesP.forEach((p) => { if (p.actif || (p.dateFin && p.dateFin >= debut)) ids.add(p.fournisseurId); });
    visites.forEach((v) => { if (prevu(v)) ids.add(prevu(v)); });
    if (ids.size === 0) { const e = new Error('Aucun prestataire prévu sur cet abonnement.'); e.status = 400; throw e; }

    const noms = await Fournisseur.findAll({ where: { id: [...ids] }, attributes: ['id', 'nomEntreprise'] });
    const commission = arrondi((brut * TAUX_COMMISSION_ABONNEMENT) / 100);
    const reparti = arrondi(brut - commission);
    const N = ids.size;
    const partPrevue = arrondi(reparti / N);

    const lignes = [...ids].map((id) => {
        const siennes = visites.filter((v) => prevu(v) === id);
        const absences = siennes.filter((v) => v.absent).length;
        const deduction = siennes.length ? arrondi((partPrevue * absences) / siennes.length) : 0;
        return {
            fournisseurId: id,
            nomEntreprise: noms.find((n) => n.id === id)?.nomEntreprise || null,
            partPrevue,
            visitesPrevues: siennes.length,
            visitesFaites: visites.filter((v) => v.fournisseurId === id && v.statut === 'VALIDEE').length,
            remplacements: visites.filter((v) => v.fournisseurId === id && prevu(v) !== id).length,
            absences,
            deductionProposee: deduction,
            netPropose: arrondi(partPrevue - deduction)
        };
    });

    return {
        debut, fin, brut, tauxCommission: TAUX_COMMISSION_ABONNEMENT, commission, reparti, nbPrestataires: N,
        totalDeductions: arrondi(lignes.reduce((a, l) => a + l.deductionProposee, 0)),
        lignes,
        visites: visites.map((v) => ({
            id: v.id, date: v.dateIntervention, heurePrevue: v.heureIntervention, demarreLe: v.demarreLe,
            statut: v.statut, prevuId: prevu(v), realiseParId: v.fournisseurId, absent: !!v.absent, motifAbsence: v.motifAbsence
        }))
    };
}

// GET /api/abonnements/admin/:id/reglement?debut=AAAA-MM-JJ&fin=AAAA-MM-JJ[&brut=]
router.get('/admin/:id/reglement', protect, adminOnly, async (req, res) => {
    try {
        const { debut, fin, brut } = req.query;
        if (!RE_DATE.test(debut || '') || !RE_DATE.test(fin || '')) return res.status(400).json({ success: false, message: 'debut et fin (AAAA-MM-JJ) obligatoires.' });
        const abo = await Abonnement.findByPk(req.params.id);
        if (!abo) return res.status(404).json({ success: false, message: 'Abonnement introuvable.' });
        res.json({ success: true, data: await calculerReglement(abo, debut, fin, brut) });
    } catch (err) {
        console.error(err);
        res.status(err.status || 500).json({ success: false, message: err.status ? err.message : 'Erreur serveur.' });
    }
});

// POST /api/abonnements/admin/:id/reglement  { debut, fin, brut?, lignes:[{fournisseurId, deduction?, modePaiement?, note?, paye?}] }
router.post('/admin/:id/reglement', protect, adminOnly, async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { debut, fin, brut, lignes = [] } = req.body;
        if (!RE_DATE.test(debut || '') || !RE_DATE.test(fin || '')) { await t.rollback(); return res.status(400).json({ success: false, message: 'debut et fin obligatoires.' }); }
        const abo = await Abonnement.findByPk(req.params.id);
        if (!abo) { await t.rollback(); return res.status(404).json({ success: false, message: 'Abonnement introuvable.' }); }

        const deja = await AbonnementReglement.findOne({ where: { abonnementId: abo.id, periodeDebut: debut, periodeFin: fin } });
        if (deja) { await t.rollback(); return res.status(409).json({ success: false, message: 'Un règlement existe déjà pour cette période.' }); }

        const calc = await calculerReglement(abo, debut, fin, brut);
        const crees = [];
        for (const l of calc.lignes) {
            const o = lignes.find((x) => Number(x.fournisseurId) === l.fournisseurId) || {};
            const deduction = o.deduction != null ? num(o.deduction) : l.deductionProposee;
            const net = Math.max(arrondi(l.partPrevue - deduction), 0);
            const paye = !!o.paye;
            if (paye && !MODES_PAIEMENT.includes(o.modePaiement)) { await t.rollback(); return res.status(400).json({ success: false, message: `Mode de paiement requis pour le prestataire #${l.fournisseurId}.` }); }
            crees.push(await AbonnementReglement.create({
                abonnementId: abo.id, fournisseurId: l.fournisseurId, periodeDebut: debut, periodeFin: fin,
                brutAbonnement: calc.brut, commissionKanari: calc.commission, partPrevue: l.partPrevue,
                visitesPrevues: l.visitesPrevues, visitesFaites: l.visitesFaites, absences: l.absences,
                deduction, netAPayer: net, modePaiement: o.modePaiement || null,
                statut: paye ? 'PAYE' : 'A_PAYER', payeLe: paye ? new Date() : null,
                note: o.note || null, enregistrePar: req.user.id
            }, { transaction: t }));
        }
        await t.commit();
        res.status(201).json({ success: true, data: crees });
    } catch (err) {
        if (!t.finished) await t.rollback();
        console.error(err);
        res.status(err.status || 500).json({ success: false, message: err.status ? err.message : 'Erreur serveur.' });
    }
});

// POST /api/abonnements/admin/:id/prestataires  { fournisseurId }
router.post('/admin/:id/prestataires', protect, adminOnly, async (req, res) => {
    try {
        const abo = await Abonnement.findByPk(req.params.id);
        const f = await Fournisseur.findByPk(req.body.fournisseurId);
        if (!abo || !f) return res.status(404).json({ success: false, message: 'Abonnement ou prestataire introuvable.' });
        const [ligne, cree] = await AbonnementPrestataire.findOrCreate({
            where: { abonnementId: abo.id, fournisseurId: f.id },
            defaults: { actif: true, dateDebut: aujourdhui() }
        });
        if (!cree) await ligne.update({ actif: true, dateFin: null });
        res.json({ success: true, data: ligne });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// DELETE /api/abonnements/admin/:id/prestataires/:fournisseurId  (désactive, n'efface pas l'historique)
router.delete('/admin/:id/prestataires/:fournisseurId', protect, adminOnly, async (req, res) => {
    try {
        const ligne = await AbonnementPrestataire.findOne({ where: { abonnementId: req.params.id, fournisseurId: req.params.fournisseurId } });
        if (!ligne) return res.status(404).json({ success: false, message: 'Introuvable.' });
        await ligne.update({ actif: false, dateFin: aujourdhui() });
        res.json({ success: true, data: ligne });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// POST /api/abonnements/admin/:id/versements  { montant, mode, type?, reference?, note? }
router.post('/admin/:id/versements', protect, adminOnly, async (req, res) => {
    try {
        const abo = await Abonnement.findByPk(req.params.id, { include: [{ model: AbonnementVersement, as: 'versements' }] });
        if (!abo) return res.status(404).json({ success: false, message: 'Abonnement introuvable.' });
        const { montant, mode, type, reference, note } = req.body;
        if (!(num(montant) > 0)) return res.status(400).json({ success: false, message: 'Montant invalide.' });
        if (!MODES_PAIEMENT.includes(mode)) return res.status(400).json({ success: false, message: 'Mode de paiement invalide.' });

        const v = await AbonnementVersement.create({
            abonnementId: abo.id, montant: num(montant), mode, type: type || 'ACOMPTE',
            reference: reference || null, note: note || null, enregistrePar: req.user.id
        });
        const f = finance({ ...abo.toJSON(), versements: [...abo.versements, v] });
        await pushClient(abo.clientId, 'Paiement enregistré',
            `Nous avons reçu ${fcfa(montant)}. Total payé : ${fcfa(f.paye)}. Reste à payer : ${fcfa(f.reste)}.`,
            { type: 'ABONNEMENT_PAIEMENT', abonnementId: String(abo.id) });
        res.status(201).json({ success: true, data: v, finance: f });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// GET /api/abonnements/admin/:id  (détail complet)
router.get('/admin/:id', protect, adminOnly, async (req, res) => {
    try {
        const abo = await Abonnement.findByPk(req.params.id, {
            include: [
                { model: AbonnementVersement, as: 'versements' },
                { model: AbonnementReglement, as: 'reglements', include: [{ model: Fournisseur, as: 'fournisseur', attributes: ['id', 'nomEntreprise'] }] },
                { model: AbonnementPrestataire, as: 'prestataires', include: [{ model: Fournisseur, as: 'fournisseur', attributes: ['id', 'nomEntreprise', 'telephone'] }] }
            ]
        });
        if (!abo) return res.status(404).json({ success: false, message: 'Abonnement introuvable.' });
        const visites = await Reservation.findAll({
            where: { abonnementId: abo.id },
            include: [{ model: Fournisseur, as: 'prestataire', attributes: ['id', 'nomEntreprise'] }],
            order: [['dateIntervention', 'DESC']]
        });
        res.json({ success: true, data: { ...avecFinance(abo), visites } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// PUT /api/abonnements/admin/:id  (prix, statut, planning… modifiable à tout moment)
router.put('/admin/:id', protect, adminOnly, async (req, res) => {
    try {
        const abo = await Abonnement.findByPk(req.params.id);
        if (!abo) return res.status(404).json({ success: false, message: 'Abonnement introuvable.' });
        const b = req.body;
        const CHAMPS = ['clientId', 'clientNom', 'telephone', 'adresse', 'serviceNom', 'frequence', 'jourPrefere', 'heure', 'remarques',
            'modeFacturation', 'montant', 'montantTotalDu', 'acompteDemande', 'dateDebut', 'prochaineVisite'];
        const maj = {};
        CHAMPS.forEach((c) => { if (b[c] !== undefined) maj[c] = b[c]; });
        if (maj.frequence && !FREQUENCES.includes(maj.frequence)) return res.status(400).json({ success: false, message: 'Fréquence invalide.' });
        if (maj.modeFacturation && !MODES_FACTURATION.includes(maj.modeFacturation)) return res.status(400).json({ success: false, message: 'Mode de facturation invalide.' });
        ['dateDebut', 'prochaineVisite'].forEach((c) => { if (maj[c] && !RE_DATE.test(maj[c])) maj[c] = undefined; });

        const ancien = abo.statut;
        if (b.statut !== undefined) {
            if (!STATUTS.includes(b.statut)) return res.status(400).json({ success: false, message: 'Statut invalide.' });
            maj.statut = b.statut;
            if (b.statut === 'ACTIF' && !(maj.prochaineVisite || abo.prochaineVisite)) {
                maj.prochaineVisite = maj.dateDebut || abo.dateDebut || aujourdhui();
            }
        }
        await abo.update(maj);

        if (maj.statut && maj.statut !== ancien) {
            const msg = {
                PROPOSE: 'Votre offre d\'abonnement est prête. Consultez-la dans votre espace client.',
                ACTIF: 'Votre abonnement est activé.',
                EN_PAUSE: 'Votre abonnement est en pause.',
                RESILIE: 'Votre abonnement a été résilié.',
                REFUSE: 'Votre demande d\'abonnement n\'a pas pu être acceptée.'
            }[maj.statut];
            if (msg) await pushClient(abo.clientId, 'Abonnement Kanari', msg, { type: 'ABONNEMENT', abonnementId: String(abo.id) });
        }
        res.json({ success: true, data: abo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
    }
});

// ════════════════════════════════════════════════════════════
// ROUTES CLIENT
// ════════════════════════════════════════════════════════════

// POST /api/abonnements  — le client demande un abonnement (EN_ETUDE, sans prix)
router.post('/', protect, async (req, res) => {
    try {
        const b = req.body;
        const telephone = String(b.telephone || req.user.telephone || '').trim();
        if (!telephone || !b.adresse || !b.serviceId) {
            return res.status(400).json({ success: false, message: 'Service, adresse et téléphone sont obligatoires.' });
        }
        if (!FREQUENCES.includes(b.frequence)) return res.status(400).json({ success: false, message: 'Fréquence invalide.' });
        const abo = await Abonnement.create({
            clientId: req.user.id, clientNom: b.clientNom || req.user.nom, telephone, adresse: b.adresse,
            serviceId: b.serviceId, serviceNom: b.serviceNom || null,
            frequence: b.frequence, jourPrefere: b.jourPrefere || null, heure: b.heure || null, remarques: b.remarques || null,
            dateDebut: RE_DATE.test(b.dateDebut || '') ? b.dateDebut : null, statut: 'EN_ETUDE'
        });
        await alerteAdmin('Nouvelle demande d\'abonnement', `${abo.serviceNom || 'Service'} — ${abo.adresse}`, { type: 'ABONNEMENT_DEMANDE', abonnementId: String(abo.id) });
        res.status(201).json({
            success: true, data: abo,
            message: 'Demande reçue. Notre équipe étudie votre besoin et vous envoie un prix adapté. Rien n\'est facturé avant votre accord.'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// GET /api/abonnements/mes
router.get('/mes', protect, async (req, res) => {
    try {
        const abos = await Abonnement.findAll({
            where: { clientId: req.user.id },
            include: [{ model: AbonnementVersement, as: 'versements' }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: abos.map(avecFinance) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

const actionClient = (de, vers, message, apres) => async (req, res) => {
    try {
        const abo = await Abonnement.findOne({ where: { id: req.params.id, clientId: req.user.id } });
        if (!abo) return res.status(404).json({ success: false, message: 'Abonnement introuvable.' });
        if (!de.includes(abo.statut)) return res.status(400).json({ success: false, message: `Action impossible (statut actuel : ${abo.statut}).` });
        await abo.update({ statut: vers, ...(apres ? apres(abo) : {}) });
        await alerteAdmin('Abonnement mis à jour par le client', `Abonnement #${abo.id} : ${vers}`, { type: 'ABONNEMENT_CLIENT', abonnementId: String(abo.id) });
        res.json({ success: true, message, data: abo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

router.put('/:id/accepter', protect, actionClient(['PROPOSE'], 'ACTIF', 'Abonnement activé. Les visites apparaîtront dans Mes Réservations.',
    (abo) => ({ prochaineVisite: abo.prochaineVisite || abo.dateDebut || aujourdhui() })));
router.put('/:id/refuser', protect, actionClient(['PROPOSE'], 'REFUSE', 'Offre refusée.'));
router.put('/:id/pause', protect, actionClient(['ACTIF'], 'EN_PAUSE', 'Abonnement mis en pause.'));
router.put('/:id/reprendre', protect, actionClient(['EN_PAUSE'], 'ACTIF', 'Abonnement repris.',
    (abo) => ({ prochaineVisite: rattraper(abo.prochaineVisite, abo.frequence) })));
router.put('/:id/resilier', protect, actionClient(['EN_ETUDE', 'PROPOSE', 'ACTIF', 'EN_PAUSE'], 'RESILIE', 'Abonnement résilié. Les visites déjà créées restent à traiter normalement.'));

module.exports = router;