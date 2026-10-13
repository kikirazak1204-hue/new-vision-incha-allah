const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Fournisseur, User, Reservation, Paiement, Produit, Commande } = require('../models');

// ============================================================
// 🛡️ MIDDLEWARE DE CONTRÔLE ADMIN
// ============================================================
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs.' });
    }
    next();
};

const RESERVATION_STATUS_MAP = {
    EN_ATTENTE: 'EN_ATTENTE',
    ASSIGNEE: 'ASSIGNEE',
    EN_VALIDATION_ADMIN: 'EN_VALIDATION_ADMIN',
    EN_ATTENTE_VALIDATION: 'EN_VALIDATION_ADMIN',
    ACCEPTEE: 'ACCEPTEE',
    EN_PREPARATION: 'EN_PREPARATION',
    EN_COURS: 'EN_COURS',
    VALIDEE: 'VALIDEE',
    TERMINEE: 'TERMINEE',
    TERMINE: 'TERMINEE',
    ANNULEE: 'ANNULEE',
    ANNULE: 'ANNULEE'
};

const normalizeReservationStatut = (statut) => {
    if (typeof statut !== 'string') return null;
    const normalized = statut
        .trim()
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_');

    return RESERVATION_STATUS_MAP[normalized] || null;
};

// ============================================================
// 📊 STATISTIQUES & UTILISATEURS
// ============================================================

