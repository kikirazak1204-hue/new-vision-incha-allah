import React, { useEffect, useState } from 'react';
import { getAdminUtilisateurs, deleteUtilisateur } from '../../util/api';

export default function UtilisateursAdmin() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAdminUtilisateurs().then(res => {
            setUsers(res.data || []);
            setLoading(false);
        });
    }, []);

    const supprimerUser = async (id) => {
        if (!window.confirm("Supprimer définitivement cet utilisateur ?")) return;
        const res = await deleteUtilisateur(id);
        if (res.success) setUsers(prev => prev.filter(u => u.id !== id));
    };

    if (loading) return <div className="text-center py-10 animate-pulse">Chargement des membres...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(u => (
                <div key={u.id} className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${u.role === 'admin' ? 'bg-purple-600' : 'bg-gray-700'}`}>
                                {u.nom?.charAt(0)}
                            </div>
                            <span className="text-[10px] uppercase font-black bg-gray-800 px-2 py-1 rounded text-gray-400">{u.role}</span>
                        </div>
                        <h3 className="font-bold text-lg">{u.nom}</h3>
                        <p className="text-sm text-gray-500 mb-2">{u.email}</p>
                        <p className="text-xs text-indigo-400">📞 {u.telephone || 'Non renseigné'}</p>
                    </div>
                    <button onClick={() => supprimerUser(u.id)} className="mt-6 w-full py-2 bg-red-600/10 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all text-sm font-bold">
                        Désactiver le compte
                    </button>
                </div>
            ))}
        </div>
    );
}