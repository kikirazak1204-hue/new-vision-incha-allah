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
            <div className="min-h-screen bg-[#0f1111] flex items-center justify-center text-slate-400">
                <p className="animate-pulse font-medium">Chargement du catalogue...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f1111] text-slate-100 p-6 md:p-12">
            {/* Header / Navigation */}
            <div className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <button
                    onClick={() => navigate('/')}
                    className="text-slate-400 hover:text-white flex items-center gap-2 transition-all w-fit"
                >
                    ← Retour à l'accueil
                </button>
                <h1 className="text-4xl font-black tracking-tight">🛍️ Catalogue Produits</h1>
            </div>

            {/* Message d'erreur */}
            {message && (
                <div className="max-w-6xl mx-auto text-center mb-8 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400">
                    {message}
                </div>
            )}

            {/* Liste Produits */}
            {produits.length === 0 && !message ? (
                <div className="max-w-6xl mx-auto text-center py-20 bg-[#131921] rounded-3xl border border-slate-800">
                    <p className="text-slate-500 text-lg">Aucun produit disponible pour le moment.</p>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {produits.map(produit => (
                        <div
                            key={produit.id}
                            className="bg-[#131921] border border-slate-800 rounded-3xl p-5 flex flex-col hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-900/10 transition-all duration-300"
                        >
                            {/* Image avec ratio fixe pour harmonie */}
                            {produit.image && (
                                <div className="aspect-video w-full overflow-hidden rounded-2xl mb-4 bg-slate-800">
                                    <img
                                        src={`${import.meta.env.VITE_API_URL}/uploads/${produit.image}`}
                                        alt={produit.nom}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <h2 className="text-xl font-bold mb-1">{produit.nom}</h2>
                            <p className="text-sm text-slate-400 mb-4 flex-grow">{produit.description}</p>

                            <div className="flex items-end justify-between gap-4 mt-2">
                                <span className="text-lg font-black text-green-400">{produit.prix} FCFA</span>

                                <button
                                    onClick={() => handleAjouter(produit)}
                                    className={`px-4 py-2 rounded-xl font-bold transition-all ${ajouteId === produit.id
                                            ? 'bg-green-600 text-white cursor-default'
                                            : 'bg-white text-[#0f1111] hover:bg-slate-200'
                                        }`}
                                    disabled={ajouteId === produit.id}
                                >
                                    {ajouteId === produit.id ? '✅ Ajouté' : 'Ajouter'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}