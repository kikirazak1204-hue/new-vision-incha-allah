import React, { useState } from 'react';
import { usePanier } from '../../context/PanierContext';
import { useNavigate } from 'react-router-dom';

const PanierPage = () => {
    const navigate = useNavigate();
    const {
        panier,
        totalPanier,
        nombreArticles,
        retirerDuPanier,
        modifierQuantite,
        viderPanier
    } = usePanier();

    const [loading, setLoading] = useState(false);

    const handlePasserCommande = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/commandes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    produits: panier.map(item => ({
                        produitId: item.id,
                        quantite: item.quantite
                    })),
                    fraisLivraison: 0
                }),
            });

            const data = await response.json();

            if (data.success && data.commandeId) {
                const infoPaiement = {
                    commandeId: data.commandeId,
                    montant_total: data.montant_total
                };
                localStorage.setItem("lastCommande", JSON.stringify(infoPaiement));
                navigate('/paiement', { state: infoPaiement });
            } else {
                alert(data.message || "Erreur lors de la validation");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur réseau : vérifiez votre connexion.");
        } finally {
            setLoading(false);
        }
    };

    if (panier.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white p-4 md:p-8">
                <div className="max-w-3xl mx-auto space-y-6">
                    <h2 className="text-3xl font-bold text-center">🛒 Votre panier</h2>
                    <div className="text-center py-16">
                        <p className="text-white/70 text-lg">Votre panier est vide.</p>
                        <button
                            onClick={() => navigate('/produits')}
                            className="mt-4 text-purple-300 hover:text-purple-200 underline transition-colors"
                        >
                            Retourner aux produits
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* EN-TÊTE DU PANIER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <h2 className="text-2xl md:text-3xl font-bold">
                        🛒 Votre Panier
                        <span className="text-sm font-normal text-white/60 ml-3">
                            ({nombreArticles} article{nombreArticles > 1 ? 's' : ''})
                        </span>
                    </h2>
                    <button
                        onClick={viderPanier}
                        className="text-sm text-red-400 hover:text-red-300 underline mt-2 md:mt-0 transition-colors"
                    >
                        🗑️ Vider le panier
                    </button>
                </div>

                {/* LISTE DES ARTICLES */}
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {panier.map(item => (
                        <div
                            key={item.id}
                            className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 md:flex-row md:items-center hover:bg-white/10 transition-all"
                        >
                            {/* Infos produit */}
                            <div className="flex-1">
                                <h3 className="text-base md:text-lg font-semibold text-white line-clamp-1">
                                    {item.nom}
                                </h3>
                                <p className="text-sm text-white/60 mt-0.5">
                                    {item.prix.toLocaleString()} FCFA
                                </p>
                            </div>

                            {/* Quantité + boutons +/- */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => modifierQuantite(item.id, item.quantite - 1)}
                                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
                                >
                                    −
                                </button>
                                <span className="w-6 text-center font-semibold text-white">
                                    {item.quantite}
                                </span>
                                <button
                                    onClick={() => modifierQuantite(item.id, item.quantite + 1)}
                                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
                                >
                                    +
                                </button>
                            </div>

                            {/* Total + prix total article + bouton X */}
                            <div className="flex items-center gap-4 md:gap-0 md:flex-col md:items-end">
                                <span className="font-semibold text-green-300 text-right">
                                    {(item.prix * item.quantite).toLocaleString()} FCFA
                                </span>
                                <button
                                    onClick={() => retirerDuPanier(item.id)}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* RÉCAPITULATIF TOTAL ET BOUTON */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-white/60 text-sm md:text-base">Total à payer</span>
                        <span className="text-2xl md:text-3xl font-bold text-green-300">
                            {totalPanier.toLocaleString()} FCFA
                        </span>
                    </div>

                    <button
                        onClick={handlePasserCommande}
                        disabled={loading}
                        className="w-full py-3 px-6 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed
              bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                    >
                        {loading ? "⏳ TRAITEMENT EN COURS…" : "✅ VALIDER ET PAYER"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PanierPage;
