import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduits } from '../util/api';
import { usePanier } from '../context/PanierContext';

export default function ProduitsParFournisseur({ setCurrentView = () => { } }) {
    const { fournisseurId: urlParamId } = useParams();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const [fournisseur, setFournisseur] = useState(null);
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ajoutes, setAjoutes] = useState({});

    const { ajouterAuPanier, nombreArticles } = usePanier();

    // 1. Récupération des données
    useEffect(() => {
        const loadData = async () => {
            const activeId = urlParamId || JSON.parse(localStorage.getItem('selectedFournisseur'))?.id;

            if (!activeId) {
                console.warn("Aucun ID de fournisseur trouvé");
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                console.log("Appel API pour fournisseur :", activeId);
                const res = await getProduits({ fournisseurId: activeId });

                // On normalise les données reçues
                const liste = res.data || res || [];
                console.log("Produits reçus :", liste);

                setProduits(liste);

                // Si on a des produits, on tente de récupérer les infos du fournisseur via le premier produit
                if (liste.length > 0 && liste[0].fournisseur) {
                    setFournisseur(liste[0].fournisseur);
                }
            } catch (err) {
                console.error('Erreur critique chargement produits :', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [urlParamId]);

    const handleCommander = (produit) => {
        ajouterAuPanier({
            id: produit.id || produit._id,
            nom: produit.nom,
            prix: parseFloat(produit.prix),
            image: produit.image || produit.photo || produit.url,
        });
        setAjoutes((prev) => ({ ...prev, [produit.id || produit._id]: true }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-purple-400">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-xl uppercase tracking-widest">Chargement...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-500 hover:text-white transition"
                    >
                        ← Retour
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

                <div className="mb-10 bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
                    <h1 className="text-4xl font-black text-white">
                        {fournisseur?.nomEntreprise || 'Catalogue'}
                    </h1>
                    <p className="text-slate-400 mt-2">ID du fournisseur : {urlParamId || 'N/A'}</p>
                </div>

                {produits.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-slate-900/20 rounded-3xl border border-slate-800/50">
                        Aucun produit trouvé pour ce prestataire.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {produits.map((p) => {
                            const rawUrl = p.image || p.photo || p.url || '';
                            // Si l'image ne commence pas par http, on ajoute l'API_URL
                            const imageUrl = rawUrl.startsWith('http') ? rawUrl : `${API_URL}/uploads/${rawUrl}`;
                            const pId = p.id || p._id;

                            return (
                                <div key={pId} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col hover:border-purple-500/50 transition">
                                    <div className="w-full h-48 mb-4 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                                        <img
                                            src={imageUrl}
                                            alt={p.nom}
                                            className="w-full h-full object-cover"
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Pas+d+image'}
                                        />
                                    </div>
                                    <div className="px-2">
                                        <h3 className="font-bold text-lg text-white mb-1 truncate">{p.nom}</h3>
                                        <p className="text-purple-400 font-black text-xl mb-6">{parseFloat(p.prix || 0).toLocaleString()} FCFA</p>
                                        <button
                                            onClick={() => handleCommander(p)}
                                            className={`mt-auto w-full py-3 rounded-xl font-bold transition ${ajoutes[pId] ? "bg-emerald-600" : "bg-purple-600 hover:bg-purple-500"}`}
                                        >
                                            {ajoutes[pId] ? "✓ Ajouté" : "Commander"}
                                        </button>
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