import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePanier } from '../../context/PanierContext';

export default function VoirProduits() {
    const navigate = useNavigate();
    const [produits, setProduits] = useState([]);
    const [recherche, setRecherche] = useState('');
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

    const produitsFiltres = produits.filter(produit =>
        produit.nom?.toLowerCase().includes(recherche.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 p-4">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-[#061a3a] border-t-amber-400 rounded-full animate-spin"></div>
                    <p className="animate-pulse font-bold text-sm tracking-wide text-[#061a3a]">
                        Chargement du catalogue Kanari...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 text-[#061a3a]">
            <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl">
                
                {/* Header Style Kanari (Bleu Nuit #061a3a & Ambre) */}
                <header className="bg-[#061a3a] px-6 py-7 text-white md:px-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <button
                                onClick={() => navigate('/')}
                                className="mb-3 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-1.5 text-xs font-bold text-amber-400 transition hover:bg-white/20"
                            >
                                ← Retour à l'accueil
                            </button>
                            <div className="text-xs font-black uppercase tracking-[.25em] text-amber-400">
                                KANARI SERVICE
                            </div>
                            <h1 className="mt-1 text-2xl font-black md:text-3xl">
                                Catalogue Produits & Équipements
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                                Matériaux et articles de qualité proposés par nos partenaires et fournisseurs certifiés.
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-400 text-3xl font-black text-[#061a3a] md:grid">
                                K
                            </div>
                        </div>
                    </div>
                </header>

                {/* Section Principale */}
                <div className="p-6 md:p-10">
                    
                    {/* Barre de Recherche (Identique au style des inputs du Register) */}
                    <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-6">
                        <label className="block">
                            <span className="mb-2 block text-xs font-black uppercase tracking-wider text-amber-500">
                                🔍 Rechercher dans le catalogue
                            </span>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Tapez le nom d'un produit ou équipement..."
                                    value={recherche}
                                    onChange={(e) => setRecherche(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium !text-[#061a3a] placeholder:!text-slate-400 caret-[#061a3a] selection:bg-amber-200 selection:text-[#061a3a] outline-none shadow-sm transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                                />
                                {recherche && (
                                    <button
                                        onClick={() => setRecherche('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-[#061a3a]"
                                    >
                                        Effacer
                                    </button>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Affichage des Messages d'erreur */}
                    {message && (
                        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                            {message}
                        </div>
                    )}

                    {/* Liste des Produits */}
                    {produitsFiltres.length === 0 && !message ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 py-16 text-center">
                            <span className="text-4xl block mb-2">📦</span>
                            <h3 className="text-base font-black text-[#061a3a]">Aucun produit trouvé</h3>
                            <p className="mt-1 text-sm text-slate-500">
                                {recherche ? "Ajustez vos mots clés de recherche." : "Aucun article n'est disponible pour le moment."}
                            </p>
                            {recherche && (
                                <button
                                    onClick={() => setRecherche('')}
                                    className="mt-4 rounded-xl bg-[#061a3a] px-4 py-2 text-xs font-bold text-amber-400 hover:bg-[#0a2550]"
                                >
                                    Réinitialiser la recherche
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {produitsFiltres.map((produit) => (
                                <div
                                    key={produit.id}
                                    className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-amber-400 hover:shadow-md"
                                >
                                    <div>
                                        {/* Image du produit */}
                                        <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-100 flex items-center justify-center">
                                            {produit.image ? (
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL}/uploads/${produit.image}`}
                                                    alt={produit.nom}
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-3xl opacity-30">📷</span>
                                            )}

                                            {/* Badge Fournisseur (Style Bleu Nuit / Ambre) */}
                                            <div className="absolute top-2 left-2 rounded-lg bg-[#061a3a] px-2.5 py-1 text-[10px] font-bold text-amber-400 shadow-sm max-w-[85%] truncate">
                                                {produit.fournisseur?.nomEntreprise || 'Fournisseur Kanari'}
                                            </div>
                                        </div>

                                        {/* Titre & Description */}
                                        <h2 className="text-sm font-black text-[#061a3a] line-clamp-1 group-hover:text-amber-500 transition-colors">
                                            {produit.nom}
                                        </h2>
                                        <p className="mt-1 text-xs leading-relaxed text-slate-500 line-clamp-2">
                                            {produit.description || 'Aucune description fournie.'}
                                        </p>
                                    </div>

                                    {/* Bas de Carte : Prix & Action */}
                                    <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                                        <div>
                                            <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                                                Prix
                                            </span>
                                            <span className="text-base font-black text-[#061a3a]">
                                                {Number(produit.prix || 0).toLocaleString('fr-FR')} 
                                                <span className="ml-1 text-xs font-bold text-amber-500">FCFA</span>
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handleAjouter(produit)}
                                            disabled={ajouteId === produit.id}
                                            className={`rounded-xl px-3.5 py-2 text-xs font-black transition-all ${
                                                ajouteId === produit.id
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                                    : 'bg-amber-400 text-[#061a3a] hover:bg-amber-500 shadow-sm active:scale-95'
                                            }`}
                                        >
                                            {ajouteId === produit.id ? '✓ Ajouté' : '+ Ajouter'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Style Register */}
                <footer className="border-t border-slate-100 bg-slate-50 py-6 text-center text-xs font-semibold text-slate-400">
                    KANARI SERVICE — Un réseau pour tous
                </footer>
            </div>
        </div>
    );
}