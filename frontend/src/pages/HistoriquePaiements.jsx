import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

export default function HistoriquePaiements() {
    const navigate = useNavigate();
    const [paiements, setPaiements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur] = useState('');
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) return;

        const fetchPaiements = async () => {
            try {
                const res = await fetch(`${API}/api/paiements/historique`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = await res.json();

                if (res.status === 401) {
                    localStorage.removeItem('token');
                    throw new Error('Session expirée. Veuillez vous reconnecter.');
                }

                if (!res.ok) {
                    throw new Error(data?.message || 'Erreur lors de la récupération de l\'historique.');
                }

                setPaiements(data.data || data || []);
            } catch (err) {
                console.error('Erreur paiements:', err);
                setErreur(err.message || 'Impossible de charger l\'historique.');
            } finally {
                setLoading(false);
            }
        };

        fetchPaiements();
    }, [token]);

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-300 p-4">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center max-w-md w-full shadow-2xl">
                    <span className="text-4xl mb-4 block">🔒</span>
                    <h2 className="text-xl font-bold text-white mb-2">Accès restreint</h2>
                    <p className="text-slate-400 text-sm mb-6">Veuillez vous connecter pour consulter vos paiements.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all"
                    >
                        Se connecter
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex justify-center items-center">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 pb-24 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <button
                        onClick={() => navigate('/dashboard-client')}
                        className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-2 transition-colors bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl hover:border-slate-700"
                    >
                        ← Retour au Dashboard
                    </button>
                    <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                        🧾 Historique des paiements
                    </h1>
                </div>

                {erreur && (
                    <div className="mb-6 bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs sm:text-sm p-4 rounded-xl flex items-center gap-3">
                        <span>⚠️</span>
                        <span>{erreur}</span>
                    </div>
                )}

                {paiements.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
                        <div className="text-4xl">💳</div>
                        <p className="text-slate-400 text-sm">Aucun paiement enregistré pour le moment.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="text-xs bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
                        >
                            Découvrir nos services
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {paiements.map((p) => {
                            const isValide = p.statut === 'confirmé' || p.statut === 'valide' || p.statut === 'succes';
                            const isAttente = p.statut === 'en_attente' || p.statut === 'pending';

                            const statutStyle = isValide
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : isAttente
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

                            return (
                                <div key={p.id || p.referenceTransaction || p.referenceClient} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-slate-700 transition-all">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-4 border-b border-slate-800">
                                        <div>
                                            <h2 className="text-base font-bold text-white font-mono tracking-wide">
                                                Transaction #{p.referenceClient || p.referenceTransaction || p.id}
                                            </h2>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {p.createdAt
                                                    ? new Date(p.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                    : 'Date non disponible'}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${statutStyle}`}>
                                            {p.statut || 'en_attente'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                                            <span className="text-slate-500 block mb-1">Montant payé</span>
                                            <span className="text-indigo-400 font-mono font-bold text-sm sm:text-base">
                                                {(p.montant || 0).toLocaleString()} FCFA
                                            </span>
                                        </div>
                                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                                            <span className="text-slate-500 block mb-1">Mode de paiement</span>
                                            <span className="text-slate-200 font-semibold uppercase">
                                                {p.modePaiement || 'Mobile Money'}
                                            </span>
                                        </div>
                                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                                            <span className="text-slate-500 block mb-1">Téléphone utilisé</span>
                                            <span className="text-slate-200 font-mono">
                                                {p.telephone || 'Non renseigné'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}