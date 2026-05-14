// src/components/BoutonDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function BoutonDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) return null; // Pas connecté : pas de bouton

    const handleClick = () => {
        if (user.role === 'admin') navigate('/dashboard-admin');
        else if (user.role === 'fournisseur_service') navigate('/dashboard-fournisseur');
        else navigate('/dashboard-client');
    };

    return (
        <div className="text-center mt-4">
            <button
                onClick={handleClick}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-semibold"
            >
                Accéder au Dashboard
            </button>
        </div>
    );
}
