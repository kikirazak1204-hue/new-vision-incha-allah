const { Service, Fournisseur, Produit } = require('../models');

// 🔹 Récupérer tous les services avec leurs fournisseurs
const getAllServices = async (req, res) => {
    try {
        const services = await Service.findAll({
            include: [
                {
                    model: Fournisseur,
                    as: 'fournisseursService', // ⚠️ Doit correspondre à l'alias du modèle Service
                    attributes: ['id', 'nomEntreprise', 'adresse']
                }
            ]
        });
        return res.status(200).json({ success: true, data: services });
    } catch (err) {
        console.error('❌ Erreur getAllServices:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération des services.' });
    }
};

// 🔹 Récupérer un service par son ID unique
const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const service = await Service.findByPk(id);

        if (!service) {
            return res.status(404).json({ success: false, message: 'Service introuvable.' });
        }

        return res.status(200).json({ success: true, data: service });
    } catch (err) {
        console.error('❌ Erreur getServiceById:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération du service.' });
    }
};

// 🔹 Récupérer les fournisseurs liés à un service spécifique
const getFournisseursParService = async (req, res) => {
    try {
        const { id } = req.params;

        const fournisseurs = await Fournisseur.findAll({
            where: { serviceId: id },
            attributes: ['id', 'nomEntreprise', 'adresse', 'secteur'],
            include: [
                {
                    model: Produit,
                    as: 'produitsFournisseur', // ⚠️ Doit correspondre à l'alias du modèle Fournisseur
                    attributes: ['id', 'nom', 'description', 'prix', 'image']
                }
            ]
        });

        return res.status(200).json({ success: true, data: fournisseurs });
    } catch (err) {
        console.error('❌ Erreur getFournisseursParService:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération des fournisseurs.' });
    }
};

module.exports = {
    getAllServices,
    getServiceById,
    getFournisseursParService
};