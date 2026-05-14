import React, { useEffect, useState } from 'react';
import { getAdminPaiements, updateStatutPaiement } from '../../util/api';

export default function PaiementAdmin() {
    const [paiements, setPaiements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPaiements = async () => {
            const data = await getAdminPaiements();
            setPaiements(data.data || []);
            setLoading(false);
        };
        fetchPaiements();
    }, []);

    const changerStatut = async (id, nouveauStatut) => {
        const res = await updateStatutPaiement(id, nouveauStatut);
        if (res.success) {
            setPaiements(prev => prev.map(p => p.id === id ? { ...p, statut: nouveauStatut } : p));
        }
    };

    if (loading) return <div className="text-center py-10 animate-pulse">Chargement des transactions...</div>;

    return (
        <div className="overflow-x-auto bg-gray-900 rounded-2xl border border-gray-800">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-800 text-gray-400 text-xs uppercase">
                        <th className="p-4">Utilisateur</th>
                        <th className="p-4">Montant</th>
                        <th className="p-4">Méthode</th>
                        <th className="p-4">Statut</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {paiements.map(p => (
                        <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                            <td className="p-4 font-semibold">{p.user?.nom || 'Client'}</td>
                            <td className="p-4 text-green-400 font-bold">{p.montant?.toLocaleString()} FCFA</td>
                            <td className="p-4 text-gray-400">{p.methode || 'Mobile Money'}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${p.statut === 'valide' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                                    }`}>
                                    {p.statut}
                                </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                                {p.statut !== 'valide' && (
                                    <button onClick={() => changerStatut(p.id, 'valide')} className="bg-green-600 hover:bg-green-700 p-2 rounded-lg text-xs">Valider</button>
                                )}
                                <button onClick={() => changerStatut(p.id, 'echoue')} className="bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white p-2 rounded-lg text-xs">Annuler</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}