import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePanier } from '../../context/PanierContext';

export default function VoirProduits() {
    const navigate = useNavigate();
    const [produits, setProduits] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [ajouteId, setAjouteId] = useState(null);
    const { ajouterAuPanier } = usePanier();

    useEffect(() => {
        const fetchProduits = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/produits`);
                const data = await res.json();
                setProduits(data.data || []);
            } catch (err) {
                console.error("Erreur chargement produits:", err);
                setMessage("❌ Impossible de charger les produits.");
            } finally {
                setLoading(false);
            }
        };
        fetchProduits();
    }, []);

    const handleAjouter = (produit) => {
        ajouterAuPanier(produit);
        setAjouteId(produit.id);
        setTimeout(() => setAjouteId(null), 1500);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0b0d10] flex items-center justify-center text-slate-400">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="animate-pulse font-medium text-sm tracking-wide">Chargement du catalogue...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0d10] text-slate-100 p-6 md:p-12">
            {/* Header & Navigation */}
            <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
                <button
                    onClick={() => navigate('/')}
                    className="text-slate-400 hover:text-white flex items-center gap-2 transition-all w-fit bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 text-sm font-medium shadow-sm"
                >
                    ← Retour à l'accueil
                </button>
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                        🛍️ Catalogue Produits
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">Articles et équipements sélectionnés par nos partenaires</p>
                </div>
            </div>

            {/* Message d'erreur */}
            {message && (
                <div className="max-w-7xl mx-auto text-center mb-8 p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-400 text-sm">
                    {message}
                </div>
            )}

            {/* Liste Produits */}
            {produits.length === 0 && !message ? (
                <div className="max-w-7xl mx-auto text-center py-20 bg-[#12161c] rounded-3xl border border-slate-800/80 shadow-xl">
                    <span className="text-4xl mb-3 block">📦</span>
                    <p className="text-slate-400 text-base font-medium">Aucun produit disponible pour le moment.</p>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {produits.map(produit => (
                        <div
                            key={produit.id}
                            className="group bg-[#12161c] border border-slate-800/80 rounded-3xl p-4 flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-950/20 transition-all duration-300"
                        >
                            <div>
                                {/* Conteneur d'image robuste contre les photos mal cadrées */}
                                <div className="aspect-square w-full overflow-hidden rounded-2xl mb-4 bg-[#090b0e] relative flex items-center justify-center border border-slate-800/50">
                                    {produit.image ? (
                                        <img
                                            src={`${import.meta.env.VITE_API_URL}/uploads/${produit.image}`}
                                            alt={produit.nom}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <span className="text-3xl opacity-40">📷</span>
                                    )}
                                    {produit.categorie && (
                                        <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-slate-300 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/10">
                                            {produit.categorie}
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-lg font-bold mb-1 text-slate-100 group-hover:text-white line-clamp-1">{produit.nom}</h2>
                                <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">{produit.description || "Aucune description fournie pour cet article."}</p>
                            </div>

                            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-3">
                                <div>
                                    <span className="text-[10px] text-slate-500 uppercase block font-semibold tracking-wider">Prix unitaire</span>
                                    <span className="text-base font-black text-emerald-400">{Number(produit.prix || 0).toLocaleString()} FCFA</span>
                                </div>

                                <button
                                    onClick={() => handleAjouter(produit)}
                                    className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all tracking-wide shadow-md ${
                                        ajouteId === produit.id
                                            ? 'bg-emerald-600 text-white cursor-default scale-95'
                                            : 'bg-white text-[#0f1111] hover:bg-slate-200 active:scale-95'
                                    }`}
                                    disabled={ajouteId === produit.id}
                                >
                                    {ajouteId === produit.id ? '✓ Ajouté' : 'Ajouter'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}