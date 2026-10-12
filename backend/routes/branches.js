const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { Service, ServiceBranche, Fournisseur, FournisseurBranche } = require('../models');

// PUBLIC : services avec leurs branches actives
router.get('/', async (req, res) => {
    try {
        const where = req.query.serviceId ? { id: req.query.serviceId } : {};
        const services = await Service.findAll({
            where,
            include: [{ model: ServiceBranche, as: 'branches', where: { actif: true }, required: false }],
            order: [['nom', 'ASC'], [{ model: ServiceBranche, as: 'branches' }, 'nom', 'ASC']]
        });
        res.json({ success: true, data: services });
    } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur.' }); }
});

// PRESTATAIRE : définir ses branches  { brancheIds: [..] }
router.put('/mes', protect, async (req, res) => {
    try {
        const f = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!f) return res.status(403).json({ success: false, message: 'Profil prestataire introuvable.' });
        const ids = [...new Set((req.body.brancheIds || []).map(Number).filter(Number.isFinite))];
        const valides = await ServiceBranche.findAll({ where: { id: ids, actif: true }, attributes: ['id'] });
        await FournisseurBranche.destroy({ where: { fournisseurId: f.id } });
        await FournisseurBranche.bulkCreate(valides.map((b) => ({ fournisseurId: f.id, brancheId: b.id })));
        res.json({ success: true, count: valides.length });
    } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur.' }); }
});

// ADMIN : créer / modifier un service
router.post('/admin/service', protect, adminOnly, async (req, res) => {
    try {
        const { nom, emoji, description, categorie } = req.body;
        if (!nom || !nom.trim()) return res.status(400).json({ success: false, message: 'Nom obligatoire.' });
        const [s, cree] = await Service.findOrCreate({
            where: { nom: nom.trim() },
            defaults: { emoji: emoji || null, description: description || null, categorie: categorie || 'default' }
        });
        if (!cree) return res.status(409).json({ success: false, message: 'Ce service existe déjà.' });
        res.status(201).json({ success: true, data: s });
    } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur.' }); }
});

router.put('/admin/service/:id', protect, adminOnly, async (req, res) => {
    try {
        const s = await Service.findByPk(req.params.id);
        if (!s) return res.status(404).json({ success: false, message: 'Service introuvable.' });
        const maj = {};
        ['nom', 'emoji', 'description', 'categorie'].forEach((c) => { if (req.body[c] !== undefined) maj[c] = req.body[c]; });
        await s.update(maj);
        res.json({ success: true, data: s });
    } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur.' }); }
});

// ADMIN : branches
router.post('/admin/branche', protect, adminOnly, async (req, res) => {
    try {
        const { serviceId, nom } = req.body;
        if (!serviceId || !nom || !nom.trim()) return res.status(400).json({ success: false, message: 'Service et nom obligatoires.' });
        const [b, cree] = await ServiceBranche.findOrCreate({ where: { serviceId, nom: nom.trim() }, defaults: { actif: true } });
        if (!cree && !b.actif) await b.update({ actif: true });
        res.status(201).json({ success: true, data: b });
    } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur.' }); }
});

router.put('/admin/branche/:id', protect, adminOnly, async (req, res) => {
    try {
        const b = await ServiceBranche.findByPk(req.params.id);
        if (!b) return res.status(404).json({ success: false, message: 'Branche introuvable.' });
        const maj = {};
        if (req.body.nom !== undefined) maj.nom = String(req.body.nom).trim();
        if (req.body.actif !== undefined) maj.actif = !!req.body.actif;
        await b.update(maj);
        res.json({ success: true, data: b });
    } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur.' }); }
});

// ADMIN : liste complète (y compris branches désactivées)
router.get('/admin/tout', protect, adminOnly, async (req, res) => {
    try {
        const services = await Service.findAll({
            include: [{ model: ServiceBranche, as: 'branches', required: false }],
            order: [['nom', 'ASC'], [{ model: ServiceBranche, as: 'branches' }, 'nom', 'ASC']]
        });
        res.json({ success: true, data: services });
    } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Erreur serveur.' }); }
});

module.exports = router;