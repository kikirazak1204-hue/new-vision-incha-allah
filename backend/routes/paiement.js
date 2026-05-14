const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
// const { Paiement, Reservation } = require('../models'); // À décommenter quand tes modèles seront prêts

// ── POST /api/paiements/mobile-money
router.post('/mobile-money', protect, async (req, res) => {
    try {
        const { reservationId, montant, telephone, reseau, type } = req.body;

        // 1. Validation des champs obligatoires
        if (!reservationId || !montant || !telephone || !reseau) {
            return res.status(400).json({
                success: false,
                message: "Informations de paiement manquantes (ID, Montant, Téléphone ou Réseau)."
            });
        }

        // 2. Logique métier (Simulation de préparation de transaction)
        console.log(`[PAYMENT_INIT] Client ID: ${req.user.id} | Mission: ${reservationId} | Montant: ${montant} FCFA`);

        // Ici, tu intégreras le SDK de ton choix (ex: FedaPay, Bizao, CinetPay)
        // Exemple de réponse attendue par un frontend de production
        const transactionSimulee = {
            id: "NV-TRX-" + Date.now(),
            statut: "PENDING",
            date: new Date()
        };

        res.status(200).json({
            success: true,
            message: "La demande de paiement a été envoyée avec succès.",
            data: {
                transactionId: transactionSimulee.id,
                instructions: "Veuillez confirmer la transaction sur votre téléphone.",
                montant: montant,
                devise: "XOF"
            }
        });

    } catch (err) {
        console.error('❌ Erreur Paiement Production:', err);
        res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors du traitement du paiement mobile money."
        });
    }
});

module.exports = router;