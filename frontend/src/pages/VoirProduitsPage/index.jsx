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
        <div className="min-h-screen bg-[#0b0d10] text-slate-100 p-4 md:p-10">
            {/* Header & Navigation */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                <button
                    onClick={() => navigate('/')}
                    className="text-slate-400 hover:text-white flex items-center gap-2 transition-all w-fit bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800 hover:border-slate-700 text-sm font-medium"
                >
                    ← Retour à l'accueil
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                        🛍️ Catalogue Produits & Équipements
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Articles vérifiés proposés par nos prestataires partenaires</p>
                </div>
            </div>

            {/* Message d'erreur */}
            {message && (
                <div className="max-w-7xl mx-auto text-center mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    {message}
                </div>
            )}

            {/* Liste Produits en Grille 2 à 3 colonnes (fini le défilement vertical simple) */}
            {produits.length === 0 && !message ? (
                <div className="max-w-7xl mx-auto text-center py-20 bg-[#12161c] rounded-3xl border border-slate-800/80">
                    <span className="text-4xl mb-3 block">📦</span>
                    <p className="text-slate-400 text-sm font-medium">Aucun produit disponible pour le moment.</p>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {produits.map(produit => (
                        <div
                            key={produit.id}
                            className="group bg-[#12161c] border border-slate-800/80 rounded-2xl p-3 md:p-4 flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-xl transition-all duration-300"
                        >
                            <div>
                                {/* Conteneur image carré et propre */}
                                <div className="aspect-square w-full overflow-hidden rounded-xl mb-3 bg-[#090b0e] relative flex items-center justify-center border border-slate-800/50">
                                    {produit.image ? (
                                        <img
                                            src={`${import.meta.env.VITE_API_URL}/uploads/${produit.image}`}
                                            alt={produit.nom}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <span className="text-2xl opacity-40">📷</span>
                                    )}

                                    {/* Badge Fournisseur sur l'image ou en haut */}
                                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-md border border-white/10 truncate max-w-[80%]">
                                        🏢 {produit.fournisseur?.nomEntreprise || 'Partenaire Kanari'}
                                    </div>
                                </div>

                                <h2 className="text-sm md:text-base font-bold mb-1 text-slate-100 group-hover:text-white line-clamp-1">{produit.nom}</h2>
                                <p className="text-[11px] md:text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">{produit.description || "Aucune description fournie."}</p>
                            </div>

                            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                                <div>
                                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">Prix</span>
                                    <span className="text-sm md:text-base font-black text-emerald-400">{Number(produit.prix || 0).toLocaleString()} FCFA</span>
                                </div>

                                <button
                                    onClick={() => handleAjouter(produit)}
                                    className={`px-3 py-2 rounded-xl font-bold text-xs transition-all shadow-md ${
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