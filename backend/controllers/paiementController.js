const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const Paiement = require('../models/Paiement');
const Commande = require('../models/Commande');
const Reservation = require('../models/Reservation');
const Fournisseur = require('../models/Fournisseur');
const BonIntervention = require('../models/BonIntervention');
const Solde = require('../models/Solde');
const {
    ErreurPaiement, calculerDu, appliquerStatut, notifierFournisseur, commissionDuBon, MODES_DIRECTS
} = require('../services/paiementService');

const reponseErreur = (res, error, contexte) => {
    if (error instanceof ErreurPaiement) {
        return res.status(error.status).json({ success: false, message: error.message, code: error.code });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ success: false, message: 'Cette référence de paiement a déjà été enregistrée.' });
    }
    console.error(`❌ Erreur ${contexte}:`, error);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
};

const paiementExistant = (commandeId, reservationId, typePaiement, t) =>
    Paiement.findOne({
        where: {
            ...(commandeId ? { commandeId } : { reservationId }),
            typePaiement,
            statut: { [Op.in]: ['en_attente', 'valide'] }
        },
        transaction: t
    });

const INCLUDES = [
    { model: Commande, as: 'commande', required: false },
    { model: Reservation, as: 'reservation', required: false }
];

// ═══════════════════════════════════════════════════════════
// 1. Historique du client connecté
// ═══════════════════════════════════════════════════════════
exports.getPaiementsClient = async (req, res) => {
    try {
        if (!req.user?.id) throw new ErreurPaiement(401, 'Non autorisé.');
        const paiements = await Paiement.findAll({
            where: { clientId: req.user.id },
            include: INCLUDES,
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({ success: true, data: paiements });
    } catch (e) { return reponseErreur(res, e, 'getPaiementsClient'); }
};

// ═══════════════════════════════════════════════════════════
// 2. Historique complet (admin) — filtres : ?statut= &typePaiement= &limit=
// ═══════════════════════════════════════════════════════════
exports.getAllPaiements = async (req, res) => {
    try {
        const where = {};
        if (req.query.statut) where.statut = req.query.statut;
        if (req.query.typePaiement) where.typePaiement = req.query.typePaiement;
        const limit = Math.min(Number(req.query.limit) || 200, 500);

        const paiements = await Paiement.findAll({
            where, include: INCLUDES, order: [['createdAt', 'DESC']], limit
        });
        return res.status(200).json({ success: true, data: paiements });
    } catch (e) { return reponseErreur(res, e, 'getAllPaiements'); }
};

// ═══════════════════════════════════════════════════════════
// 3. Vérification par transactionId (propriétaire ou admin)
// ═══════════════════════════════════════════════════════════
exports.verifyPaiement = async (req, res) => {
    try {
        const { txId } = req.params;
        if (!txId) throw new ErreurPaiement(400, 'Le paramètre txId est requis.');

        const paiement = await Paiement.findOne({ where: { transactionId: txId }, include: INCLUDES });
        if (!paiement) throw new ErreurPaiement(404, 'Paiement introuvable.');
        if (paiement.clientId !== req.user.id && req.user.role !== 'admin') {
            throw new ErreurPaiement(403, 'Accès refusé.');
        }
        return res.status(200).json({ success: true, data: paiement });
    } catch (e) { return reponseErreur(res, e, 'verifyPaiement'); }
};

// ═══════════════════════════════════════════════════════════
// 4. Montant à payer (calculé serveur) — GET ?commandeId= ou ?reservationId=
// ═══════════════════════════════════════════════════════════
exports.getAPayer = async (req, res) => {
    try {
        const { commandeId, reservationId } = req.query;
        if (!!commandeId === !!reservationId) {
            throw new ErreurPaiement(400, 'Fournir commandeId ou reservationId.');
        }
        const du = await calculerDu({ commandeId, reservationId, user: req.user });

        const existant = await paiementExistant(commandeId, reservationId, du.typePaiement);
        if (existant) {
            throw new ErreurPaiement(409,
                existant.statut === 'valide' ? 'Déjà réglé.' : 'Un paiement est déjà en attente de validation.',
                existant.statut === 'valide' ? 'DEJA_REGLE' : 'EN_ATTENTE');
        }
        return res.json({ success: true, data: { ...du, devise: 'FCFA' } });
    } catch (e) { return reponseErreur(res, e, 'getAPayer'); }
};

// ═══════════════════════════════════════════════════════════
// 5. Choix du mode de règlement d'une mission (avant le bon d'intervention)
//    direct_prestataire = le client paiera le prestataire sur place
// ═══════════════════════════════════════════════════════════
exports.definirModeReservation = async (req, res) => {
    try {
        const { reservationId, modePaiement } = req.body;
        if (!['mobile_money', 'carte_bancaire', 'direct_prestataire'].includes(modePaiement)) {
            throw new ErreurPaiement(400, 'Mode de règlement invalide.');
        }
        const r = await Reservation.findByPk(reservationId);
        if (!r) throw new ErreurPaiement(404, 'Mission introuvable.');
        if (r.clientId !== req.user.id) throw new ErreurPaiement(403, 'Cette mission ne vous appartient pas.');

        const deja = await Paiement.count({
            where: { reservationId, statut: { [Op.in]: ['en_attente', 'valide'] } }
        });
        if (deja > 0) throw new ErreurPaiement(409, 'Un paiement existe déjà pour cette mission.');

        await r.update({ modePaiement });
        return res.json({ success: true, message: 'Mode de règlement enregistré.' });
    } catch (e) { return reponseErreur(res, e, 'definirModeReservation'); }
};

// ═══════════════════════════════════════════════════════════
// 6. Création d'un paiement (commande, mission ou dépôt de commission)
//    Le montant n'est JAMAIS lu depuis le client.
// ═══════════════════════════════════════════════════════════
exports.createMobileMoneyPaiement = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { commandeId, reservationId, telephone, nom, messageClient, referenceClient, modePaiement } = req.body;

        if (!req.user?.id) throw new ErreurPaiement(401, 'Session expirée ou utilisateur non identifié.');
        if (!!commandeId === !!reservationId) throw new ErreurPaiement(400, 'Fournir soit commandeId, soit reservationId.');
        if (!telephone || !String(telephone).trim()) throw new ErreurPaiement(400, 'Le téléphone est obligatoire.');

        const mode = modePaiement || 'mobile_money';
        if (!['mobile_money', 'carte_bancaire', 'depot_kanari', 'orange_money', 'moov_money', 'airtel_money', 'amanata', 'mynita', 'virement_bancaire'].includes(mode)) {
            throw new ErreurPaiement(400, 'Mode de paiement non autorisé.');
        }

        const du = await calculerDu({ commandeId, reservationId, user: req.user, t });
        if (du.montant <= 0) throw new ErreurPaiement(409, 'Aucun montant à régler.');

        const existant = await paiementExistant(commandeId, reservationId, du.typePaiement, t);
        if (existant) {
            throw new ErreurPaiement(409,
                existant.statut === 'valide' ? 'Déjà réglé.' : 'Un paiement est déjà en attente de validation.');
        }

        const paiement = await Paiement.create({
            commandeId: commandeId || null,
            reservationId: reservationId || null,
            clientId: req.user.id,
            fournisseurId: du.fournisseurId,
            typePaiement: du.typePaiement,
            montant: du.montant,
            tauxCommission: du.tauxCommission,
            commissionKanari: du.commission,
            montantNet: du.net,
            telephone: String(telephone).trim(),
            nom: nom?.trim() || req.user.nom || 'Client',
            statut: 'en_attente',
            modePaiement: mode,
            transactionId: 'NV-TRX-' + uuidv4().substring(0, 8).toUpperCase(),
            referenceClient: referenceClient?.trim() || `REF-${Date.now()}`,
            messageClient: messageClient?.trim() || null
        }, { transaction: t });

        if (du.typePaiement === 'MISSION') {
            await Reservation.update({ statutPaiement: 'en_attente' }, { where: { id: reservationId }, transaction: t });
        }

        await t.commit();
        return res.status(201).json({
            success: true,
            message: "Paiement enregistré et transmis à l'administration pour validation.",
            data: paiement
        });
    } catch (e) {
        if (!t.finished) await t.rollback();
        return reponseErreur(res, e, 'createMobileMoneyPaiement');
    }
};

