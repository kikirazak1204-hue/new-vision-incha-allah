const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { protect, authorize } = require('../middleware/auth');
const { sequelize, Solde, Retrait, Fournisseur, User } = require('../models');
const PF = require('../services/portefeuilleService');
const { notifierFournisseur } = require('../services/paiementService');

const SOURCES = ['GAINS', 'RISTOURNE', 'DEPOT'];
const OPERATEURS = ['ORANGE', 'MOOV', 'AIRTEL', 'MYNITA', 'AMANA', 'BANQUE'];
const RETRAIT_MIN = Number(process.env.RETRAIT_MINIMUM ?? 500);
const fmt = (n) => Number(n).toLocaleString('fr-FR') + ' FCFA';
const erreur = (status, message) => Object.assign(new Error(message), { status });
const repondre = (res, e) => {
    if (e.status) return res.status(e.status).json({ success: false, message: e.message });
    console.error('❌ soldes :', e);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
};
const profil = (userId) => Fournisseur.findOne({ where: { userId } });
const soldeVerrouille = async (fournisseurId, t) =>
    (await Solde.findOne({ where: { fournisseurId }, transaction: t, lock: t.LOCK.UPDATE }))
    || Solde.create({ fournisseurId }, { transaction: t });

// ═══════════════ PARTENAIRE ═══════════════

// Mon portefeuille : argent retirable, retraits, journal, ristournes, fonds de soutien (comptes séparés)
router.get('/mien', protect, authorize('fournisseur'), async (req, res) => {
    try {
        const f = await profil(req.user.id);
        if (!f) throw erreur(404, 'Profil introuvable.');
        let solde = await Solde.findOne({ where: { fournisseurId: f.id } });
        if (!solde) solde = await Solde.create({ fournisseurId: f.id });

        const [retraits, mouvements, ristourne, soutien, actif] = await Promise.all([
            Retrait.findAll({ where: { fournisseurId: f.id }, order: [['createdAt', 'DESC']], limit: 20 }),
            PF.Mouvement.findAll({ where: { fournisseurId: f.id, compte: { [Op.in]: ['GAINS', 'RISTOURNE', 'SOUTIEN'] } }, order: [['id', 'DESC']], limit: 40 }),
            PF.totalCompte({ clientId: req.user.id, compte: 'RISTOURNE' }),
            PF.totalCompte({ fournisseurId: f.id, compte: 'SOUTIEN' }),
            PF.soutienActif(f.id)
        ]);
        res.json({
            success: true,
            data: {
                solde, retraits, mouvements, operateurs: OPERATEURS, retraitMinimum: RETRAIT_MIN,
                ristourne: { total: ristourne, taux: PF.TAUX_RISTOURNE, base: 'commissions effectivement perçues par Kanari' },
                soutien: { actif, solde: soutien, taux: PF.TAUX_SOUTIEN }
            }
        });
    } catch (e) { repondre(res, e); }
});

