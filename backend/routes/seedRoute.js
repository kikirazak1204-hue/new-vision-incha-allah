const express = require('express');
const router = express.Router();
const { Service } = require('../models');

router.get('/run-seed', async (req, res) => {
    const services = [
        { nom: 'Plomberie', emoji: '🚰', description: 'Fuite, robinet, tuyauterie, installation sanitaire.', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
        { nom: 'Électricité', emoji: '🔌', description: 'Panne de courant, installation, tableau électrique.', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400' },
        { nom: 'Mécanique', emoji: '🚗', description: 'Panne de voiture, entretien, réparation moteur.', image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400' },
        { nom: 'Taxi', emoji: '🚕', description: 'Déplacement, livraison, taxi à domicile.', image: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=400' },
        { nom: 'Climatisation', emoji: '❄️', description: 'Installation, entretien et dépannage de climatiseur.', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400' },
    ];

    try {
        for (const s of services) {
            await Service.findOrCreate({ where: { nom: s.nom }, defaults: s });
        }
        res.json({ success: true, message: '🎉 Services insérés !' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;