// ═══════════════════════════════════════════════════════════
// 7. Validation / rejet / remboursement par l'admin
// ═══════════════════════════════════════════════════════════
exports.updateStatutPaiement = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { statut, motif } = req.body;
        if (!['valide', 'rejete', 'rembourse'].includes(statut)) {
            throw new ErreurPaiement(400, 'Statut invalide. Utilisez : valide, rejete, rembourse.');
        }
        const p = await Paiement.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!p) throw new ErreurPaiement(404, 'Paiement introuvable.');

        if (p.statut === statut) {
            await t.rollback();
            return res.status(200).json({ success: true, message: 'Le paiement possède déjà ce statut.', data: p });
        }

        await appliquerStatut(p, statut, { motif }, t);
        await t.commit();

        // Notifications APRÈS commit (non bloquantes)
        if (statut === 'valide' && p.fournisseurId) {
            const f = (n) => Number(n).toLocaleString('fr-FR') + ' FCFA';
            if (p.typePaiement === 'COMMANDE') {
                notifierFournisseur(p.fournisseurId, 'Nouvelle vente 🛒',
                    `Un client a acheté. Total ${f(p.montant)} · commission Kanari ${f(p.commissionKanari)} · votre net ${f(p.montantNet)}`);
            } else if (p.typePaiement === 'MISSION') {
                notifierFournisseur(p.fournisseurId, 'Mission payée ✅',
                    `Total ${f(p.montant)} · commission ${f(p.commissionKanari)} · crédité ${f(p.montantNet)}`);
            } else {
                notifierFournisseur(p.fournisseurId, 'Commission reçue ✅',
                    `Votre dépôt de ${f(p.montant)} a bien été validé.`);
            }
        }

        return res.status(200).json({ success: true, message: `Paiement mis à jour : ${statut}.`, data: p });
    } catch (e) {
        if (!t.finished) await t.rollback();
        return reponseErreur(res, e, 'updateStatutPaiement');
    }
};

