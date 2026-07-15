import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
    const token = localStorage.getItem('token');

    // 🚨 SÉCURITÉ ANTI-CRASH 1 : On protège la lecture du JSON
    let user = {};
    try {
        const rawUser = localStorage.getItem('user');
        // On vérifie que ce n'est pas un texte corrompu avant de parser
        if (rawUser && rawUser !== "undefined" && rawUser !== "[object Object]") {
            user = JSON.parse(rawUser);
        }
    } catch (error) {
        console.error("☣️ Données 'user' corrompues dans le localStorage. Purge d'urgence...");
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }

    // 1. Si pas de token, dehors direct
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 🚨 SÉCURITÉ 2 : Normalisation blindée (évite le crash si user.role est null)
    const userRole = String(user?.role || '').toLowerCase().trim();
    const requiredRole = String(role || '').toLowerCase().trim();

    const isAuthorized = userRole === requiredRole || 
                         (requiredRole === 'client' && userRole === 'utilisateur');

    // 2. Si le rôle ne correspond pas
    if (role && !isAuthorized) {
        console.warn(`❌ Accès refusé : Requis [${requiredRole}], obtenu [${userRole}]. User stocké:`, user);
        
        // On renvoie vers /login et NON vers "/" pour tuer le Ping-Pong avec l'Accueil !
        return <Navigate to="/login" replace />;
    }

    return children;
}