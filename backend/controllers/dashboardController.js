const {
    Produit, Commande, Facture, Paiement,
    Fournisseur, User, Service, CommandeProduit,
    Reservation, BonIntervention
} = require('../models');

// ===============================
// 📊 DASHBOARD FOURNISSEUR
// ===============================
exports.getDashboardFournisseur = async (req, res) => {
    try {
        console.log("🔍 Tentative accès dashboard pour User ID:", req.user?.id);

        // Recherche du fournisseur
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        
        if (!fournisseur) {
            console.log("❌ Profil fournisseur introuvable pour cet utilisateur");
            return res.status(404).json({ success: false, message: 'Profil fournisseur non trouvé' });
        }

        const fId = fournisseur.id;

        const [totalProduits, totalRevenus, missions, commandesRecentes] = await Promise.all([
            Produit.count({ where: { fournisseurId: fId } }),
            Facture.sum('montantTotal', { where: { fournisseurId: fId } }).then(v => v || 0),
            Reservation.findAll({
                where: { fournisseurId: fId },
                include: [
                    { model: User, as: 'client', attributes: ['nom', 'email'] },
                    { model: BonIntervention, as: 'bonIntervention' }
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

        res.json({
            success: true,
            data: {
                profil: fournisseur,
                stats: { totalProduits, totalRevenus, totalMissions: missions.length },
                missions,
                commandesRecentes
            }
        });
    } catch (err) {
        console.error('❌ Erreur Critique Dashboard Fournisseur:', err.message);
        res.status(500).json({ success: false, message: 'Erreur serveur interne' });
    }
};

// ===============================
// 📊 DASHBOARD CLIENT (Rappel)
// ===============================
exports.getDashboardClient = async (req, res) => {
    // ... (Ton code client reste inchangé)
};