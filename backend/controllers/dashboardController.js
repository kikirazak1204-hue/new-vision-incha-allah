const {
    Produit, Commande, Facture,
    Fournisseur, User, Reservation, BonIntervention
} = require('../models');

// Exportation directe via "exports"
exports.getDashboardFournisseur = async (req, res) => {
    try {
        // ... (Ton code complet du dashboard fournisseur)
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(404).json({ success: false, message: 'Profil non trouvé' });

        const fId = fournisseur.id;
        const [totalProduits, totalRevenus, missions, commandesRecentes] = await Promise.all([
            Produit.count({ where: { fournisseurId: fId } }),
            Facture.sum('montantTotal', { where: { fournisseurId: fId } }).then(v => v || 0),
            Reservation.findAll({
                where: { fournisseurId: fId },
                attributes: ['id', 'besoin', 'adresse', 'telephone', 'clientNom', 'dateIntervention', 'type', 'parcours', 'statut', 'descriptionTravail', 'montantMainOeuvre', 'piecesFournies', 'createdAt'],
                include: [
                    { model: User, as: 'client', attributes: ['nom', 'email'] },
                    { model: BonIntervention, as: 'bonIntervention', attributes: { exclude: ['descriptionTravail', 'montantMainOeuvre'] } }
                ],
                limit: 10,
                order: [['createdAt', 'DESC']]
            }),
            Commande.findAll({
                where: { fournisseurId: fId },
                include: [{ model: User, as: 'clientCommande', attributes: ['nom'] }],
                limit: 5,
                order: [['createdAt', 'DESC']]
            })
        ]);

        res.json({ success: true, data: { profil: fournisseur, stats: { totalProduits, totalRevenus, totalMissions: missions.length }, missions, commandesRecentes } });
    } catch (err) {
        console.error('❌ Erreur Critique:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur interne' });
    }
};

// ➕ IMPLÉMENTATION AJOUTÉE : la fonction était vide (aucune réponse envoyée),
// ce qui provoquait un timeout côté serveur remonté en 503 côté frontend.
exports.getDashboardClient = async (req, res) => {
    try {
        const clientId = req.user.id;

        const [missions, totalReservations] = await Promise.all([
            Reservation.findAll({
                where: { clientId },
                attributes: ['id', 'besoin', 'adresse', 'telephone', 'clientNom', 'dateIntervention', 'type', 'parcours', 'statut', 'descriptionTravail', 'montantMainOeuvre', 'piecesFournies', 'createdAt'],
                include: [
                    // ✅ Alias corrigé d'après models/index.js : Reservation.belongsTo(Fournisseur, { as: 'prestataire' })
                    { model: Fournisseur, as: 'prestataire', attributes: ['id', 'nomEntreprise', 'telephone'] },
                    { model: BonIntervention, as: 'bonIntervention', attributes: { exclude: ['descriptionTravail', 'montantMainOeuvre'] } }
                ],
                limit: 20,
                order: [['createdAt', 'DESC']]
            }),
            Reservation.count({ where: { clientId } })
        ]);

        res.json({
            success: true,
            data: {
                stats: { totalReservations },
                missions
            }
        });
    } catch (err) {
        console.error('❌ Erreur Critique (dashboard client):', err);
        res.status(500).json({ success: false, message: 'Erreur serveur interne' });
    }
};