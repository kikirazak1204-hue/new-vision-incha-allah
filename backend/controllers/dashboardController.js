const {
    Produit, Commande, Facture, Paiement,
    Fournisseur, User, Service, CommandeProduit, Reservation
} = require('../models');

// ===============================
// 📊 DASHBOARD CLIENT (Utilisateur)
// ===============================
exports.getDashboardClient = async (req, res) => {
    try {
        const clientId = req.user.id;

        const [totalCommandes, totalFactures, totalDepense, missions, facturesRecentes] = await Promise.all([
            Commande.count({ where: { clientId } }),
            Facture.count({ where: { clientId } }),
            Facture.sum('montantTotal', { where: { clientId } }).then(v => v || 0),
            // Utilisation des alias EXACTS de ton models/index.js
            Reservation.findAll({
                where: { clientId },
                include: [
                    { model: Fournisseur, as: 'prestataire', attributes: ['nomEntreprise', 'telephone'] },
                    { model: Service, as: 'service', attributes: ['nom', 'emoji'] }
                ],
                limit: 5,
                order: [['createdAt', 'DESC']]
            }),
            Facture.findAll({
                where: { clientId },
                include: [{ model: Commande, as: 'factureCommande' }],
                limit: 5,
                order: [['createdAt', 'DESC']]
            })
        ]);

        res.json({
            success: true,
            data: {
                stats: { totalCommandes, totalFactures, totalDepense },
                missions,
                facturesRecentes
            }
        });
    } catch (err) {
        console.error('❌ Erreur Dashboard Client:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur dashboard client', error: err.message });
    }
};

// ===============================
// 📊 DASHBOARD FOURNISSEUR
// ===============================
exports.getDashboardFournisseur = async (req, res) => {
    try {
        const fournisseur = await Fournisseur.findOne({ where: { userId: req.user.id } });
        if (!fournisseur) return res.status(404).json({ success: false, message: 'Profil fournisseur non trouvé' });

        const fId = fournisseur.id;

        const [totalProduits, totalRevenus, missions, commandesRecentes] = await Promise.all([
            Produit.count({ where: { fournisseurId: fId } }),
            Facture.sum('montantTotal', { where: { fournisseurId: fId } }).then(v => v || 0),
            Reservation.findAll({
                where: { fournisseurId: fId },
                include: [{ model: User, as: 'client', attributes: ['nom', 'email'] }],
                limit: 8,
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
                stats: { totalProduits, totalRevenus, totalMissions: missions.length },
                missions,
                commandesRecentes
            }
        });
    } catch (err) {
        console.error('❌ Erreur Dashboard Fournisseur:', err);
        res.status(500).json({ success: false, message: 'Erreur serveur dashboard fournisseur' });
    }
};