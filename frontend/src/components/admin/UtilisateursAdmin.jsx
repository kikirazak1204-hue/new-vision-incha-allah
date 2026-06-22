import React, { useEffect, useState } from 'react';
// On remonte deux fois pour atteindre la racine 'src'
import { getAdminUtilisateurs, deleteUtilisateur } from '../../util/api';

export default function UtilisateursAdmin() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        getAdminUtilisateurs()
            .then(res => {
                setUsers(res.data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const supprimerUser = async (id, nom) => {
        if (!window.confirm(`⚠️ Action irréversible : Désactiver le compte de ${nom || 'cet utilisateur'} ?`)) return;
        const res = await deleteUtilisateur(id);
        if (res.success) {
            setUsers(prev => prev.filter(u => u.id !== id));
        }
    };

    const filteredUsers = users.filter(u => 
        u.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm font-mono animate-pulse">Synchronisation des identités...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header + Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>👥</span> Base Utilisateurs
                        <span className="text-xs font-mono px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
                            {users.length}
                        </span>
                    </h2>
                </div>

                <div className="w-full sm:w-72">
                    <input 
                        type="text" 
                        placeholder="Rechercher un nom, un email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map(u => (
                    <div 
                        key={u.id} 
                        className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/5"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold shadow-inner ${
                                        u.role === 'admin' 
                                            ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-purple-900/50' 
                                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                                    }`}>
                                        {u.nom?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors">
                                            {u.nom || 'Anonyme'}
                                        </h3>
                                        <p className="text-xs text-slate-400">{u.email}</p>
                                    </div>
                                </div>

                                <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-md tracking-wider border ${
                                    u.role === 'admin'
                                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                        : u.role === 'fournisseur'
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}>
                                    {u.role}
                                </span>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400">
                                <span>📞 {u.telephone || '—'}</span>
                                <span className="font-mono text-[10px] text-slate-600">ID: #{u.id}</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => supprimerUser(u.id, u.nom)} 
                            className="mt-5 w-full py-2.5 bg-rose-500/5 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl border border-rose-500/10 hover:border-transparent transition-all text-xs font-bold tracking-wide cursor-pointer flex items-center justify-center gap-2"
                        >
                            <span>🔒</span> Révocations des accès
                        </button>
                    </div>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                    <p className="text-slate-500 text-sm">Aucun utilisateur ne correspond à "{searchTerm}"</p>
                </div>
            )}
        </div>
    );
}