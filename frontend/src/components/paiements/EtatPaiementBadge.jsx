import React from 'react';

export const ETATS_PAIEMENT = {
    sans_bon:      { label: 'Bon non établi',        cls: 'bg-slate-50 text-slate-600 border-slate-200' },
    bon_a_valider: { label: 'Bon à valider',         cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    a_payer:       { label: 'À payer',               cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    en_attente:    { label: 'Vérification en cours', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    paye:          { label: 'Réglé',                 cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    direct:        { label: 'Paiement sur place',    cls: 'bg-sky-50 text-sky-700 border-sky-200' },
    rejete:        { label: 'Paiement rejeté',       cls: 'bg-red-50 text-red-700 border-red-200' },
    rembourse:     { label: 'Remboursé',             cls: 'bg-slate-50 text-slate-700 border-slate-200' },
    annulee:       { label: 'Annulée',               cls: 'bg-red-50 text-red-700 border-red-200' },
};

export default function EtatPaiementBadge({ etat, className = '' }) {
    const e = ETATS_PAIEMENT[etat] || { label: etat || '—', cls: 'bg-slate-50 text-slate-700 border-slate-200' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${e.cls} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />{e.label}
        </span>
    );
}