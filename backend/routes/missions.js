// routes/missions.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Reservation, Fournisseur, User } = require('../models');

// ── Middleware — vérifie que le fournisseur est propriétaire de la mission
const checkFournisseur = async (req, res, next) => {
    try {
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(403).json({ success: false, message: 'Profil fournisseur introuvable.' });
        req.fournisseur = fournisseur;
        next();
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── PUT /api/missions/:id/accepter — Fournisseur accepte la mission
router.put('/:id/accepter', protect, checkFournisseur, async (req, res) => {
    try {
        const mission = await Reservation.findOne({
            where: { id: req.params.id, fournisseurId: req.fournisseur.id }
        });
        if (!mission) return res.status(404).json({ success: false, message: 'Mission introuvable.' });
        if (mission.statut !== 'EN_ATTENTE') return res.status(400).json({ success: false, message: 'Mission non modifiable.' });

        await mission.update({ statut: 'ACCEPTEE' });
        res.json({ success: true, message: 'Mission acceptée.', data: mission });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── PUT /api/missions/:id/demarrer — Fournisseur démarre la mission
router.put('/:id/demarrer', protect, checkFournisseur, async (req, res) => {
    try {
        const mission = await Reservation.findOne({
            where: { id: req.params.id, fournisseurId: req.fournisseur.id }
        });
        if (!mission) return res.status(404).json({ success: false, message: 'Mission introuvable.' });

        await mission.update({ statut: 'EN_COURS' });
        res.json({ success: true, message: 'Mission démarrée.', data: mission });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── PUT /api/missions/:id/terminer — Fournisseur marque la mission terminée
router.put('/:id/terminer', protect, checkFournisseur, async (req, res) => {
    try {
        const mission = await Reservation.findOne({
            where: { id: req.params.id, fournisseurId: req.fournisseur.id }
        });
        if (!mission) return res.status(404).json({ success: false, message: 'Mission introuvable.' });
        if (mission.statut !== 'EN_COURS') return res.status(400).json({ success: false, message: 'Mission non en cours.' });

        await mission.update({ statut: 'TERMINEE' });
        res.json({ success: true, message: 'Mission terminée. En attente de validation client.', data: mission });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── PUT /api/missions/:id/valider — CLIENT valide la prestation → libère Escrow
router.put('/:id/valider', protect, async (req, res) => {
    try {
        const mission = await Reservation.findOne({
            where: { id: req.params.id, clientId: req.user.id }
        });
        if (!mission) return res.status(404).json({ success: false, message: 'Mission introuvable.' });
        if (mission.statut !== 'TERMINEE') return res.status(400).json({ success: false, message: 'La mission n\'est pas encore terminée.' });

        await mission.update({
            statut: 'VALIDEE',
            paiementLibere: true
        });

        // ✅ Ici on pourrait déclencher le virement au fournisseur
        // via Mobile Money API (Orange Money, Wave, etc.)

        res.json({ success: true, message: 'Prestation validée. Paiement libéré au prestataire.', data: mission });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ── PUT /api/missions/:id/materiel — Fournisseur signale manque matériel
router.put('/:id/materiel', protect, checkFournisseur, async (req, res) => {
    try {
        const { descriptionMateriel } = req.body;
        if (!descriptionMateriel) return res.status(400).json({ success: false, message: 'Description manquante.' });

        const mission = await Reservation.findOne({
            where: { id: req.params.id, fournisseurId: req.fournisseur.id }
        });
        if (!mission) return res.status(404).json({ success: false, message: 'Mission introuvable.' });

        await mission.update({
            statut: 'EN_PREPARATION',
            manqueMateriel: true,
            descriptionMateriel
        });

        // ✅ Ici on notifie l'admin New Vision pour contacter fournisseur matériel
        console.log(`🔧 Manque matériel signalé — Mission #${mission.id}: ${descriptionMateriel}`);

        res.json({ success: true, message: 'Signalement envoyé. New Vision va contacter un partenaire.', data: mission });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;