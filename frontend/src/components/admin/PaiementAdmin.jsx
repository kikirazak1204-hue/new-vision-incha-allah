import React, { useEffect, useState } from 'react';
import { getAdminPaiements, updateStatutPaiement } from '../../util/api';

export default function PaiementAdmin() {
    const [paiements, setPaiements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAdminPaiements().then(data => {
            setPaiements(data.data || []);
            setLoading(false);
        });
    }, []);

    const changerStatut = async (id, nouveauStatut) => {
        const res = await updateStatutPaiement(id, nouveauStatut);
        if (res.success) {
            setPaiements(prev => prev.map(p => p.id === id ? { ...p, statut: nouveauStatut } : p));
        }
    };

    if (loading) return <div className="text-center py-10 text-slate-500 animate-pulse">Synchronisation des transactions...</div>;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800">
                <h2 className="font-bold text-white">Flux de transactions</h2>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-widest">
                            <th className="p-4">Utilisateur</th>
                            <th className="p-4">Montant</th>
                            <th className="p-4">Méthode</th>
                            <th className="p-4">Statut</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                        {paiements.map(p => (
                            <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-4 font-semibold text-slate-200">{p.user?.nom || 'Client anonyme'}</td>
                                <td className="p-4 text-emerald-400 font-bold font-mono">{p.montant?.toLocaleString()} FCFA</td>
                                <td className="p-4 text-slate-400 text-xs uppercase">{p.methode || '—'}</td>
                                <td className="p-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                        p.statut === 'valide' 
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                    }`}>
                                        {p.statut}
                                    </span>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    {p.statut !== 'valide' && (
                                        <button onClick={() => changerStatut(p.id, 'valide')} className="text-emerald-400 hover:text-white px-2 py-1 rounded border border-emerald-900 hover:bg-emerald-600 transition text-[10px] font-bold">
                                            Valider
                                        </button>
                                    )}
                                    <button onClick={() => changerStatut(p.id, 'echoue')} className="text-rose-400 hover:text-white px-2 py-1 rounded border border-rose-900 hover:bg-rose-600 transition text-[10px] font-bold">
                                        Annuler
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}