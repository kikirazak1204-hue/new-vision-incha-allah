// ============================================================
// Fichier : src/pages/HistoriquePaiements.jsx (CORRIGÉ ET COMPLET)
// ============================================================

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
                // Route corrigée avec /historique à la fin pour correspondre au backend
                const res = await fetch(`${API}/api/paiements/historique`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();

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
            <div className="min-h-screen bg-[#0f1111] flex justify-center items-center text-white text-base">
                🔒 Veuillez vous connecter pour accéder à votre historique.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f1111] flex justify-center items-center">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f1111] text-slate-100 p-4 sm:p-8 pb-24 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/dashboard-client')}
                        className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors bg-[#131921] border border-slate-800 px-4 py-2.5 rounded-xl"
                    >
                        ← Retour au Dashboard
                    </button>
                    <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                        🧾 Historique des paiements
                    </h1>
                </div>

                {erreur && (
                    <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs p-4 rounded-xl">
                        ⚠️ {erreur}
                    </div>
                )}

                {paiements.length === 0 ? (
                    <div className="bg-[#131921] border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                        <p className="text-slate-400 text-sm">Aucun paiement enregistré pour le moment.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="text-xs bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-500 transition"
                        >
                            Découvrir nos services
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {paiements.map((p) => {
                            const statutStyle =
                                p.statut === 'confirmé' || p.statut === 'valide' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    p.statut === 'en_attente' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                        'bg-rose-500/10 text-rose-400 border-rose-500/20';

                            return (
                                <div key={p.id || p.referenceTransaction} className="bg-[#131921] border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-slate-700 transition">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-4 border-b border-slate-800">
                                        <div>
                                            <h2 className="text-base font-bold text-white font-mono">
                                                Transaction #{p.referenceClient || p.transactionId || p.id}
                                            </h2>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Date non disponible'}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${statutStyle}`}>
                                            {p.statut || 'en_attente'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                                            <span className="text-slate-500 block mb-1">Montant payé</span>
                                            <span className="text-indigo-400 font-mono font-bold text-sm">
                                                {(p.montant || 0).toLocaleString()} FCFA
                                            </span>
                                        </div>
                                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                                            <span className="text-slate-500 block mb-1">Mode de paiement</span>
                                            <span className="text-slate-200 font-semibold uppercase">
                                                {p.modePaiement || 'Mobile Money'}
                                            </span>
                                        </div>
                                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
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