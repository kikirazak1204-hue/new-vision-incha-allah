const { Fournisseur, User, Service, Produit, Facture, Commande } = require('../models');

// ── Récupérer le fournisseur connecté ────────────────────
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
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── Créer un fournisseur (inscription prestataire) ───────
const createFournisseur = async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId;
        const {
            serviceId, nomEntreprise, telephone, adresse, quartier, secteur,
            description, hasTransport, hasMateriel,
            anneesExperience, saitLireEcrire, referenceClient, immatriculation
        } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Utilisateur non authentifié.' });
        }
        if (!serviceId || !nomEntreprise) {
            return res.status(400).json({ success: false, message: 'Les champs userId et serviceId sont obligatoires.' });
        }

        // Vérifie qu'un profil n'existe pas déjà pour cet utilisateur
        const exist = await Fournisseur.findOne({ where: { userId } });
        if (exist) {
            return res.status(409).json({ success: false, message: 'Vous avez déjà un profil prestataire.' });
        }

        // Fichiers uploadés
        const cniRecto      = req.files?.cniRecto?.[0]?.filename || null;
        const cniVerso      = req.files?.cniVerso?.[0]?.filename || null;
        const selfie        = req.files?.selfie?.[0]?.filename || null;
        const diplome       = req.files?.diplome?.[0]?.filename || null;
        const photoVehicule = req.files?.photoVehicule?.[0]?.filename || null;
        const carteProf     = req.files?.carteProf?.[0]?.filename || null;

        const fournisseur = await Fournisseur.create({
            userId,
            serviceId: parseInt(serviceId),
            nomEntreprise,
            adresse,
            quartier,
            secteur,
            telephone,
            description,
            hasTransport: hasTransport === 'true' || hasTransport === true,
            hasMateriel: hasMateriel === 'true' || hasMateriel === true,
            statut: 'EN_ATTENTE',
            // Documents
            cniRecto,
            cniVerso,
            selfie,
            diplome,
            carteProf,
            // Champs enrichis inscription
            anneesExperience: anneesExperience || null,
            saitLireEcrire: saitLireEcrire || null,
            referenceClient: referenceClient || null,
            immatriculation: immatriculation || null,
            // codeUnique généré automatiquement par le hook beforeCreate du modèle
        });

        return res.status(201).json({
            success: true,
            message: 'Inscription reçue, en attente de validation.',
            data: fournisseur
        });
    } catch (err) {
        console.error('❌ Erreur createFournisseur:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la création du profil fournisseur.' });
    }
};

// ── Ajouter un produit ────────────────────────────────────
const ajouterProduit = async (req, res) => {
    try {
        const { nom, description, prix, stock } = req.body;
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) {
            return res.status(404).json({ success: false, message: 'Fournisseur non trouvé.' });
        }
        const produit = await Produit.create({
            nom, description,
            prix: parseFloat(prix) || 0,
            stock: parseInt(stock) || 0,
            fournisseurId: fournisseur.id
        });
        return res.status(201).json({ success: true, data: produit });
    } catch (err) {
        console.error('❌ Erreur ajouterProduit:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── Récupérer tous les fournisseurs ──────────────────────
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
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

// ── Récupérer fournisseurs par service ───────────────────
const getFournisseursParService = async (req, res) => {
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
                'statut', 'hasTransport', 'hasMateriel', 'latitude', 'longitude'
            ],
            include: [
                { model: Produit, as: 'produitsFournisseur', attributes: ['id', 'nom', 'description', 'prix', 'image'] },
                { model: User, as: 'userFournisseur', attributes: ['nom', 'telephone'] }
            ]
        });
        return res.status(200).json({ success: true, data: fournisseurs });
    } catch (err) {
        console.error('❌ Erreur getFournisseursParService:', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

module.exports = {
    getFournisseurConnecte,
    createFournisseur,
    ajouterProduit,
    getAllFournisseurs,
    getFournisseursParService
};