// Demande de retrait (client ou partenaire) : le montant est réservé tout de suite sur le compartiment choisi
router.post('/retrait', protect, async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const montant = Math.round(Number(req.body.montant));
        const operateur = String(req.body.operateur || '').toUpperCase();
        const telephone = String(req.body.telephone || '').trim();
        const f = await profil(req.user.id);
        const source = String(req.body.source || (f ? 'GAINS' : 'RISTOURNE')).toUpperCase();

        if (!montant || !operateur || !telephone) throw erreur(400, 'Montant, opérateur et numéro sont obligatoires.');
        if (!OPERATEURS.includes(operateur)) throw erreur(400, 'Opérateur non pris en charge.');
        if (!SOURCES.includes(source)) throw erreur(400, 'Compartiment invalide.');
        if (source === 'GAINS' && !f) throw erreur(403, 'Les gains sont réservés aux partenaires.');
        if (telephone.length < 6) throw erreur(400, 'Numéro ou compte invalide.');
        if (montant < RETRAIT_MIN) throw erreur(400, `Montant minimum : ${RETRAIT_MIN} FCFA.`);

        await PF.verrouillerUtilisateur(req.user.id, t);
        const retrait = await Retrait.create({ fournisseurId: f?.id || null, userId: req.user.id, source, montant, operateur, telephone }, { transaction: t });

        let nouveau = null;
        if (source === 'GAINS') {
            const solde = await soldeVerrouille(f.id, t);
            if (Number(solde.solde) < montant) throw erreur(400, 'Solde insuffisant.');
            nouveau = Number(solde.solde) - montant;
            await solde.update({ solde: nouveau, totalRetire: Number(solde.totalRetire) + montant }, { transaction: t });
            await PF.ecrire({ cle: `RET-${retrait.id}`, compte: 'GAINS', sens: 'DEBIT', categorie: 'RETRAIT', montant,
                soldeApres: nouveau, fournisseurId: f.id, retraitId: retrait.id, auteurId: req.user.id }, t);
        } else {
            const dispo = await PF.totalCompte({ clientId: req.user.id, compte: source }, t);
            if (dispo < montant) throw erreur(400, 'Solde insuffisant.');
            nouveau = dispo - montant;
            await PF.ecrire({ cle: `RET-${retrait.id}`, compte: source, sens: 'DEBIT', categorie: 'RETRAIT', montant,
                clientId: req.user.id, retraitId: retrait.id, auteurId: req.user.id }, t);
        }
        await t.commit();
        res.status(201).json({ success: true, data: retrait, nouveauSolde: nouveau });
    } catch (e) { await t.rollback().catch(() => {}); repondre(res, e); }
});

// ═══════════════ PORTEFEUILLE COMMUN (client ou partenaire) ═══════════════
router.get('/portefeuille', protect, async (req, res) => {
    try {
        const uid = req.user.id;
        const sd = await PF.soldesUtilisateur(uid);
        const ids = [{ clientId: uid }];
        if (sd.profilId) ids.push({ fournisseurId: sd.profilId });

        const [retraits, mouvements, soutien, actif, enCours] = await Promise.all([
            Retrait.findAll({ where: { [Op.or]: [{ userId: uid }, ...(sd.profilId ? [{ fournisseurId: sd.profilId }] : [])] }, order: [['createdAt', 'DESC']], limit: 20 }),
            PF.Mouvement.findAll({ where: { [Op.or]: ids }, order: [['id', 'DESC']], limit: 60 }),
            sd.profilId ? PF.totalCompte({ fournisseurId: sd.profilId, compte: 'SOUTIEN' }) : 0,
            sd.profilId ? PF.soutienActif(sd.profilId) : false,
            PF.cloturerMois(new Date().toISOString().slice(0, 7), { simulation: true, clientId: uid, jusquA: new Date() })
        ]);
        res.json({
            success: true,
            data: {
                estPartenaire: !!sd.profilId,
                gains: sd.gains, ristourne: sd.ristourne, depot: sd.depot, disponible: sd.disponible,
                ristourneEnCours: enCours.total, tauxRistourne: PF.TAUX_RISTOURNE,
                soutien: { actif, solde: soutien, taux: PF.TAUX_SOUTIEN },
                retraits, mouvements, operateurs: OPERATEURS, retraitMinimum: RETRAIT_MIN, depotMinimum: PF.DEPOT_MIN
            }
        });
    } catch (e) { repondre(res, e); }
});

// ═══════════════ CLIENT : récompenses (séparées de ses paiements) ═══════════════
router.get('/client', protect, async (req, res) => {
    try {
        const [total, mouvements] = await Promise.all([
            PF.totalCompte({ clientId: req.user.id, compte: 'RISTOURNE' }),
            PF.Mouvement.findAll({ where: { clientId: req.user.id, compte: 'RISTOURNE' }, order: [['id', 'DESC']], limit: 30 })
        ]);
        const enCours = await PF.cloturerMois(new Date().toISOString().slice(0, 7), { simulation: true, clientId: req.user.id, jusquA: new Date() });
        res.json({ success: true, data: { ristourne: total, enCours: enCours.total, taux: PF.TAUX_RISTOURNE, plafond: PF.PLAFOND_PART_COMMISSION, mouvements } });
    } catch (e) { repondre(res, e); }
});

