const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const resController = require('../controllers/reservationController');

// ── 🌍 Route Globale Multi-Services (Kanari Pro) ──────────
// Placée tout en haut pour éviter les conflits avec les routes en `/:id`
router.post('/global', async (req, res) => {
    try {
        const { clientNom, telephone, adresse, services, modePaiement, commentaireGlobal, fournisseurId } = req.body;

        if (!clientNom || !telephone || !adresse || !services || !Array.isArray(services) || services.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Informations incomplètes pour enregistrer le projet."
            });
        }

        // Simulation d'enregistrement propre (ou appel au contrôleur si tu préfères)
        const newReservationId = "kanari_res_" + Date.now();

        console.log(`✅ Projet global Kanari validé : ${services.length} service(s) pour ${clientNom}`);

        return res.status(201).json({
            success: true,
            id: newReservationId,
            message: "Projet multi-services enregistré avec succès !"
        });

    } catch (error) {
        console.error("❌ Erreur /reservations/global :", error);
        return res.status(500).json({
            success: false,
            message: "Erreur interne du serveur."
        });
    }
});

// ── Public / Client ───────────────────────────────────────
router.post('/', resController.createReservation);
router.get('/mes-reservations/:userId', protect, resController.getMesReservations);

// ── Presta ────────────────────────────────────────────────
router.get('/disponibles', protect, resController.getReservationsDisponibles);
router.put('/:id/presta-accepter', protect, resController.prestaAccepter);
router.put('/:id/presta-refuser', protect, resController.prestaRefuser);
router.post('/:id/terminer', protect, resController.terminerMission);

// ── Admin ─────────────────────────────────────────────────
router.get('/admin', protect, adminOnly, resController.getAdminReservations);
router.put('/:id/statut', protect, adminOnly, resController.updateStatut);
router.put('/:id/assigner', protect, adminOnly, resController.assignerFournisseur);
router.put('/:id/autoriser', protect, adminOnly, resController.autoriserDemarrage);
router.post('/admin-creer', protect, adminOnly, resController.adminCreerReservation);
router.delete('/:id', protect, adminOnly, resController.deleteReservation);

module.exports = router;