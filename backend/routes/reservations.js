const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const resController = require('../controllers/reservationController');
const { Reservation } = require('../models'); // 💾 Importation de la BDD

// ── 🌍 Route Globale Multi-Services (Kanari Pro) ──────────
// Placée tout en haut pour éviter les conflits avec les routes en `/:id`
router.post('/global', async (req, res) => {
    try {
        const {
            clientNom,
            telephone,
            adresse,
            dateIntervention,
            services,
            modePaiement,
            commentaireGlobal,
            fournisseurId
        } = req.body;

        if (!clientNom || !telephone || !adresse || !services || !Array.isArray(services) || services.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Informations incomplètes pour enregistrer le projet."
            });
        }

        // 💾 SAUVEGARDE RÉELLE DANS LA BASE DE DONNÉES MYSQL
        const nouvelleReservation = await Reservation.create({
            clientNom,
            telephone,
            adresse,
            dateIntervention: dateIntervention || new Date(),
            modePaiement: modePaiement || 'direct_prestataire',
            commentaireGlobal: commentaireGlobal || '',
            fournisseurId: fournisseurId || null,
            // Conversion en string JSON si votre colonne MySQL est de type TEXT/VARCHAR/JSON
            services: typeof services === 'object' ? JSON.stringify(services) : services,
            statut: 'en_attente'
        });

        console.log(`✅ Projet global Kanari VRAIMENT enregistré en BDD - ID #${nouvelleReservation.id} pour ${clientNom}`);

        return res.status(201).json({
            success: true,
            id: nouvelleReservation.id,
            message: "Projet multi-services enregistré avec succès en BDD !",
            reservation: nouvelleReservation
        });

    } catch (error) {
        console.error("❌ Erreur /reservations/global :", error);
        return res.status(500).json({
            success: false,
            message: "Erreur lors de la sauvegarde en BDD.",
            error: error.message
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