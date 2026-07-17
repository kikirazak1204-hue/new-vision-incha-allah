const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Produit = sequelize.define('Produit', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    prix: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // ➕ AJOUTÉ : catégorie du produit (texte libre, ex: "Plomberie", "Électricité")
    categorie: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // ➕ AJOUTÉ : quantité en stock, 0 par défaut si non renseignée
    quantite: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },

    // 🔗 Clé étrangère vers Fournisseur
    fournisseurId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    // 🔗 Clé étrangère vers Service
    serviceId: {
        type: DataTypes.INTEGER,
        allowNull: true // ✅ important : peut être null si le produit ne dépend pas d’un service
    }
}, {
    tableName: 'produits',
    timestamps: true
});


module.exports = Produit;