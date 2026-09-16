import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ImageOff, Check, ShoppingBag } from 'lucide-react';
import { usePanier } from '../../context/PanierContext';

const API = import.meta.env.VITE_API_URL;

function CarteProduit({ produit, ajoute, onAjouter }) {
    const [imageEnErreur, setImageEnErreur] = useState(!produit.image);

    return (
        <div className="group bg-white/[0.02] border border-white/[0.07] hover:border-purple-500/40 rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-purple-950/20">
            <div className="relative aspect-square w-full overflow-hidden bg-[#0B0F19]">
                {!imageEnErreur ? (
                    <img
                        src={`${API}/uploads/${produit.image}`}
                        alt={produit.nom}
                        onError={() => setImageEnErreur(true)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-white/[0.03] to-transparent">
                        <ImageOff className="text-slate-700" size={28} strokeWidth={1.5} />
                        <span className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold">Photo indisponible</span>
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                {produit.categorie && (
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-slate-200 border border-white/10">
                        {produit.categorie}
                    </span>
                )}
            </div>

            <div className="p-5 flex flex-col flex-1">
                <h2 className="text-base font-bold text-white leading-snug line-clamp-1">{produit.nom}</h2>
                {produit.description && (
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 flex-1">{produit.description}</p>
                )}

                <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-white/[0.05]">
                    <span className="text-lg font-black text-emerald-400">
                        {Number(produit.prix || 0).toLocaleString('fr-FR')} FCFA
                    </span>
                    <button
                        onClick={() => onAjouter(produit)}
                        disabled={ajoute === produit.id}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                            ajoute === produit.id
                                ? 'bg-emerald-500 text-slate-950 cursor-default'
                                : 'bg-white text-slate-950 hover:bg-purple-100'
                        }`}
                    >
                        {ajoute === produit.id ? (
                            <>
                                <Check size={14} /> Ajouté
                            </>
                        ) : (
                            'Ajouter'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CarteChargement() {
    return (
        <div className="rounded-3xl overflow-hidden border border-white/[0.05] bg-white/[0.02]">
            <div className="aspect-square w-full bg-white/[0.03] animate-pulse" />
            <div className="p-5 space-y-3">
                <div className="h-4 w-3/4 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-3 w-full bg-white/[0.03] rounded animate-pulse" />
                <div className="h-8 w-full bg-white/[0.03] rounded-xl animate-pulse mt-2" />
            </div>
        </div>
    );
}

export default function VoirProduits() {
    const navigate = useNavigate();
    const [produits, setProduits] = useState([]);
    const [erreur, setErreur] = useState('');
    const [loading, setLoading] = useState(true);
    const [ajouteId, setAjouteId] = useState(null);
    const [recherche, setRecherche] = useState('');
    const [categorieActive, setCategorieActive] = useState('toutes');
    const { ajouterAuPanier } = usePanier();

    useEffect(() => {
        const fetchProduits = async () => {
            try {
                const res = await fetch(`${API}/api/produits`);
                const data = await res.json();
                setProduits(data.data || []);
            } catch (err) {
                console.error("Erreur chargement produits:", err);
                setErreur("Impossible de charger le catalogue pour le moment.");
            } finally {
                setLoading(false);
            }
        };
        fetchProduits();
    }, []);

    const categories = useMemo(() => {
        const set = new Set(produits.map(p => p.categorie).filter(Boolean));
        return ['toutes', ...Array.from(set)];
    }, [produits]);

    const produitsFiltres = useMemo(() => {
        return produits.filter(p => {
            const matchCategorie = categorieActive === 'toutes' || p.categorie === categorieActive;
            const matchRecherche = (p.nom || '').toLowerCase().includes(recherche.toLowerCase());
            return matchCategorie && matchRecherche;
        });
    }, [produits, categorieActive, recherche]);

    const handleAjouter = (produit) => {
        ajouterAuPanier(produit);
        setAjouteId(produit.id);
        setTimeout(() => setAjouteId(null), 1500);
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans">
            <div className="max-w-6xl mx-auto px-6 py-10 md:py-12">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <button
                            onClick={() => navigate('/')}
                            className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors mb-4 text-sm"
                        >
                            <ArrowLeft size={16} /> Retour à l'accueil
                        </button>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                            <ShoppingBag className="text-purple-400" size={30} />
                            Catalogue Produits
                        </h1>
                    </div>

                    <div className="relative w-full md:w-72 shrink-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher un produit..."
                            value={recherche}
                            onChange={(e) => setRecherche(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                        />
                    </div>
                </div>

                {categories.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategorieActive(cat)}
                                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all border ${
                                    categorieActive === cat
                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-transparent text-white shadow-lg'
                                        : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20'
                                }`}
                            >
                                {cat === 'toutes' ? 'Toutes' : cat}
                            </button>
                        ))}
                    </div>
                )}

                {erreur && (
                    <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm text-center">
                        {erreur}
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                        {Array.from({ length: 8 }).map((_, i) => <CarteChargement key={i} />)}
                    </div>
                ) : produitsFiltres.length === 0 ? (
                    <div className="text-center py-24 bg-white/[0.02] rounded-3xl border border-white/[0.05]">
                        <ShoppingBag className="mx-auto text-slate-700 mb-3" size={32} strokeWidth={1.5} />
                        <p className="text-slate-400 text-sm">
                            {recherche || categorieActive !== 'toutes'
                                ? 'Aucun produit ne correspond à votre recherche.'
                                : 'Aucun produit disponible pour le moment.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                        {produitsFiltres.map(produit => (
                            <CarteProduit
                                key={produit.id}
                                produit={produit}
                                ajoute={ajouteId}
                                onAjouter={handleAjouter}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}