// ═══════════════ ADMIN ═══════════════

router.get('/retraits', protect, authorize('admin'), async (req, res) => {
    try {
        const statut = ['EN_ATTENTE', 'TRAITE', 'REFUSE'].includes(req.query.statut) ? req.query.statut : 'EN_ATTENTE';
        const retraits = await Retrait.findAll({
            where: { statut },
            include: [{ model: Fournisseur, as: 'fournisseurRetrait', attributes: ['nomEntreprise', 'telephone'] }],
            order: [['createdAt', 'DESC']], limit: 200
        });
        const ids = [...new Set(retraits.map((r) => r.userId).filter(Boolean))];
        const users = ids.length ? await User.findAll({ where: { id: { [Op.in]: ids } }, attributes: ['id', 'nom', 'prenom'] }) : [];
        const nom = (id) => { const u = users.find((x) => x.id === id); return u ? [u.prenom, u.nom].filter(Boolean).join(' ') : null; };
        res.json({ success: true, data: retraits.map((r) => ({ ...r.toJSON(), demandeur: nom(r.userId) })) });
    } catch (e) { repondre(res, e); }
});

// Traiter un retrait : TRAITE (transfert effectué, référence conseillée) ou REFUSE (motif obligatoire, montant restitué)
router.put('/retraits/:id', protect, authorize('admin'), async (req, res) => {
    const t = await sequelize.transaction();
    let notif = null;
    try {
        const { statut, reference, motif } = req.body;
        if (!['TRAITE', 'REFUSE'].includes(statut)) throw erreur(400, 'Statut invalide.');
        const retrait = await Retrait.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!retrait) throw erreur(404, 'Retrait introuvable.');
        if (retrait.statut !== 'EN_ATTENTE') throw erreur(409, 'Ce retrait a déjà été traité.'); // évite la double restitution
        if (statut === 'REFUSE' && !String(motif || '').trim()) throw erreur(400, 'Le motif du refus est obligatoire.');

        await retrait.update({
            statut, reference: reference ? String(reference).trim() : null, motif: motif ? String(motif).trim() : null,
            traitePar: req.user.id, traiteLe: new Date()
        }, { transaction: t });

        if (statut === 'REFUSE') {
            if (!retrait.source || retrait.source === 'GAINS') {
                const solde = await soldeVerrouille(retrait.fournisseurId, t);
                const nouveau = Number(solde.solde) + Number(retrait.montant);
                await solde.update({ solde: nouveau, totalRetire: Number(solde.totalRetire) - Number(retrait.montant) }, { transaction: t });
                await PF.ecrire({ cle: `RET-${retrait.id}-ANN`, compte: 'GAINS', sens: 'CREDIT', categorie: 'ANNULATION', montant: retrait.montant,
                    soldeApres: nouveau, fournisseurId: retrait.fournisseurId, retraitId: retrait.id, auteurId: req.user.id, motif }, t);
            } else {
                await PF.ecrire({ cle: `RET-${retrait.id}-ANN`, compte: retrait.source, sens: 'CREDIT', categorie: 'ANNULATION', montant: retrait.montant,
                    clientId: retrait.userId, retraitId: retrait.id, auteurId: req.user.id, motif }, t);
            }
        }
        notif = statut === 'TRAITE'
            ? { title: 'Retrait effectué ✅', body: `${fmt(retrait.montant)} envoyés vers ${retrait.operateur} ${retrait.telephone}.` }
            : { title: 'Retrait refusé', body: `${fmt(retrait.montant)} remis sur votre solde. Motif : ${motif}` };
        await t.commit();
        if (retrait.fournisseurId) notifierFournisseur(retrait.fournisseurId, notif.title, notif.body).catch(() => {});
        res.json({ success: true, data: retrait });
    } catch (e) { await t.rollback().catch(() => {}); repondre(res, e); }
});