router.get('/stats', protect, adminOnly, async (req, res) => {
    try {
        const [totalFournisseurs, enAttente, conformes, totalMissions] = await Promise.all([
            Fournisseur.count(),
            Fournisseur.count({ where: { statut: 'EN_ATTENTE' } }),
            Fournisseur.count({ where: { statut: 'CONFORME' } }),
            Reservation.count(),
        ]);
        res.json({ success: true, data: { totalFournisseurs, enAttente, conformes, totalMissions } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

router.get('/utilisateurs', protect, adminOnly, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'nom', 'prenom', 'email', 'role', 'telephone', 'ville', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

router.delete('/utilisateurs/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
        await user.destroy();
        res.json({ success: true, message: 'Utilisateur supprimé.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ============================================================
// 🧑‍💼 GESTION DES FOURNISSEURS
// ============================================================

router.get('/fournisseurs', protect, adminOnly, async (req, res) => {
    try {
        const { statut } = req.query;
        const where = statut ? { statut } : {};
        const fournisseurs = await Fournisseur.findAll({
            where,
            include: [{ model: User, as: 'userFournisseur', attributes: ['id', 'nom', 'email', 'telephone'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: fournisseurs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

router.put('/fournisseurs/:id/statut', protect, adminOnly, async (req, res) => {
    try {
        const { statut } = req.body;
        const statutsValides = ['EN_ATTENTE', 'EN_EVALUATION', 'CONFORME', 'SUSPENDU'];
        if (!statutsValides.includes(statut)) {
            return res.status(400).json({ success: false, message: 'Statut invalide.' });
        }
        const fournisseur = await Fournisseur.findByPk(req.params.id);
        if (!fournisseur) return res.status(404).json({ success: false, message: 'Fournisseur introuvable.' });
        await fournisseur.update({ statut });
        res.json({ success: true, message: `Statut mis à jour : ${statut}`, data: fournisseur });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ============================================================
// 📅 GESTION DES RÉSERVATIONS (MISSIONS KANARI)
// ============================================================

router.get('/reservations', protect, adminOnly, async (req, res) => {
    try {
        const reservations = await Reservation.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: reservations });
    } catch (err) {
        console.error("❌ Erreur GET /reservations :", err);
        res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
    }
});

router.patch('/reservations/:id/statut', protect, adminOnly, async (req, res) => {
    try {
        const { statut: rawStatut } = req.body;
        const statut = normalizeReservationStatut(rawStatut);
        if (!statut) {
            return res.status(400).json({ success: false, message: 'Statut de réservation invalide.' });
        }

        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation introuvable.' });

        await reservation.update({ statut });
        res.json({ success: true, data: reservation });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

router.put('/reservations/:id/assigner', protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { fournisseurId, accordTelephone } = req.body;

        const reservation = await Reservation.findByPk(id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        }

        const statut = accordTelephone ? 'ACCEPTEE' : 'ASSIGNEE';

        await reservation.update({ fournisseurId, statut });

        res.json({ success: true, message: 'Fournisseur assigné avec succès.', data: reservation });
    } catch (err) {
        console.error("❌ Erreur PUT /assigner :", err);
        res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
    }
});

router.put('/reservations/:id/autoriser', protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;

        const reservation = await Reservation.findByPk(id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        }

        await reservation.update({ statut: 'ACCEPTEE' });

        res.json({ success: true, message: 'Démarrage de la mission autorisé.', data: reservation });
    } catch (err) {
        console.error("❌ Erreur PUT /autoriser :", err);
        res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
    }
});

router.put('/reservations/:id/refuser', protect, adminOnly, async (req, res) => {
    try {
        const { motif } = req.body;
        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation introuvable.' });

        await reservation.update({
            statut: 'ANNULEE',
            motifRefus: motif || 'Refusé par l\'administration'
        });

        res.json({ success: true, message: 'Mission refusée/annulée.', data: reservation });
    } catch (err) {
        console.error("❌ Erreur PUT /refuser :", err);
        res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
    }
});

router.post('/reservations/admin-creer', protect, adminOnly, async (req, res) => {
    try {
        const {
            besoin,
            adresse,
            telephone,
            clientNom,
            serviceId,
            serviceNom,
            fournisseurId,
            type,
            dateIntervention,
            modePaiement,
            accordTelephone
        } = req.body;

        if (!besoin || !adresse || !telephone || !serviceId) {
            return res.status(400).json({ success: false, message: 'Besoin, adresse, téléphone et service sont obligatoires.' });
        }

        const parsedFournisseurId = fournisseurId ? parseInt(fournisseurId, 10) : null;
        const parcours = parsedFournisseurId ? 'direct' : 'assignation';
        const statut = parsedFournisseurId
            ? (accordTelephone ? 'ACCEPTEE' : 'ASSIGNEE')
            : 'EN_ATTENTE';

        const newReservation = await Reservation.create({
            besoin,
            adresse,
            telephone,
            clientNom: clientNom || null,
            serviceId,
            serviceNom,
            fournisseurId: parsedFournisseurId,
            type: type || 'classique',
            dateIntervention: dateIntervention || null,
            parcours,
            statut,
            modePaiement: modePaiement || 'depot_kanari'
        });

        res.status(201).json({ success: true, message: 'Réservation créée par l’admin.', data: newReservation });
    } catch (err) {
        console.error("❌ Erreur POST /admin-creer :", err);
        res.status(500).json({ success: false, message: 'Erreur lors de la création.', error: err.message });
    }
});

router.delete('/reservations/:id', protect, adminOnly, async (req, res) => {
    try {
        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ success: false, message: 'Réservation introuvable.' });
        await reservation.destroy();
        res.json({ success: true, message: 'Réservation supprimée.' });
    } catch (err) {
        console.error("❌ Erreur DELETE /reservations/:id :", err);
        res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
    }
});

// ============================================================
// 💳 GESTION DES PAIEMENTS
// ============================================================

router.get('/paiements', protect, adminOnly, async (req, res) => {
    try {
        const paiements = await Paiement.findAll({
            include: [
                {
                    model: Commande,
                    as: 'commande',
                    required: false,
                    include: [{ model: User, as: 'clientCommande', attributes: ['id', 'nom', 'email'] }]
                },
                {
                    model: Reservation,
                    as: 'reservation',
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: paiements });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

router.put('/paiements/:id', protect, adminOnly, async (req, res) => {
    try {
        const { statut } = req.body;
        const paiement = await Paiement.findByPk(req.params.id);
        if (!paiement) return res.status(404).json({ success: false, message: 'Paiement introuvable.' });
        await paiement.update({ statut });
        res.json({ success: true, data: paiement });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ============================================================
// 📦 GESTION DES PRODUITS
// ============================================================

router.get('/produits', protect, adminOnly, async (req, res) => {
    try {
        const produits = await Produit.findAll({
            include: [{ model: Fournisseur, as: 'fournisseur', attributes: ['id', 'nomEntreprise'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: produits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

router.delete('/produits/:id', protect, adminOnly, async (req, res) => {
    try {
        const produit = await Produit.findByPk(req.params.id);
        if (!produit) return res.status(404).json({ success: false, message: 'Produit introuvable.' });
        await produit.destroy();
        res.json({ success: true, message: 'Produit supprimé.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// ============================================================
// 📍 GÉOLOCALISATION EN DIRECT (TOUR DE CONTRÔLE)
// ============================================================

router.get('/live-locations', protect, adminOnly, async (req, res) => {
    try {
        // 1. Récupérer TOUS les fournisseurs de la base de données
        const fournisseurs = await Fournisseur.findAll({
            include: [
                { 
                    model: User, 
                    as: 'userFournisseur', 
                    attributes: ['id', 'nom', 'prenom', 'telephone'] 
                }
            ]
        });

        // 2. Associer pour chaque fournisseur sa mission active s'il en a une
        const liveData = await Promise.all(fournisseurs.map(async (f) => {
            const missionActive = await Reservation.findOne({
                where: {
                    fournisseurId: f.id,
                    statut: ['ASSIGNEE', 'ACCEPTEE', 'EN_COURS', 'EN_ROUTE']
                },
                order: [['createdAt', 'DESC']]
            });

            return {
                id: f.id.toString(),
                name: f.nomEntreprise || (f.userFournisseur ? `${f.userFournisseur.prenom || ''} ${f.userFournisseur.nom}` : 'Prestataire'),
                role: f.specialite || 'Prestataire',
                lat: f.latitude || 13.5116, // Niamey par défaut si non renseigné
                lon: f.longitude || 2.1254,
                phone: f.userFournisseur?.telephone || f.telephone || 'N/A',
                status: missionActive ? missionActive.statut : (f.statut === 'CONFORME' ? 'DISPONIBLE' : 'EN_ATTENTE'),
                missionId: missionActive ? `CMD-${missionActive.id}` : null
            };
        }));

        // Filtrer pour ne garder que ceux qui ont des coordonnées GPS exploitables
        const validProviders = liveData.filter(item => item.lat && item.lon);

        res.json(validProviders);
    } catch (err) {
        console.error("❌ Erreur GET /api/admin/live-locations :", err);
        res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération des positions GPS.', error: err.message });
    }
});

module.exports = router;