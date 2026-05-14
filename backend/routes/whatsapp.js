const express = require('express');
const router = express.Router();

// 📱 Routes WhatsApp désactivées temporairement
// À activer quand vous êtes prêt à scanner le QR code

router.get('/qr-code', (req, res) => {
    res.json({ 
        success: false,
        message: 'WhatsApp temporairement désactivé. Contactez l\'admin pour activer.'
    });
});

router.get('/whatsapp-status', (req, res) => {
    res.json({
        connected: false,
        message: '⏳ WhatsApp: Modules en cours de configuration'
    });
});

module.exports = router;
