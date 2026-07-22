// ============================================================
// PanierContext.jsx — Gestion globale du panier (Production)
// À placer dans : src/context/PanierContext.jsx
// ============================================================

import React, { createContext, useContext, useState, useEffect } from 'react';

const PanierContext = createContext();

export const PanierProvider = ({ children }) => {
    // 🔄 Initialisation sécurisée depuis le localStorage
    const [panier, setPanier] = useState(() => {
        try {
            const saved = localStorage.getItem('panier');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Erreur de lecture du panier dans localStorage:', error);
            return [];
        }
    });

    // 💾 Synchronisation automatique avec le localStorage à chaque modification
    useEffect(() => {
        try {
            localStorage.setItem('panier', JSON.stringify(panier));
        } catch (error) {
            console.error('Erreur de sauvegarde du panier dans localStorage:', error);
        }
    }, [panier]);

    // ➕ Ajouter un produit (ou mettre à jour ses infos + incrémenter la quantité)
    const ajouterAuPanier = (produit) => {
        if (!produit || !produit.id) return;

        setPanier(prev => {
            const existe = prev.find(item => item.id === produit.id);
            if (existe) {
                return prev.map(item =>
                    item.id === produit.id
                        ? { ...produit, quantite: item.quantite + 1 } // 💡 Met à jour l'image/prix et augmente la quantité
                        : item
                );
            }
            return [...prev, { ...produit, quantite: 1 }];
        });
    };

    // ➖ Retirer un produit du panier
    const retirerDuPanier = (produitId) => {
        setPanier(prev => prev.filter(item => item.id !== produitId));
    };

    // 🔢 Modifier directement la quantité
    const modifierQuantite = (produitId, quantite) => {
        const nouvelleQuantite = Number(quantite);

        if (nouvelleQuantite <= 0) {
            retirerDuPanier(produitId);
            return;
        }

        setPanier(prev =>
            prev.map(item =>
                item.id === produitId ? { ...item, quantite: nouvelleQuantite } : item
            )
        );
    };

    // 🗑️ Vider complètement le panier
    const viderPanier = () => {
        setPanier([]);
        try {
            localStorage.removeItem('panier');
        } catch (error) {
            console.error('Erreur lors du nettoyage du localStorage:', error);
        }
    };

    // 💰 Calcul du total du panier (FCFA)
    const totalPanier = panier.reduce(
        (acc, item) => acc + (Number(item.prix) || 0) * (Number(item.quantite) || 1),
        0
    );

    // 🔢 Nombre total d'articles dans le panier
    const nombreArticles = panier.reduce(
        (acc, item) => acc + (Number(item.quantite) || 1),
        0
    );

    return (
        <PanierContext.Provider value={{
            panier,
            totalPanier,
            nombreArticles,
            ajouterAuPanier,
            retirerDuPanier,
            modifierQuantite,
            viderPanier
        }}>
            {children}
        </PanierContext.Provider>
    );
};

// 🪝 Hook personnalisé pour utiliser le panier partout dans l'application
export const usePanier = () => {
    const context = useContext(PanierContext);
    if (!context) {
        throw new Error('usePanier doit être utilisé à l\'intérieur d\'un PanierProvider');
    }
    return context;
};