// ═══════════════════════════════════════════════════════════
// 8. Vue prestataire : total, commission Kanari et net
// ═══════════════════════════════════════════════════════════
exports.getPaiementsFournisseur = async (req, res) => {
    try {
        const profil = await Fournisseur.findOne({ where: { userId: req.user.id }, attributes: ['id'] });
        if (!profil) throw new ErreurPaiement(403, 'Profil prestataire introuvable.');

        const data = await Paiement.findAll({
            where: { fournisseurId: profil.id, typePaiement: { [Op.ne]: 'COMMISSION' }, statut: 'valide' },
            order: [['createdAt', 'DESC']]
        });
        const somme = (k) => data.reduce((s, p) => s + Number(p[k]), 0);
        return res.json({
            success: true,
            data,
            totaux: { total: somme('montant'), commission: somme('commissionKanari'), net: somme('montantNet') }
        });
    } catch (e) { return reponseErreur(res, e, 'getPaiementsFournisseur'); }
};

// ═══════════════════════════════════════════════════════════
// 9. CLIENT : situation financière, mission par mission
//    1 mission = 1 bon (prix final) = 1 paiement. Le « devis » n'est qu'une estimation.
// ═══════════════════════════════════════════════════════════
exports.getClientMissions = async (req, res) => {
    try {
        const reservations = await Reservation.findAll({
            where: { clientId: req.user.id },
            attributes: ['id', 'serviceNom', 'statut', 'modePaiement', 'fournisseurId', 'createdAt'],
            include: [
                { model: BonIntervention, as: 'bonIntervention', required: false },
                { model: Paiement, as: 'paiements', required: false, where: { typePaiement: 'MISSION' } }
            ],
            order: [['createdAt', 'DESC']]
        });

        const data = reservations.map((r) => {
            const bon = r.bonIntervention;
            const pays = [...(r.paiements || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const paiement = pays.find((p) => ['valide', 'en_attente'].includes(p.statut)) || pays[0] || null;
            const direct = MODES_DIRECTS.includes(r.modePaiement);
            const montant = bon
                ? Number(bon.montantFinal ?? (Number(bon.montantMainOeuvre || 0) + Number(bon.montantPiecesOutils || 0)))
                : null;

            let etat;
            if (r.statut === 'ANNULEE') etat = 'annulee';
            else if (!bon) etat = 'sans_bon';
            else if (!(bon.valide || bon.valideParAdmin)) etat = 'bon_a_valider';
            else if (paiement?.statut === 'valide') etat = 'paye';
            else if (paiement?.statut === 'en_attente') etat = 'en_attente';
            else if (direct) etat = 'direct';
            else if (paiement?.statut === 'rejete') etat = 'rejete';
            else if (paiement?.statut === 'rembourse') etat = 'rembourse';
            else etat = 'a_payer';

            return {
                reservationId: r.id,
                serviceNom: r.serviceNom,
                statutMission: r.statut,
                modePaiement: r.modePaiement,
                montant,
                mainOeuvre: bon ? Number(bon.montantMainOeuvre || 0) : null,
                pieces: bon ? Number(bon.montantPiecesOutils || 0) : null,
                etat,
                paiement: paiement ? {
                    id: paiement.id, statut: paiement.statut, transactionId: paiement.transactionId,
                    modePaiement: paiement.modePaiement, referenceClient: paiement.referenceClient,
                    motif: paiement.motif, date: paiement.confirmationDate || paiement.createdAt
                } : null
            };
        });

        const somme = (etat) => data.filter((x) => x.etat === etat).reduce((s, x) => s + (x.montant || 0), 0);
        const commandesPayees = Number(await Paiement.sum('montant', {
            where: { clientId: req.user.id, typePaiement: 'COMMANDE', statut: 'valide' }
        })) || 0;

        return res.json({
            success: true,
            data,
            totaux: { paye: somme('paye') + commandesPayees, enAttente: somme('en_attente'), aPayer: somme('a_payer') }
        });
    } catch (e) { return reponseErreur(res, e, 'getClientMissions'); }
};

// ═══════════════════════════════════════════════════════════
// 10. PRESTATAIRE : portefeuille (solde, encaissements, commissions dues + retard)
//     Le retard est calculé à la lecture (date limite dépassée) : aucun cron nécessaire.
// ═══════════════════════════════════════════════════════════
exports.getPortefeuilleFournisseur = async (req, res) => {
    try {
        const profil = await Fournisseur.findOne({ where: { userId: req.user.id }, attributes: ['id'] });
        if (!profil) throw new ErreurPaiement(403, 'Profil prestataire introuvable.');
        const fid = profil.id;

        const solde = await Solde.findOne({ where: { fournisseurId: fid } });
        const paiements = await Paiement.findAll({
            where: { fournisseurId: fid, typePaiement: { [Op.in]: ['COMMANDE', 'MISSION'] }, statut: { [Op.in]: ['valide', 'en_attente'] } },
            order: [['createdAt', 'DESC']], limit: 300
        });
        const ligne = (p) => ({
            id: p.id, type: p.typePaiement, commandeId: p.commandeId, reservationId: p.reservationId,
            montant: Number(p.montant), commission: Number(p.commissionKanari), net: Number(p.montantNet),
            taux: Number(p.tauxCommission), statut: p.statut, modePaiement: p.modePaiement,
            transactionId: p.transactionId, date: p.confirmationDate || p.createdAt
        });
        const encaissements = paiements.filter((p) => p.statut === 'valide').map(ligne);
        const enAttente = paiements.filter((p) => p.statut === 'en_attente').map(ligne);

        // Missions réglées directement au prestataire : il doit sa commission à Kanari
        const directes = await Reservation.findAll({
            where: { fournisseurId: fid, modePaiement: { [Op.in]: MODES_DIRECTS }, commissionStatut: { [Op.in]: ['en_attente', 'en_retard'] } },
            attributes: ['id', 'serviceNom', 'commissionStatut', 'commissionDateLimite'],
            include: [{
                model: BonIntervention, as: 'bonIntervention', required: true,
                where: { [Op.or]: [{ valide: true }, { valideParAdmin: true }] }
            }]
        });
        const depots = await Paiement.findAll({
            where: { fournisseurId: fid, typePaiement: 'COMMISSION', statut: 'en_attente' }, attributes: ['reservationId']
        });
        const enVerification = new Set(depots.map((d) => d.reservationId));
        const maintenant = Date.now();

        const commissionsDues = directes
            .map((r) => {
                const bon = r.bonIntervention;
                const limite = r.commissionDateLimite ? new Date(r.commissionDateLimite) : null;
                const retard = r.commissionStatut === 'en_retard' || (!!limite && limite.getTime() < maintenant);
                return {
                    reservationId: r.id, serviceNom: r.serviceNom,
                    montantMission: Number(bon.montantFinal || 0), commission: commissionDuBon(bon),
                    dateLimite: limite, retard,
                    joursRetard: retard && limite ? Math.max(1, Math.ceil((maintenant - limite.getTime()) / 86400000)) : 0,
                    depotEnVerification: enVerification.has(r.id)
                };
            })
            .filter((c) => c.commission > 0)
            .sort((a, b) => Number(b.retard) - Number(a.retard));

        const somme = (arr, k) => arr.reduce((s, x) => s + x[k], 0);
        return res.json({
            success: true,
            totaux: {
                solde: Number(solde?.solde || 0), totalGagne: Number(solde?.totalGagne || 0), totalRetire: Number(solde?.totalRetire || 0),
                brut: somme(encaissements, 'montant'), commission: somme(encaissements, 'commission'), net: somme(encaissements, 'net'),
                enAttenteNet: somme(enAttente, 'net'),
                commissionsDues: somme(commissionsDues, 'commission'),
                commissionsEnRetard: somme(commissionsDues.filter((c) => c.retard), 'commission')
            },
            encaissements, enAttente, commissionsDues
        });
    } catch (e) { return reponseErreur(res, e, 'getPortefeuilleFournisseur'); }
};