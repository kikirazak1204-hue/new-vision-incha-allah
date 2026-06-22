import React, { useEffect, useState } from 'react';
import { getAdminProduits, deleteAdminProduit } from '../../util/api';

export default function ProduitsAdmin() {
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAdminProduits().then(res => {
            setProduits(res.data || []);
            setLoading(false);
        });
    }, []);

    const supprimerProduit = async (id, nom) => {
        if (!window.confirm(`Supprimer définitivement "${nom}" du catalogue ?`)) return;
        const res = await deleteAdminProduit(id);
        if (res.success) setProduits(prev => prev.filter(p => p.id !== id));
    };

    if (loading) return <div className="text-center py-12 text-slate-500 animate-pulse font-mono text-sm">Chargement du catalogue...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                📦 Inventaire <span className="text-slate-600 font-normal">({produits.length})</span>
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {produits.map(p => (
                    <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-slate-600 transition-all">
                        <div className="aspect-square relative overflow-hidden bg-slate-950">
                            <img
                                src={`${import.meta.env.VITE_API_URL}/uploads/${p.image}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                alt={p.nom}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-60"></div>
                            <button 
                                onClick={() => supprimerProduit(p.id, p.nom)} 
                                className="absolute top-2 right-2 bg-slate-950/50 backdrop-blur p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-rose-600"
                            >
                                🗑️
                            </button>
                        </div>
                        <div className="p-3">
                            <h4 className="font-bold text-sm text-slate-200 truncate">{p.nom}</h4>
                            <p className="text-emerald-400 text-xs font-black tracking-tight">{p.prix.toLocaleString()} FCFA</p>
                            <p className="text-[10px] text-slate-500 mt-1 truncate border-t border-slate-800 pt-1">
                                {p.fournisseur?.nomEntreprise || 'Fournisseur externe'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}