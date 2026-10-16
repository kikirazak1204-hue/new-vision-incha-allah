const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const Paiement = require('../models/Paiement');
const Commande = require('../models/Commande');
const Reservation = require('../models/Reservation');
const Fournisseur = require('../models/Fournisseur');
const {
    ErreurPaiement, calculerDu, appliquerStatut, notifierFournisseur
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