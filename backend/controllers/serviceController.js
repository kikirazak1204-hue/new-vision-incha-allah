const { Service, Fournisseur, Produit, User } = require('../models');

// ── GET /api/services — Liste de tous les services ───────
exports.getAllServices = async (req, res) => {
    try {
        const services = await Service.findAll({
            order: [['nom', 'ASC']]
        });
        return res.status(200).json({ success: true, data: services });
    } catch (err) {
        console.error('❌ Erreur getAllServices:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération des services.' });
    }
};

// ── GET /api/services/:id — Détail d'un service ──────────
exports.getServiceById = async (req, res) => {
    try {
        const serviceId = parseInt(req.params.id);
        if (isNaN(serviceId)) {
            return res.status(400).json({ success: false, message: 'ID de service invalide.' });
        }

        const service = await Service.findByPk(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service introuvable.' });
        }

        return res.status(200).json({ success: true, data: service });
    } catch (err) {
        console.error('❌ Erreur getServiceById:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── GET /api/services/:id/fournisseurs — Prestataires d'un service ──
exports.getFournisseursParService = async (req, res) => {
    try {
        const serviceId = parseInt(req.params.id);
        if (isNaN(serviceId)) {
            return res.status(400).json({ success: false, message: 'ID de service invalide.' });
        }

        const fournisseurs = await Fournisseur.findAll({
            where: {
                serviceId,
                statut: ['EN_ATTENTE', 'EN_EVALUATION', 'CONFORME']
            },
            attributes: [
                'id', 'nomEntreprise', 'adresse', 'quartier', 'secteur',
                'telephone', 'description', 'note', 'nombreAvis',
                'statut', 'hasTransport', 'hasMateriel', 'latitude', 'longitude',
                'codeUnique'
            ],
            include: [
                { model: Produit, as: 'produitsFournisseur', attributes: ['id', 'nom', 'description', 'prix', 'image'] },
                { model: User, as: 'userFournisseur', attributes: ['nom', 'telephone'] }
            ]
        });

        return res.status(200).json({ success: true, data: fournisseurs });
    } catch (err) {
        console.error('❌ Erreur getFournisseursParService:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors du filtrage par service.' });
    }
};