const { Fournisseur, User, Service, Produit, Facture, Commande, Reservation } = require('../models');

// ── Récupérer le fournisseur connecté
const getFournisseurConnecte = async (req, res) => {
    try {
        if (!req.user?.id) return res.status(401).json({ success: false, message: 'Non authentifié' });

        const fournisseur = await Fournisseur.findOne({
            where: { userId: req.user.id },
            include: [
                { model: Service, as: 'serviceFournisseur' },
                { model: Produit, as: 'produitsFournisseur' },
                { model: User, as: 'userFournisseur', attributes: ['id', 'nom', 'prenom', 'ville', 'email', 'telephone'] },
                {
                    model: Facture, as: 'facturesFournisseur',
                    include: [
                        { model: Commande, as: 'factureCommande' },
                        { model: User, as: 'factureClient' }
                    ]
                }
            ]
        });

        if (!fournisseur) return res.status(404).json({ success: false, message: 'Fournisseur non trouvé' });
        res.json({ success: true, data: fournisseur });
    } catch (err) {
        console.error('❌ getFournisseurConnecte:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
};

// ── Créer un fournisseur
const createFournisseur = async (req, res) => {
    try {
        const {
            nomEntreprise, adresse, quartier, userId, serviceId, secteur,
            telephone, description, hasTransport, hasMateriel
        } = req.body;

        if (!userId || !serviceId) return res.status(400).json({ success: false, message: 'userId et serviceId requis' });

        // ✅ Documents uploadés via multer
        const cniRecto = req.files?.cniRecto?.[0]?.filename || null;
        const cniVerso = req.files?.cniVerso?.[0]?.filename || null;
        const selfie = req.files?.selfie?.[0]?.filename || null;
        const diplome = req.files?.diplome?.[0]?.filename || null;
        const carteProf = req.files?.carteProf?.[0]?.filename || null;

        const fournisseur = await Fournisseur.create({
            nomEntreprise, adresse, quartier, secteur,
            telephone, description,
            hasTransport: hasTransport === 'true' || hasTransport === true,
            hasMateriel: hasMateriel === 'true' || hasMateriel === true,
            userId, serviceId,
            statut: 'EN_ATTENTE',
            cniRecto, cniVerso, selfie, diplome, carteProf
        });

        res.status(201).json({ success: true, data: fournisseur });
    } catch (err) {
        console.error('❌ createFournisseur:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
};

// ── Ajouter un produit
const ajouterProduit = async (req, res) => {
    try {
        const { nom, description, prix, stock } = req.body;
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(404).json({ success: false, message: 'Fournisseur non trouvé' });

        const produit = await Produit.create({ nom, description, prix, stock, fournisseurId: fournisseur.id });
        res.status(201).json({ success: true, data: produit });
    } catch (err) {
        console.error('❌ ajouterProduit:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
};

// ── Récupérer tous les fournisseurs
const getAllFournisseurs = async (req, res) => {
    try {
        const fournisseurs = await Fournisseur.findAll({
            include: [
                { model: User, as: 'userFournisseur', attributes: ['nom', 'prenom', 'email', 'telephone'] },
                { model: Service, as: 'serviceFournisseur' }
            ]
        });
        res.json({ success: true, count: fournisseurs.length, data: fournisseurs });
    } catch (err) {
        console.error('❌ getAllFournisseurs:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
};

// ── ✅ Récupérer fournisseurs par service — avec TOUS les nouveaux champs
const getFournisseursParService = async (req, res) => {
    try {
        const serviceId = parseInt(req.params.id);

        const fournisseurs = await Fournisseur.findAll({
            where: {
                serviceId,
                statut: ['EN_ATTENTE', 'EN_EVALUATION', 'CONFORME'] // ✅ exclut SUSPENDU
            },
            attributes: [
                'id', 'nomEntreprise', 'adresse', 'quartier', 'secteur',
                'telephone', 'description', 'note', 'nombreAvis',
                'statut',           // ✅ nouveau
                'hasTransport',     // ✅ nouveau
                'hasMateriel',      // ✅ nouveau
                'latitude',         // ✅ nouveau
                'longitude',        // ✅ nouveau
            ],
            include: [
                {
                    model: Produit, as: 'produitsFournisseur',
                    attributes: ['id', 'nom', 'description', 'prix', 'image']
                },
                {
                    model: User, as: 'userFournisseur',
                    attributes: ['nom', 'telephone']
                }
            ]
        });

        res.json({ success: true, data: fournisseurs });
    } catch (err) {
        console.error('❌ getFournisseursParService:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
};

module.exports = {
    getFournisseurConnecte,
    createFournisseur,
    ajouterProduit,
    getAllFournisseurs,
    getFournisseursParService
};