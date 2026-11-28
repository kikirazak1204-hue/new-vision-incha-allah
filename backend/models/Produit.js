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

    // Photo principale (première image). Gardée pour que la boutique et les anciens écrans continuent de fonctionner.
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Galerie : jusqu'à 4 photos (liste d'URL stockée en JSON). Les anciens produits n'ont que « image ».
    images: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const brut = this.getDataValue('images');
            if (!brut) return this.getDataValue('image') ? [this.getDataValue('image')] : [];
            try {
                const liste = JSON.parse(brut);
                return Array.isArray(liste) ? liste : [];
            } catch (e) {
                return this.getDataValue('image') ? [this.getDataValue('image')] : [];
            }
        },
        set(valeur) {
            const liste = Array.isArray(valeur) ? valeur.filter(Boolean).slice(0, 4) : [];
            this.setDataValue('images', liste.length ? JSON.stringify(liste) : null);
        }
    },

    // Catégorie du produit (texte libre, ex: "Plomberie", "Électricité")
    categorie: {
        type: DataTypes.STRING,
        allowNull: true
    },

    // Quantité en stock, 0 par défaut si non renseignée
    quantite: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },

    // Clé étrangère vers Fournisseur
    fournisseurId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    // Clé étrangère vers Service (peut être null si le produit ne dépend pas d'un service)
    serviceId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'produits',
    timestamps: true
});


module.exports = Produit;