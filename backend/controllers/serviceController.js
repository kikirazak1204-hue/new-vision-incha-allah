const { Service, Fournisseur, Produit } = require('../models');

// 🔹 Récupérer tous les services avec leurs fournisseurs et produits
const getAllServices = async (req, res) => {
    try {
        const services = await Service.findAll({
            include: [
                {
                    model: Fournisseur,
                    as: 'fournisseursService',
                    attributes: ['id', 'nomEntreprise', 'adresse']
                }
            ]
        });
        res.status(200).json({ success: true, data: services });
    } catch (err) {
        console.error('Erreur getAllServices:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
};

const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findByPk(id);

        if (!service) {
            return res.status(404).json({ success: false, message: 'Service non trouvé' });
        }

        res.status(200).json({ success: true, data: service });
    } catch (err) {
        console.error('Erreur getServiceById:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
};
const getFournisseursParService = async (req, res) => {
    try {
        const { id } = req.params;

        const fournisseurs = await Fournisseur.findAll({
            where: { serviceId: id },
            attributes: ['id', 'nomEntreprise', 'adresse', 'secteur'],
            include: [
                {
                    model: Produit,
                    as: 'produitsFournisseur',
                    attributes: ['id', 'nom', 'description', 'prix', 'image']
                }
            ]
        });

        res.status(200).json({ success: true, data: fournisseurs });
    } catch (err) {
        console.error('Erreur getFournisseursParService:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
};

module.exports = {
    getAllServices,
    getServiceById,
    getFournisseursParService // ✅ ajouté ici
};