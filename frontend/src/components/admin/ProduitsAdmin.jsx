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

    const supprimerProduit = async (id) => {
        if (!window.confirm("Supprimer ce produit du catalogue ?")) return;
        const res = await deleteAdminProduit(id);
        if (res.success) setProduits(prev => prev.filter(p => p.id !== id));
    };

    if (loading) return <div className="text-center py-10 animate-pulse">Analyse du catalogue...</div>;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {produits.map(p => (
                <div key={p.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 group">
                    <div className="h-32 bg-gray-800 relative">
                        <img
                            src={`${import.meta.env.VITE_API_URL}/uploads/${p.image}`}
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                            alt={p.nom}
                        />
                        <button onClick={() => supprimerProduit(p.id)} className="absolute top-2 right-2 bg-red-600 p-2 rounded-full shadow-lg">
                            🗑️
                        </button>
                    </div>
                    <div className="p-3">
                        <h4 className="font-bold text-sm truncate">{p.nom}</h4>
                        <p className="text-green-400 text-xs font-bold">{p.prix} FCFA</p>
                        <p className="text-[10px] text-gray-500 mt-1 italic">Par: {p.fournisseur?.nomEntreprise}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}