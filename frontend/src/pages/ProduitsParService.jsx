import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, ShoppingCart, Loader2 } from 'lucide-react';
import { usePanier } from '../context/PanierContext';

export default function ProduitsParService() {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    const { ajouterAuPanier } = usePanier();

    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProduits = async () => {
            if (!serviceId) return;

            try {
                setLoading(true);
                // Appel API pour récupérer les produits filtrés par serviceId
                const response = await fetch(`https://newvision-backend.onrender.com/api/produits?serviceId=${serviceId}`);

                if (!response.ok) throw new Error("Impossible de charger les produits");

                const data = await response.json();
                setProduits(data.data || data); // Gère les formats de réponse différents
            } catch (err) {
                console.error("Erreur:", err);
                setError("Une erreur est survenue lors du chargement.");
            } finally {
                setLoading(false);
            }
        };

        fetchProduits();
    }, [serviceId]);

    return (
        <div className="min-h-screen bg-[#0f1111] text-slate-100 p-6 md:p-12 font-sans">
            <div className="max-w-6xl mx-auto">

                {/* BOUTON RETOUR */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-all hover:translate-x-[-5px] font-medium"
                >
                    <ArrowLeft size={20} /> Retour au service
                </button>

                {/* EN-TÊTE */}
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-white mb-2">Tous les produits</h1>
                    <p className="text-slate-400">Découvrez l'ensemble du catalogue disponible pour ce service.</p>
                </div>

                {/* ÉTAT CHARGEMENT */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-purple-400">
                        <Loader2 className="w-12 h-12 animate-spin mb-4" />
                        <p className="font-bold">Chargement du catalogue...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-rose-400">
                        <p>{error}</p>
                    </div>
                ) : produits.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800">
                        <p className="text-slate-500 text-lg">Aucun produit disponible pour ce service.</p>
                    </div>
                ) : (
                    /* GRILLE DES PRODUITS */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {produits.map((p) => (
                            <div key={p.id || p._id} className="bg-[#131921] border border-slate-800 p-6 rounded-3xl hover:border-purple-500/50 transition-all flex flex-col shadow-xl group">
                                <div className="w-full h-40 bg-slate-900 rounded-2xl mb-4 flex items-center justify-center text-4xl overflow-hidden">
                                    {p.image ? (
                                        <img src={`https://newvision-backend.onrender.com/uploads/${p.image}`} alt={p.nom} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="text-slate-700" size={40} />
                                    )}
                                </div>

                                <h3 className="font-bold text-lg text-white mb-1">{p.nom}</h3>
                                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{p.description}</p>

                                <div className="mt-auto pt-4 border-t border-slate-800/80 flex items-center justify-between">
                                    <span className="font-black text-purple-400 text-lg">{p.prix?.toLocaleString()} FCFA</span>
                                    <button
                                        onClick={() => ajouterAuPanier(p)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl transition active:scale-95 shadow-lg shadow-purple-900/20"
                                    >
                                        <ShoppingCart size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}