// Tableau de bord financier de Kanari : ce qu'il gagne, ce qu'il doit, ce qui n'est pas à lui
router.get('/admin/finances', protect, authorize('admin'), async (req, res) => {
    try {
        const [[c]] = await sequelize.query(
            "SELECT COALESCE(SUM(CASE WHEN typePaiement='COMMISSION' THEN montant ELSE commissionKanari END),0) AS total, COUNT(*) AS nb FROM paiements WHERE statut='valide'");
        const [[v]] = await sequelize.query(
            "SELECT COALESCE(SUM(montant),0) AS total FROM paiements WHERE statut='valide' AND typePaiement IN ('COMMANDE','MISSION')");
        const [lignes] = await sequelize.query(
            "SELECT compte, SUM(CASE WHEN sens='CREDIT' THEN montant ELSE -montant END) AS total FROM mouvements_portefeuille GROUP BY compte");
        const [[ris]] = await sequelize.query(
            "SELECT COALESCE(SUM(CASE WHEN cle LIKE 'P%-RIS-%-ANN' THEN -montant WHEN cle LIKE 'P%-RIS-%' THEN montant ELSE 0 END),0) AS cout FROM mouvements_portefeuille WHERE compte='RISTOURNE'");
        const compte = (n) => Number((lignes.find((l) => l.compte === n) || {}).total || 0);
        const soldesPartenaires = Number(await Solde.sum('solde')) || 0;
        const retraitsEnAttente = Number(await Retrait.sum('montant', { where: { statut: 'EN_ATTENTE' } })) || 0;
        const commissions = Number(c.total);
        const ristournes = Number(ris.cout);                 // coût réel des ristournes (retraits et paiements exclus)

        let partenaires = [];
        try {
            const [rows] = await sequelize.query(
                `SELECT f.id, f.nomEntreprise, f.fondsSoutienActif, COALESCE(s.solde,0) AS solde
                 FROM \`${Fournisseur.getTableName()}\` f LEFT JOIN soldes s ON s.fournisseurId = f.id ORDER BY f.nomEntreprise LIMIT 300`);
            partenaires = rows.map((r) => ({ id: r.id, nom: r.nomEntreprise, solde: Number(r.solde), soutienActif: Number(r.fondsSoutienActif) === 1 }));
        } catch {
            partenaires = (await Fournisseur.findAll({ attributes: ['id', 'nomEntreprise'], limit: 300 }))
                .map((f) => ({ id: f.id, nom: f.nomEntreprise, solde: 0, soutienActif: false }));
        }

        res.json({
            success: true,
            data: {
                volumeEncaisse: Number(v.total),
                commissionsEncaissees: commissions,
                ristournesAccordees: ristournes,
                resultatKanari: commissions - ristournes,                 // ce qui reste vraiment à Kanari
                aReverserPartenaires: soldesPartenaires,                  // dette : argent des partenaires
                retraitsEnAttente,
                ristournesAHonorer: compte('RISTOURNE'),                // dette : récompenses pas encore retirées ni dépensées
                depotsClients: compte('DEPOT'),                         // dette : argent déposé par les utilisateurs
                fondsSoutienDetenu: compte('SOUTIEN'),                    // n'appartient pas à Kanari
                plafondRistournePct: PF.PLAFOND_PART_COMMISSION, tauxRistourne: PF.TAUX_RISTOURNE,
                partenaires
            }
        });
    } catch (e) { repondre(res, e); }
});

