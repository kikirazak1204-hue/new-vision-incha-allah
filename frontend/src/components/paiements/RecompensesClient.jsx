// Récompenses du client (ristourne), affichées à part de ses paiements
import React, { useEffect, useState } from 'react';
import { getRecompensesClient, fcfa } from '../../util/paiementsApi';

export default function RecompensesClient() {
    const [d, setD] = useState(null);
    useEffect(() => { getRecompensesClient().then((r) => setD(r.data)).catch(() => setD(null)); }, []);
    if (!d) return null;
    return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
                <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 block">Mes récompenses ({d.taux} % de ristourne)</span>
                <p className="text-2xl font-extrabold text-emerald-700">{fcfa(d.ristourne)}</p>
            </div>
            <p className="text-xs text-emerald-800 max-w-sm">
                {d.taux} % de chaque paiement confirmé est ajouté à vos récompenses. Ce montant est séparé de vos paiements.
            </p>
        </div>
    );
}