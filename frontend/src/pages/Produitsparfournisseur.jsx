import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // 1. Ajout des outils de lecture d'URL
import { getProduits } from '../util/api';
import { usePanier } from '../context/PanierContext';

export default function ProduitsParFournisseur({ setCurrentView = () => {} }) {
    // 2. Le composant lit l'URL (ex: /produits/456) et capture automatiquement "456"
    const { fournisseurId: urlParamId } = useParams();
    const navigate = useNavigate();

    // 3. Mémoire de secours : si l'URL est bizarre, il va repêcher le pro cliqué juste avant
    const [fournisseur, setFournisseur] = useState(() => {
        try { return JSON.parse(localStorage.getItem('selectedFournisseur')) || null; }
        catch { return null; }
    });

    const activeFournisseurId = urlParamId || fournisseur?.id || fournisseur?._id;

    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ajoutes, setAjoutes] = useState({});

    const { ajouterAuPanier, nombreArticles } = usePanier();

    useEffect(() => {
        const loadData = async () => {
            if (!activeFournisseurId) {
                console.warn("Aucun fournisseurId trouvé dans l'URL");
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // On lance la recherche API avec le VRAI ID de l'URL
                const res = await getProduits({ fournisseurId: activeFournisseurId });
                const liste = res.data || res || [];
                setProduits(liste);
                
                if (liste.length > 0 && liste[0].fournisseur) {
                    setFournisseur(liste[0].fournisseur);
                }
            } catch (err) {
                console.error('Erreur chargement produits :', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [activeFournisseurId]);

    const handleCommander = (produit) => {
        ajouterAuPanier({
            id: produit.id,
            nom: produit.nom,
            prix: parseFloat(produit.prix),
            image: produit.image,
        });

        setAjoutes((prev) => ({ ...prev, [produit.id]: true }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-purple-400">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-xl uppercase tracking-widest">Chargement des articles...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    {/* 💡 ASTUCE PRO : navigate(-1) demande au navigateur de faire "Page précédente" */}
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center gap-2 text-slate-500 hover:text-white transition"
                    >
                        ← Retour au professionnel
                    </button>

                    {nombreArticles > 0 && (
                        <button 
                            onClick={() => setCurrentView('panier')} 
                            className="bg-purple-600 px-5 py-2 rounded-xl font-bold text-sm hover:bg-purple-500 transition shadow-lg shadow-purple-600/20"
                        >
                            🛒 Panier ({nombreArticles})
                        </button>
                    )}
                </div>

                {/* Profil du Pro */}
                <div className="mb-10 bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                        {fournisseur?.nomEntreprise || 'Catalogue de produits'}
                    </h1>
                </div>

                {/* Grille des produits */}
                {produits.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-slate-900/20 rounded-3xl border border-slate-800/50">
                        Ce prestataire n'a pas encore mis d'articles en vente sur la plateforme.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {produits.map((p) => (
                            <div key={p.id || p._id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col hover:border-purple-500/50 transition shadow-lg">
                                <h3 className="font-bold text-lg text-white mb-2">{p.nom}</h3>
                                <p className="text-purple-400 font-black text-xl mb-6">{parseFloat(p.prix).toLocaleString()} FCFA</p>
                                
                                <button
                                    onClick={() => handleCommander(p)}
                                    className={`mt-auto w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                                        ajoutes[p.id] 
                                        ? "bg-emerald-600 text-white" 
                                        : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 shadow-md shadow-purple-600/10"
                                    }`}
                                >
                                    {ajoutes[p.id] ? "✓ Ajouté au panier" : "Commander"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}