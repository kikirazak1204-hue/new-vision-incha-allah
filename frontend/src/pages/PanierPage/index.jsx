// ============================================================
// Fichier : src/pages/PanierPage/index.jsx
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePanier } from '../../context/PanierContext';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

const getImageUrl = (imageSrc) => {
    if (!imageSrc || typeof imageSrc !== 'string') return null;
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://') || imageSrc.startsWith('data:')) {
        return imageSrc;
    }
    const cleanPath = imageSrc.replace(/^\/+/, '');
    if (cleanPath.startsWith('uploads/')) {
        return `${API_URL}/${cleanPath}`;
    }
    return `${API_URL}/uploads/${cleanPath}`;
};

export default function PanierPage() {
    const navigate = useNavigate();
    const {
        panier = [],
        totalPanier = 0,
        modifierQuantite,
        retirerDuPanier,
        viderPanier
    } = usePanier();

    const [devise, setDevise] = useState('FCFA');

    const tauxConversion = { FCFA: 1, EUR: 1 / 655.95, USD: 1 / 600 };
    const symbolesDevise = { FCFA: 'FCFA', EUR: '€', USD: '$' };

    const formatPrix = (prixEnFCFA) => {
        const montantConverti = (Number(prixEnFCFA) || 0) * tauxConversion[devise];
        if (devise === 'FCFA') return `${Math.round(montantConverti).toLocaleString()} FCFA`;
        return `${montantConverti.toFixed(2)} ${symbolesDevise[devise]}`;
    };

    // ⭐ FONCTION DE REDIRECTION ROBUSTE VERS LE PAIEMENT
    const handleProcederPaiement = () => {
        if (!panier || panier.length === 0) return;

        // 1. Création d'un objet commande standardisé
        const commandeData = {
            id: 'CMD-' + Date.now(),
            articles: panier,
            montantTotal: totalPanier,
            devise: devise,
            date: new Date().toISOString()
        };

        // 2. Sauvegarde de secours dans le localStorage (anti-bug si F5/rechargement)
        localStorage.setItem('commandeCourante', JSON.stringify(commandeData));

        // 3. Navigation avec transmission complète dans le state
        navigate('/paiement', {
            state: {
                commande: commandeData, // Format attendu par la plupart des logiques
                panier: panier,         // Format alternatif
                total: totalPanier,     // Format alternatif
                devise: devise
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#0f1111] text-slate-100 font-sans selection:bg-purple-500/30 pb-20">
            <header className="bg-[#131921] border-b border-slate-800 px-6 py-5 sticky top-0 z-40 shadow-lg">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-purple-400 transition group self-start sm:self-center"
                    >
                        <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Retour
                    </button>

                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-center sm:text-left">
                        MON <span className="text-purple-500">PANIER</span>
                        {panier.length > 0 && (
                            <span className="ml-3 text-xs bg-purple-500/20 text-purple-400 font-semibold px-3 py-1 rounded-full border border-purple-500/30">
                                {panier.length} article{panier.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </h1>

                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                        {['FCFA', 'EUR', 'USD'].map((m) => (
                            <button
                                key={m}
                                onClick={() => setDevise(m)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${devise === m
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                {m === 'EUR' ? 'EUR (€)' : m === 'USD' ? 'USD ($)' : 'FCFA'}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
                {panier.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-20 bg-[#131921] rounded-3xl border border-slate-800 p-8 max-w-xl mx-auto shadow-xl">
                        <div className="w-20 h-20 bg-slate-900 border border-slate-800 flex items-center justify-center rounded-2xl mb-6">
                            <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold mb-2">Votre panier est vide</h2>
                        <p className="text-slate-400 text-sm mb-6">Vous n'avez sélectionné aucun produit pour le moment.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-purple-900/30 active:scale-95"
                        >
                            Découvrir nos services
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-4">
                            {panier.map((item) => {
                                const itemId = item.id;
                                const rawImage = item.image || item.photo || item.imageUrl || item.image_url;
                                const fullImageUrl = getImageUrl(rawImage);

                                return (
                                    <div
                                        key={itemId}
                                        className="bg-[#131921] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-700 shadow-md"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                                                {fullImageUrl ? (
                                                    <img
                                                        src={fullImageUrl}
                                                        alt={item.nom || 'Produit'}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            if (e.currentTarget.nextElementSibling) {
                                                                e.currentTarget.nextElementSibling.style.display = 'flex';
                                                            }
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className="w-full h-full flex items-center justify-center text-2xl select-none"
                                                    style={{ display: fullImageUrl ? 'none' : 'flex' }}
                                                >
                                                    📦
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="font-bold text-slate-200 text-base">
                                                    {item.nom || 'Produit sans nom'}
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Prix unitaire : <span className="text-slate-300 font-medium">{formatPrix(item.prix)}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-slate-800/60 sm:border-0 pt-3 sm:pt-0">
                                            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
                                                <button
                                                    onClick={() => modifierQuantite(itemId, item.quantite - 1)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white font-bold transition rounded-lg hover:bg-slate-800"
                                                >
                                                    -
                                                </button>
                                                <span className="w-10 text-center font-bold text-sm text-purple-400">
                                                    {item.quantite}
                                                </span>
                                                <button
                                                    onClick={() => modifierQuantite(itemId, item.quantite + 1)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white font-bold transition rounded-lg hover:bg-slate-800"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <div className="text-right min-w-[100px]">
                                                <p className="font-extrabold text-sm text-white">
                                                    {formatPrix(item.prix * item.quantite)}
                                                </p>
                                                <button
                                                    onClick={() => retirerDuPanier(itemId)}
                                                    className="text-[11px] font-medium text-slate-500 hover:text-rose-400 mt-0.5 transition"
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={viderPanier}
                                    className="text-xs text-slate-500 hover:text-rose-400 transition"
                                >
                                    Vider le panier
                                </button>
                            </div>
                        </div>

                        <div className="bg-[#131921] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 lg:sticky lg:top-28">
                            <h2 className="text-lg font-black tracking-tight border-b border-slate-800 pb-4">
                                RÉCAPITULATIF
                            </h2>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-slate-400">
                                    <span>Sous-total</span>
                                    <span className="font-semibold text-slate-200">{formatPrix(totalPanier)}</span>
                                </div>
                            </div>

                            <div className="border-t border-slate-800 pt-4 flex items-baseline justify-between">
                                <span className="font-bold text-base">Total</span>
                                <p className="text-2xl font-black text-purple-400">{formatPrix(totalPanier)}</p>
                            </div>

                            {/* ⭐ APPEL DE LA FONCTION DE REDIRECTION */}
                            <button
                                onClick={handleProcederPaiement}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-black text-sm py-4 rounded-xl transition shadow-lg shadow-purple-900/30 active:scale-[0.98]"
                            >
                                Procéder au paiement 💳
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}