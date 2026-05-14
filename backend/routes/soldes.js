const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Solde, Retrait, Fournisseur, Reservation, Devis } = require('../models');

const COMMISSION_NV_ACCOMPTE = 150;
const RETOUR_CLIENT = 1350;
const COMMISSION_NV_DEVIS = 0.05;

// ── GET /api/soldes/mien ───────────────────────────────────────
router.get('/mien', protect, authorize('fournisseur'), async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(404).json({ success: false, message: 'Profil introuvable.' });

        let solde = await Solde.findOne({ where: { fournisseurId: fournisseur.id } });
        if (!solde) solde = await Solde.create({ fournisseurId: fournisseur.id });

        const retraits = await Retrait.findAll({
            where: { fournisseurId: fournisseur.id },
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        res.json({ success: true, data: { solde, retraits } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── POST /api/soldes/retrait ───────────────────────────────────
router.post('/retrait', protect, authorize('fournisseur'), async (req, res) => {
    try {
        const { montant, operateur, telephone } = req.body;
        if (!montant || !operateur || !telephone)
            return res.status(400).json({ success: false, message: 'Données manquantes.' });
        if (Number(montant) < 500)
            return res.status(400).json({ success: false, message: 'Montant minimum : 500 FCFA.' });

        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(404).json({ success: false, message: 'Profil introuvable.' });

        let solde = await Solde.findOne({ where: { fournisseurId: fournisseur.id } });
        if (!solde || Number(solde.solde) < Number(montant))
            return res.status(400).json({ success: false, message: 'Solde insuffisant.' });

        await solde.update({
            solde: Number(solde.solde) - Number(montant),
            totalRetire: Number(solde.totalRetire) + Number(montant)
        });

        const retrait = await Retrait.create({ fournisseurId: fournisseur.id, montant, operateur, telephone });
        res.status(201).json({ success: true, data: retrait, nouveauSolde: solde.solde });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── PUT /api/soldes/liberer/:reservationId ─────────────────────
router.put('/liberer/:reservationId', protect, async (req, res) => {
    try {
        const reservation = await Reservation.findByPk(req.params.reservationId, {
            include: [{ model: Devis, as: 'devis', where: { statut: 'ACCEPTE' }, required: false }]
        });
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation introuvable.' });

        const devisAccepte = reservation.devis?.[0];
        if (!devisAccepte) return res.status(400).json({ success: false, message: 'Aucun devis accepté.' });

        const montantDevis = Number(devisAccepte.montant);
        const commissionNV = Math.round(montantDevis * COMMISSION_NV_DEVIS);
        const montantPrestataire = montantDevis - commissionNV;

        let solde = await Solde.findOne({ where: { fournisseurId: reservation.fournisseurId } });
        if (!solde) solde = await Solde.create({ fournisseurId: reservation.fournisseurId });

        await solde.update({
            solde: Number(solde.solde) + montantPrestataire,
            totalGagne: Number(solde.totalGagne) + montantPrestataire
        });

        await reservation.update({ statut: 'VALIDEE', paiementLibere: true });

        res.json({
            success: true,
            montantDevis,
            commissionNV,
            montantPrestataire,
            message: `${montantPrestataire.toLocaleString()} FCFA crédités sur le solde du prestataire.`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── Admin GET /api/soldes/retraits ─────────────────────────────
router.get('/retraits', protect, authorize('admin'), async (req, res) => {
    try {
        const retraits = await Retrait.findAll({
            where: { statut: 'EN_ATTENTE' },
            include: [{ model: Fournisseur, as: 'fournisseurRetrait', attributes: ['nomEntreprise', 'telephone'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: retraits });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── Admin PUT /api/soldes/retraits/:id ─────────────────────────
router.put('/retraits/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { statut } = req.body;
        const retrait = await Retrait.findByPk(req.params.id);
        if (!retrait) return res.status(404).json({ success: false, message: 'Retrait introuvable.' });

        await retrait.update({ statut });

        if (statut === 'REFUSE') {
            const solde = await Solde.findOne({ where: { fournisseurId: retrait.fournisseurId } });
            if (solde) await solde.update({
                solde: Number(solde.solde) + Number(retrait.montant),
                totalRetire: Number(solde.totalRetire) - Number(retrait.montant)
            });
        }

        res.json({ success: true, data: retrait });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;