// Clôture mensuelle des ristournes clients : GET = simulation, POST = crédit réel (mois terminé uniquement)
router.get('/admin/cloture/:mois', protect, authorize('admin'), async (req, res) => {
    try { res.json({ success: true, data: await PF.cloturerMois(req.params.mois, { simulation: true }) }); }
    catch (e) { repondre(res, e); }
});
router.post('/admin/cloture/:mois', protect, authorize('admin'), async (req, res) => {
    const t = await sequelize.transaction();
    try {
        if (req.params.mois >= new Date().toISOString().slice(0, 7)) throw erreur(400, "Ce mois n'est pas terminé : clôturez-le à partir du mois suivant.");
        const r = await PF.cloturerMois(req.params.mois, { simulation: false }, t);
        await t.commit();
        res.json({ success: true, data: r });
    } catch (e) { await t.rollback().catch(() => {}); repondre(res, e); }
});

// Correction d'une erreur : mouvement signé avec motif obligatoire (jamais d'effacement)
router.post('/admin/correction', protect, authorize('admin'), async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const fournisseurId = Number(req.body.fournisseurId);
        const montant = Math.round(Number(req.body.montant));
        const motif = String(req.body.motif || '').trim();
        if (!fournisseurId || !montant) throw erreur(400, 'Partenaire et montant (positif ou négatif) obligatoires.');
        if (motif.length < 5) throw erreur(400, 'Un motif explicite est obligatoire.');
        const solde = await soldeVerrouille(fournisseurId, t);
        const nouveau = Number(solde.solde) + montant;
        if (nouveau < 0) throw erreur(409, 'Cette correction rendrait le solde négatif.');
        await solde.update({ solde: nouveau }, { transaction: t });
        await PF.ecrire({ cle: `COR-${fournisseurId}-${Date.now()}`, compte: 'GAINS', sens: montant > 0 ? 'CREDIT' : 'DEBIT', categorie: 'CORRECTION',
            montant: Math.abs(montant), soldeApres: nouveau, fournisseurId, auteurId: req.user.id, motif }, t);
        await t.commit();
        res.json({ success: true, nouveauSolde: nouveau });
    } catch (e) { await t.rollback().catch(() => {}); repondre(res, e); }
});

// Activer / désactiver le fonds de soutien d'un partenaire (uniquement après son accord expliqué)
router.put('/admin/fonds-soutien/:fournisseurId', protect, authorize('admin'), async (req, res) => {
    try {
        const actif = req.body.actif === true;
        if (actif && req.body.accordRecueilli !== true) throw erreur(400, "Confirmez que le partenaire a reçu l'explication et donné son accord.");
        await sequelize.query(
            `UPDATE \`${Fournisseur.getTableName()}\` SET fondsSoutienActif = ?, fondsSoutienAccepteLe = ? WHERE id = ?`,
            { replacements: [actif ? 1 : 0, actif ? new Date() : null, Number(req.params.fournisseurId)] }
        );
        res.json({ success: true, actif });
    } catch (e) { repondre(res, e); }
});

// Utilisation du fonds de soutien (décaissement tracé, motif obligatoire)
router.post('/admin/fonds-soutien/utiliser', protect, authorize('admin'), async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const fournisseurId = Number(req.body.fournisseurId);
        const montant = Math.round(Number(req.body.montant));
        const motif = String(req.body.motif || '').trim();
        if (!fournisseurId || montant <= 0 || motif.length < 5) throw erreur(400, 'Partenaire, montant et motif explicite obligatoires.');
        const dispo = await PF.totalCompte({ fournisseurId, compte: 'SOUTIEN' }, t);
        if (dispo < montant) throw erreur(409, `Fonds de soutien disponible : ${fmt(dispo)}.`);
        await PF.ecrire({ cle: `SOU-USE-${fournisseurId}-${Date.now()}`, compte: 'SOUTIEN', sens: 'DEBIT', categorie: 'UTILISATION',
            montant, fournisseurId, auteurId: req.user.id, motif }, t);
        await t.commit();
        res.json({ success: true, reste: dispo - montant });
    } catch (e) { await t.rollback().catch(() => {}); repondre(res, e); }
});

module.exports = router;