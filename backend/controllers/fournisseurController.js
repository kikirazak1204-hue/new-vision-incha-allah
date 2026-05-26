const { Fournisseur, User, Service, Produit, Facture, Commande } = require('../models');

// ── 🔹 Récupérer le fournisseur connecté
const getFournisseurConnecte = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: 'Non authentifié.' });
        }

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

        if (!fournisseur) {
            return res.status(404).json({ success: false, message: 'Profil fournisseur introuvable.' });
        }

        return res.status(200).json({ success: true, data: fournisseur });
    } catch (err) {
        console.error('❌ Erreur getFournisseurConnecte:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération du profil.' });
    }
};

// ── 🔹 Créer un fournisseur (Inscription prestataires)
const createFournisseur = async (req, res) => {
    try {
        const {
            nomEntreprise, adresse, quartier, userId, serviceId, secteur,
            telephone, description, hasTransport, hasMateriel
        } = req.body;

        if (!userId || !serviceId) {
            return res.status(400).json({ success: false, message: 'Les champs userId et serviceId sont obligatoires.' });
        }

        // ✅ Récupération sécurisée des fichiers Multer
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
            statut: 'EN_ATTENTE', // Standardisation de la validation admin
            cniRecto, cniVerso, selfie, diplome, carteProf
        });

        return res.status(201).json({ success: true, data: fournisseur });
    } catch (err) {
        console.error('❌ Erreur createFournisseur:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la création du profil fournisseur.' });
    }
};

// ── 🔹 Ajouter un produit au catalogue fournisseur
const ajouterProduit = async (req, res) => {
    try {
        const { nom, description, prix, stock } = req.body;

        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) {
            return res.status(404).json({ success: false, message: 'Fournisseur non trouvé pour cet utilisateur.' });
        }

        const produit = await Produit.create({
            nom,
            description,
            prix: parseFloat(prix) || 0,
            stock: parseInt(stock) || 0,
            fournisseurId: fournisseur.id
        });

        return res.status(201).json({ success: true, data: produit });
    } catch (err) {
        console.error('❌ Erreur ajouterProduit:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'ajout du produit.' });
    }
};

// ── 🔹 Récupérer tous les fournisseurs (Vue Admin globale)
const getAllFournisseurs = async (req, res) => {
    try {
        const fournisseurs = await Fournisseur.findAll({
            include: [
                { model: User, as: 'userFournisseur', attributes: ['nom', 'prenom', 'email', 'telephone'] },
                { model: Service, as: 'serviceFournisseur' }
            ]
        });
        return res.status(200).json({ success: true, count: fournisseurs.length, data: fournisseurs });
    } catch (err) {
        console.error('❌ Erreur getAllFournisseurs:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération de la liste globale.' });
    }
};

// ── 🔹 Récupérer les fournisseurs par service (Filtre Frontend avec nouveaux champs)
const getFournisseursParService = async (req, res) => {
    try {
        const serviceId = parseInt(req.params.id);
        if (isNaN(serviceId)) {
            return res.status(400).json({ success: false, message: 'ID de service invalide.' });
        }

        const fournisseurs = await Fournisseur.findAll({
            where: {
                serviceId,
                statut: ['EN_ATTENTE', 'EN_EVALUATION', 'CONFORME'] // Filtre de sécurité : Exclut les profils 'SUSPENDU'
            },
            attributes: [
                'id', 'nomEntreprise', 'adresse', 'quartier', 'secteur',
                'telephone', 'description', 'note', 'nombreAvis',
                'statut', 'hasTransport', 'hasMateriel', 'latitude', 'longitude'
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

        return res.status(200).json({ success: true, data: fournisseurs });
    } catch (err) {
        console.error('❌ Erreur getFournisseursParService:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors du filtrage par service.' });
    }
};

module.exports = {
    getFournisseurConnecte,
    createFournisseur,
    ajouterProduit,
    getAllFournisseurs,
    getFournisseursParService
};