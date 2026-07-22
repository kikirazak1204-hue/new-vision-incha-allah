// ============================================================
// Fichier : src/pages/PaiementPage.jsx
// Gestion Paiements Niger (MyNita, Amana, Airtel, Zamani)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { usePanier } from '../context/PanierContext';

const API = import.meta.env.VITE_API_URL || '';

export default function PaiementPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { panier: panierContext, totalPanier: totalContext, viderPanier } = usePanier();

    const [commande, setCommande] = useState(null);
    const [loading, setLoading] = useState(true);

    // Mode de paiement sélectionné
    const [modePaiement, setModePaiement] = useState('mynita');

    // Champs du formulaire
    const [telephone, setTelephone] = useState('');
    const [referenceTransaction, setReferenceTransaction] = useState('');
    const [adresse, setAdresse] = useState('');

    const [enCoursDePaiement, setEnCoursDePaiement] = useState(false);
    const [erreur, setErreur] = useState('');

    // Vrais numéros de compte de votre entreprise au Niger
    const NUMEROS_RECEPTION = {
        mynita: '+227 90 00 00 00',
        amanata: '+227 96 00 00 00',
        airtel: '+227 99 00 00 00',
        zamani: '+227 97 00 00 00'
    };

    const token = localStorage.getItem('token');

    useEffect(() => {
        let donneesCommande = null;

        if (location.state?.commande) {
            donneesCommande = location.state.commande;
        } else {
            const saved = localStorage.getItem('commandeCourante');
            if (saved) {
                try { donneesCommande = JSON.parse(saved); } catch (e) { }
            }
        }

        if (!donneesCommande && panierContext && panierContext.length > 0) {
            donneesCommande = {
                id: 'CMD-' + Math.floor(100000 + Math.random() * 900000),
                articles: panierContext,
                montantTotal: totalContext,
                devise: 'FCFA'
            };
        }

        setCommande(donneesCommande);
        setLoading(false);
    }, [location.state, panierContext, totalContext]);

    // Validation du paiement avec appel API réel vers le backend
    const handlePayer = async (e) => {
        e.preventDefault();
        setErreur('');

        if (['mynita', 'amanata', 'airtel', 'zamani'].includes(modePaiement)) {
            if (!telephone || telephone.trim().length < 8) {
                setErreur('Veuillez saisir votre numéro de téléphone.');
                return;
            }
            if (!referenceTransaction || referenceTransaction.trim().length < 4) {
                setErreur('Veuillez saisir l\'ID / Référence de transaction reçu par SMS.');
                return;
            }
        }

        if (!adresse || adresse.trim().length < 5) {
            setErreur('Veuillez indiquer votre adresse ou quartier.');
            return;
        }

        setEnCoursDePaiement(true);

        try {
            // Appel API vers ton backend pour enregister la transaction / réservation
            const response = await fetch(`${API}/api/paiements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    commandeId: commande.id,
                    articles: commande.articles,
                    montant: commande.montantTotal,
                    modePaiement,
                    telephone,
                    referenceTransaction,
                    adresse
                })
            });

            const data = await response.json();

            if (!response.ok || (data && data.success === false)) {
                throw new Error(data?.message || "Erreur lors de l'enregistrement du paiement.");
            }

            localStorage.removeItem('commandeCourante');
            if (viderPanier) viderPanier();

            alert('🎉 Paiement enregistré avec succès ! Votre transaction est validée.');
            navigate('/dashboard-client', { replace: true });
        } catch (err) {
            console.error(err);
            setErreur(err.message || "Une erreur est survenue lors de la communication avec le serveur.");
        } finally {
            setEnCoursDePaiement(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f1111] text-white flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!commande || !commande.articles || commande.articles.length === 0) {
        return (
            <div className="min-h-screen bg-[#0f1111] text-slate-100 flex items-center justify-center p-6 text-center">
                <div className="bg-[#131921] border border-slate-800 p-8 rounded-3xl max-w-md w-full space-y-4">
                    <h2 className="text-xl font-bold text-white mb-2">Aucune commande en cours</h2>
                    <Link to="/panier" className="block bg-indigo-600 text-white font-bold py-3 rounded-xl">
                        ← Retour au panier
                    </Link>
                </div>
            </div>
        );
    }

    const totalTTC = commande.montantTotal || 0;
    const totalHT = Math.round(totalTTC / 1.19);

    return (
        <div className="min-h-screen bg-[#0f1111] text-slate-100 font-sans pb-24">
            <header className="bg-[#131921] border-b border-slate-800 px-6 py-4 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <button onClick={() => navigate('/panier')} className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors">
                        ← Retour au panier
                    </button>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        🔒 Paiement sécurisé
                    </span>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* FORMULAIRE DE PAIEMENT */}
                <div className="lg:col-span-7 bg-[#131921] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-left">
                    <div className="flex justify-between items-center mb-1">
                        <h1 className="text-lg font-bold text-white">Finaliser le paiement</h1>
                        <button onClick={() => navigate('/panier')} className="text-xs text-indigo-400 hover:underline">Modifier le panier</button>
                    </div>
                    <p className="text-xs text-slate-400 mb-6">Choisissez votre moyen de paiement habituel.</p>

                    {erreur && (
                        <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs p-4 rounded-xl">
                            ⚠️ {erreur}
                        </div>
                    )}

                    <form onSubmit={handlePayer} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                Moyen de paiement
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { id: 'mynita', label: 'MyNita', logo: 'https://play-lh.googleusercontent.com/XmjOjGGRqwZa7AFgXjiV_WpH-0DBl7X6X9sxLOigbQR_0zvraVoozgJE9QwYs1Hd2ino1s5g3jnCtRMTeL1Qug' },
                                    { id: 'amanata', label: 'AmanaTa', logo: 'https://play-lh.googleusercontent.com/VXDu6FNrz0TrAR0VZ-txL1oKfUTTgfUTB8Rl6VgPTA83PSiW458bo7FECzaiPQIg7LFbg8dsEDT22R2iDfxFrSM' },
                                    { id: 'airtel', label: 'Airtel Money', logo: 'https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcRVgKvwzzapX-uj4muwH3wSqDtyaUfSyNHg6nJq_KKFOsHuUSrBMpRTxMMoE-6DcJoT5rJtIVRlAfmKlD8' },
                                    { id: 'zamani', label: 'Zamani Cash', logo: 'https://www.zamanitelecom.com/sites/default/files/inline-images/Logo-Zamani-Cash%20%281%29.png' },
                                ].map((mode) => (
                                    <button
                                        type="button"
                                        key={mode.id}
                                        onClick={() => { setModePaiement(mode.id); setErreur(''); }}
                                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition ${modePaiement === mode.id
                                            ? 'bg-slate-800 border-indigo-500 text-white shadow-lg'
                                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                            }`}
                                    >
                                        <img src={mode.logo} alt={mode.label} className="w-10 h-10 object-contain rounded-lg" />
                                        <span className="text-xs font-medium">{mode.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                            <div className="text-xs text-slate-300 space-y-2">
                                <p className="font-bold text-white text-sm">Instruction de transfert :</p>
                                <p className="text-slate-400">
                                    Faites un transfert de <strong className="text-indigo-400 font-mono">{totalTTC.toLocaleString()} FCFA</strong> vers notre compte officiel :
                                </p>
                                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center font-mono font-bold text-indigo-400 text-base">
                                    {NUMEROS_RECEPTION[modePaiement]}
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">Votre numéro de téléphone</label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="Ex: 90 00 00 00"
                                        value={telephone}
                                        onChange={(e) => setTelephone(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">
                                        ID / Référence de transaction (reçu par SMS)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: TXN-894021"
                                        value={referenceTransaction}
                                        onChange={(e) => setReferenceTransaction(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Lieu de prestation / Adresse
                            </label>
                            <textarea
                                required
                                rows={2}
                                placeholder="Quartier, rue ou indication exacte..."
                                value={adresse}
                                onChange={(e) => setAdresse(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={enCoursDePaiement}
                            className={`w-full font-bold text-sm py-4 rounded-xl transition shadow-lg ${enCoursDePaiement ? 'bg-indigo-600/50 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white'}`}
                        >
                            {enCoursDePaiement ? 'Enregistrement en cours...' : `Confirmer le paiement (${totalTTC.toLocaleString()} FCFA)`}
                        </button>
                    </form>
                </div>

                {/* COLONNE RÉCAPITULATIF */}
                <div className="lg:col-span-5 bg-[#131921] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 text-left">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-3">
                        Récapitulatif de la commande
                    </h3>

                    <div className="space-y-3 max-h-52 overflow-y-auto text-sm divide-y divide-slate-800/60">
                        {commande.articles.map((item, idx) => (
                            <div key={idx} className="pt-2 first:pt-0 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-slate-200">{item.nom}</p>
                                    <p className="text-xs text-slate-500">Qté : {item.quantite || 1}</p>
                                </div>
                                <span className="font-mono text-slate-300 font-bold">
                                    {(item.prix * (item.quantite || 1)).toLocaleString()} FCFA
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-400">
                            <span>Prix Total Hors Taxes (HT)</span>
                            <span className="font-mono text-slate-300">{totalHT.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between items-baseline text-base font-bold text-white pt-3 border-t border-slate-800">
                            <span>Prix Total avec Taxe (TTC)</span>
                            <span className="text-xl text-indigo-400 font-mono font-black">{totalTTC.toLocaleString()} FCFA</span>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}