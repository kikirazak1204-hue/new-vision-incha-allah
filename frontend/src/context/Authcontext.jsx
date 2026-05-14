// ============================================================
//  AuthContext.jsx — Gestion globale de l'authentification
//  À placer dans : src/context/AuthContext.jsx
// ============================================================

import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    // ✅ Initialisation depuis localStorage
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user')) || null;
        } catch {
            return null;
        }
    });

    // 🔑 Connexion — appelé après loginUser()
    const login = (tokenValue, userData) => {
        localStorage.setItem('token', tokenValue);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(tokenValue);
        setUser(userData);
    };

    // 🚪 Déconnexion — remplace tous les localStorage.removeItem éparpillés
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    // 🔍 Helpers rôle
    const isAdmin = user?.role === 'admin';
    const isFournisseur = user?.role === 'fournisseur';
    const isUtilisateur = user?.role === 'utilisateur';
    const isConnecte = !!token;

    return (
        <AuthContext.Provider value={{
            token,
            user,
            login,
            logout,
            isAdmin,
            isFournisseur,
            isUtilisateur,
            isConnecte
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// 🪝 Hook personnalisé
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
};