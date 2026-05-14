// ============================================================
//  PanierContext.jsx — Gestion globale du panier (Production)
//  À placer dans : src/context/PanierContext.jsx
// ============================================================

import React, { createContext, useContext, useState, useEffect } from 'react';

const PanierContext = createContext();

export const PanierProvider = ({ children }) => {
    // 🔄 Initialisation depuis localStorage pour persistance
    const [panier, setPanier] = useState(() => {
        try {
            const saved = localStorage.getItem('panier');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // 💾 Synchronisation automatique avec localStorage
    useEffect(() => {
        localStorage.setItem('panier', JSON.stringify(panier));
    }, [panier]);

    // ➕ Ajouter un produit (ou augmenter la quantité)
    const ajouterAuPanier = (produit) => {
        setPanier(prev => {
            const existe = prev.find(item => item.id === produit.id);
            if (existe) {
                return prev.map(item =>
                    item.id === produit.id
                        ? { ...item, quantite: item.quantite + 1 }
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

    // 🔢 Modifier la quantité
    const modifierQuantite = (produitId, quantite) => {
        if (quantite <= 0) {
            retirerDuPanier(produitId);
            return;
        }
        setPanier(prev =>
            prev.map(item =>
                item.id === produitId ? { ...item, quantite } : item
            )
        );
    };

    // 🗑️ Vider tout le panier
    const viderPanier = () => {
        setPanier([]);
        localStorage.removeItem('panier');
    };

    // 💰 Calcul du total
    const totalPanier = panier.reduce(
        (acc, item) => acc + item.prix * item.quantite, 0
    );

    // 🔢 Nombre total d'articles
    const nombreArticles = panier.reduce(
        (acc, item) => acc + item.quantite, 0
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

// 🪝 Hook personnalisé pour utiliser le panier partout
export const usePanier = () => {
    const context = useContext(PanierContext);
    if (!context) {
        throw new Error('usePanier doit être utilisé dans un PanierProvider');
    }
    return context;
};
