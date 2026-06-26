import React from 'react';

// Configuration intégrée directement pour éviter les erreurs d'importation de fichier de config
const STATUT_CONFIG = {
    en_attente: {
        label: 'En attente',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    en_validation_admin: {
        label: 'Validation Admin',
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    },
    en_cours: {
        label: 'En cours',
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    valide: {
        label: 'Terminé',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    annule: {
        label: 'Annulé',
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    }
};

export default function StatusBadge({ statut }) {
    // Sécurité au cas où le statut renvoyé par l'API n'est pas encore configuré
    const config = STATUT_CONFIG[statut] || { 
        label: statut, 
        color: 'text-slate-400 bg-slate-500/10 border-white/5' 
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-medium border ${config.color}`}>
            {config.label}
        </span>
    );
}