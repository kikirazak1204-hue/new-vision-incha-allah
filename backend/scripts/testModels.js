const { sequelize, User, Fournisseur, Produit, Commande, CommandeProduit, Facture } = require('../models');

(async () => {
    try {
        console.log('🔄 Synchronisation de la base...');
        await sequelize.sync({ force: true });

        console.log('✅ Base synchronisée.');

        // 👤 Création d’un utilisateur
        const user = await User.create({ nom: 'Kiki', email: 'kiki@vision.com', motDePasse: 'securepass' });

        // 🏢 Création d’un fournisseur lié à l’utilisateur
        const fournisseur = await Fournisseur.create({ userId: user.id, nomEntreprise: 'New Life' });

        // 📦 Création d’un produit lié au fournisseur
        const produit = await Produit.create({ nom: 'Service Premium', prix: 100, fournisseurId: fournisseur.id });

        // 🛒 Création d’une commande liée au client
        const commande = await Commande.create({ clientId: user.id });

        // 🧾 Ajout du produit à la commande
        const item = await CommandeProduit.create({ commandeId: commande.id, produitId: produit.id, quantite: 2 });

        // 💰 Création d’une facture liée à la commande
        const facture = await Facture.create({ commandeId: commande.id, clientId: user.id, montant: 200 });

        console.log('🎉 Test terminé avec succès.');
        console.log({ user, fournisseur, produit, commande, item, facture });

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur pendant le test :', error);
        process.exit(1);
    }
})();
