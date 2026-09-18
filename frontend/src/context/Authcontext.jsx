import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user')) || null;
        } catch {
            return null;
        }
    });

    const login = (tokenValue, userData) => {
        localStorage.setItem('token', tokenValue);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(tokenValue);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    // ✅ Normalisation des rôles pour éviter les bugs de casse ou de terminologie
    const userRole = String(user?.role || user?.typeProfil || user?.type || '').toLowerCase();

    const isAdmin = userRole.includes('admin');
    const isFournisseur = userRole.includes('fournisseur') || userRole.includes('prestataire') || userRole.includes('partenaire');
    const isUtilisateur = userRole.includes('client') || userRole.includes('user') || userRole.includes('utilisateur');
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

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
};