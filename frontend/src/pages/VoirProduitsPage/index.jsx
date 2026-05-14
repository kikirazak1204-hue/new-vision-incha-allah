import React, { useEffect, useState } from 'react';
import { usePanier } from '../../context/PanierContext';

export default function VoirProduits() {
    const [produits, setProduits] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [ajouteId, setAjouteId] = useState(null);
    const { ajouterAuPanier } = usePanier();

    useEffect(() => {
        const fetchProduits = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/produits`).then(r => r.json());
                setProduits(res.data || []);
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
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center text-white">
                <p className="text-xl animate-pulse">⏳ Chargement des produits...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-8 text-center">🛍️ Produits disponibles</h1>

            {message && (
                <div className="text-center mb-6 text-red-400 font-semibold">
                    {message}
                </div>
            )}

            {produits.length === 0 && !message && (
                <p className="text-center text-white/70 text-lg">
                    Aucun produit disponible pour le moment.
                </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {produits.map(produit => (
                    <div
                        key={produit.id}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col hover:bg-white/10 hover:shadow-lg transition-all"
                    >
                        {produit.image && (
                            <img
                                src={`${import.meta.env.VITE_API_URL}/uploads/${produit.image}`}
                                alt={produit.nom}
                                className="w-full h-48 object-cover rounded-lg mb-3"
                            />
                        )}
                        <h2 className="text-xl font-bold text-white">{produit.nom}</h2>
                        <p className="text-sm text-white/70 mt-1">{produit.description}</p>
                        <p className="mt-2 font-semibold text-green-300">{produit.prix} FCFA</p>

                        <div className="mt-4">
                            <button
                                onClick={() => handleAjouter(produit)}
                                className={`w-full py-2 px-4 rounded font-semibold transition-all ${ajouteId === produit.id
                                    ? 'bg-green-500 text-white cursor-default'
                                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                                    }`}
                                disabled={ajouteId === produit.id}
                            >
                                {ajouteId === produit.id ? '✅ Ajouté !' : '🛒 Ajouter au panier'}
                            </button>
                        </div>

                        <div className="mt-4 text-sm text-white/60">
                            {produit.fournisseur?.nomEntreprise && (
                                <p><strong>Fournisseur:</strong> {produit.fournisseur.nomEntreprise}</p>
                            )}
                            {produit.produitService?.nom && (
                                <p><strong>Service:</strong> {produit.produitService.nom}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
