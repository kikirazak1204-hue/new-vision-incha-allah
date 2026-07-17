import React from "react";
import { useNavigate } from "react-router-dom";

export default function BoutonDashboard() {
    const navigate = useNavigate();
    // On vérifie si l'utilisateur est connecté
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

    if (!user) return null;

    const handleClick = () => {
        if (user.role === 'admin') navigate('/dashboard-admin');
        else if (user.role === 'fournisseur_service') navigate('/dashboard-fournisseur');
        else navigate('/dashboard-client');
    };

    return (
        <button
            onClick={handleClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 text-slate-200 hover:text-white rounded-xl transition-all duration-300 font-semibold text-sm backdrop-blur-sm"
        >
            ⚙️ Dashboard
        </button>
    );
}