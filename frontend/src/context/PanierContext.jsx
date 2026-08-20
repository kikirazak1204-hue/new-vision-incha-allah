import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Création du contexte
const PanierContext = createContext();

// 2. Hook personnalisé pour utiliser le contexte facilement
export const usePanier = () => useContext(PanierContext);

// 3. Provider du contexte
export const PanierProvider = ({ children }) => {
    // Initialisation du panier depuis le localStorage (anti-perte de données au rechargement F5)
    const [panier, setPanier] = useState(() => {
        try {
            const savedPanier = localStorage.getItem('monPanier');
            return savedPanier ? JSON.parse(savedPanier) : [];
        } catch (error) {
            console.error("Erreur lors de la lecture du panier:", error);
            return [];
        }
    });

    // Sauvegarde automatique dans le localStorage à chaque fois que le panier change
    useEffect(() => {
        localStorage.setItem('monPanier', JSON.stringify(panier));
    }, [panier]);

    // Calcul automatique du total du panier
    const totalPanier = panier.reduce((total, item) => {
        return total + (Number(item.prix) * Number(item.quantite));
    }, 0);

    // Fonction pour ajouter un article (utile pour tes pages produits)
    const ajouterAuPanier = (produit) => {
        setPanier((prevPanier) => {
            const idProduit = produit.id || produit._id;
            const index = prevPanier.findIndex(item => (item.id || item._id) === idProduit);

            if (index !== -1) {
                // Le produit existe déjà, on augmente juste sa quantité
                const nouveauPanier = [...prevPanier];
                nouveauPanier[index].quantite += (produit.quantite || 1);
                return nouveauPanier;
            }
            // C'est un nouveau produit, on l'ajoute avec une quantité de 1 (ou celle fournie)
            return [...prevPanier, { ...produit, quantite: produit.quantite || 1 }];
        });
    };

    // Fonction pour modifier la quantité (+ ou - dans la page Panier)
    const modifierQuantite = (id, nouvelleQuantite) => {
        if (nouvelleQuantite < 1) return; // Sécurité pour empêcher une quantité à 0 ou négative
        
        setPanier((prevPanier) =>
            prevPanier.map((item) =>
                (item.id === id || item._id === id) 
                    ? { ...item, quantite: nouvelleQuantite } 
                    : item
            )
        );
    };

    // Fonction pour supprimer un article
    const retirerDuPanier = (id) => {
        setPanier((prevPanier) => 
            prevPanier.filter((item) => item.id !== id && item._id !== id)
        );
    };

    // Fonction pour vider entièrement le panier
    const viderPanier = () => {
        setPanier([]);
    };

    return (
        <PanierContext.Provider
            value={{
                panier,
                totalPanier,
                ajouterAuPanier,
                modifierQuantite,
                retirerDuPanier,
                viderPanier
            }}
        >
            {children}
        </PanierContext.Provider>
    );
};