// ==========================================
// Fichier : src/pages/PaiementPage.jsx
// Le montant vient du serveur (GET /api/paiements/a-payer) — jamais du navigateur.
//  - Commande boutique   → paiement immédiat
//  - Mission             → avant le bon d'intervention validé : on choisit seulement le mode
//                          de règlement ; après validation du bon : paiement du montant du bon
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { MOYENS_PAIEMENT } from '../config/moyensPaiement';

const API_BASE_URL =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    process.env.REACT_APP_API_URL ||
    'http://localhost:5000';

const formatFCFA = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;

function OptionCard({ actif, onClick, icone, titre, texte, pleine, couleur }) {
    return (
        <div
            onClick={onClick}
            className={`p-6 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${pleine ? 'sm:col-span-2' : ''} ${
                actif
                    ? 'bg-gradient-to-r from-indigo-600/20 to-blue-600/10 border-indigo-500 ring-1 ring-indigo-500 shadow-xl shadow-indigo-950/60'
                    : 'bg-[#0d131f] border-slate-800/80 hover:border-slate-700 hover:bg-[#121a29]'
            }`}
        >
            <div className={`w-12 h-12 ${couleur} rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0 shadow-md`}>
                {icone}
            </div>
            <div>
                <h3 className="font-bold text-white text-base tracking-tight">{titre}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{texte}</p>
            </div>
        </div>
    );
}

export default function PaiementPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [reservation, setReservation] = useState(null);
    const [mode, setMode] = useState('mobile_money'); // mobile_money (en ligne via Kanari) | direct_prestataire
    const [moyenId, setMoyenId] = useState(MOYENS_PAIEMENT[0]?.id || '');
    const [telephone, setTelephone] = useState('');
    const [nomPayer, setNomPayer] = useState('');
    const [referenceTx, setReferenceTx] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // État renvoyé par /a-payer
    const [du, setDu] = useState(null);        // { montant, typePaiement, ... } si payable maintenant
    const [etat, setEtat] = useState('chargement'); // chargement | payer | choix_mode | direct | deja | attente | erreur
    const [etatMsg, setEtatMsg] = useState('');

    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    // 🛡️ Récupération du dossier
    useEffect(() => {
        const st = location.state || {};
        const params = new URLSearchParams(location.search);
        const cmdId = params.get('commandeId') || st.commandeId || st.commande?.id || st.reservation?.commandeId || null;
        const resId = params.get('reservationId') || st.reservationId || null;
        const depotSt = Math.round(Number(st.depot)) || null;
        let payload = depotSt ? { depot: depotSt } : (st.reservation || st.commande || ((cmdId || resId) ? {} : null));
        if (!payload) {
            try { payload = JSON.parse(localStorage.getItem('reservationPayload') || 'null'); } catch (e) { payload = null; }
        }

        if (payload) {
            const complet = { ...payload };
            if (depotSt) { /* dépôt : rien d'autre à rattacher */ } else if (cmdId) complet.commandeId = cmdId; else if (resId) complet.reservationId = resId;
            setReservation(complet);
            localStorage.setItem('reservationPayload', JSON.stringify(complet));
            if (complet.reservationDetails?.nom) setNomPayer(complet.reservationDetails.nom);
            if (complet.reservationDetails?.telephone) setTelephone(complet.reservationDetails.telephone);
        } else {
            setEtat('erreur');
            setEtatMsg("Aucun dossier à payer n'a été transmis. Retournez à votre panier et réessayez.");
        }
    }, [location.state, location.search]);

    const depot = reservation?.depot || null;
    const commandeId = depot ? null : (reservation?.commandeId || null);
    const reservationId = (commandeId || depot) ? null : (reservation?.id || reservation?.reservationId || null);
    const [portefeuille, setPortefeuille] = useState(null); // solde disponible pour payer en un clic

    // 💰 Montant dû calculé par le serveur
    useEffect(() => {
        if (!reservation) return;
        if (!token) { setEtat('erreur'); setEtatMsg('Connectez-vous pour effectuer un paiement.'); return; }
        if (!commandeId && !reservationId && !depot) { setEtat('erreur'); setEtatMsg('Dossier introuvable.'); return; }

        let annule = false;
        (async () => {
            try {
                const { data } = await axios.get(`${API_BASE_URL}/api/paiements/a-payer`, {
                    params: depot ? { depot } : commandeId ? { commandeId } : { reservationId },
                    headers: authHeaders
                });
                if (annule) return;
                setDu(data.data);
                setEtat('payer');
                if (!depot) {
                    axios.get(`${API_BASE_URL}/api/soldes/portefeuille`, { headers: authHeaders })
                        .then((r) => setPortefeuille(r.data.data)).catch(() => setPortefeuille(null));
                }
            } catch (err) {
                if (annule) return;
                const code = err.response?.data?.code;
                const msg = err.response?.data?.message || 'Impossible de charger le montant à payer.';
                setEtatMsg(msg);
                if (code === 'BON_NON_VALIDE') { setMode('mobile_money'); setEtat('choix_mode'); }
                else if (code === 'REGLEMENT_DIRECT') setEtat('direct');
                else if (code === 'DEJA_REGLE') setEtat('deja');
                else if (code === 'EN_ATTENTE') setEtat('attente');
                else setEtat('erreur');
            }
        })();
        return () => { annule = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reservation]);

    const terminer = () => {
        localStorage.removeItem('selectedServices');
        localStorage.removeItem('reservationPayload');
        let role = '';
        try { role = JSON.parse(localStorage.getItem('user') || '{}').role || ''; } catch (e) { /* ignore */ }
        navigate(role === 'fournisseur' ? '/dashboard-fournisseur' : '/dashboard-client');
    };

    // 📝 Mission, avant bon validé : on enregistre juste le mode de règlement
    const enregistrerChoix = async () => {
        setErrorMsg('');
        setIsProcessing(true);
        try {
            await axios.post(`${API_BASE_URL}/api/paiements/mode-reservation`,
                { reservationId, modePaiement: mode }, { headers: authHeaders });
            alert(mode === 'direct_prestataire'
                ? '✅ Noté : vous réglerez directement le prestataire à la fin de l\'intervention.'
                : '✅ Noté : vous pourrez payer en ligne dès que le bon d\'intervention sera validé.');
            terminer();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Impossible d\'enregistrer votre choix.');
        } finally {
            setIsProcessing(false);
        }
    };

    // 👛 Paiement immédiat avec le portefeuille
    const payerAvecPortefeuille = async () => {
        setErrorMsg('');
        setIsProcessing(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/paiements/payer-portefeuille`, { commandeId, reservationId }, { headers: authHeaders });
            if (response.data.success) {
                alert('✅ Paiement effectué avec votre portefeuille !');
                terminer();
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Le paiement avec le portefeuille a échoué.');
        } finally {
            setIsProcessing(false);
        }
    };

    // 💳 Paiement (commande ou mission avec bon validé)
    const payer = async () => {
        setErrorMsg('');
        if (!telephone.trim()) { setErrorMsg('Veuillez saisir votre numéro de téléphone pour le paiement.'); return; }
        if (!referenceTx.trim()) { setErrorMsg('Veuillez saisir la référence reçue par SMS ou sur le reçu de votre paiement.'); return; }
        setIsProcessing(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await axios.post(`${API_BASE_URL}/api/paiements/mobile-money`, {
                commandeId,
                reservationId,
                depot,
                telephone: telephone.trim(),
                nom: nomPayer.trim() || user.nom || 'Client',
                modePaiement: moyenId,
                referenceClient: referenceTx.trim(),
                messageClient: reservation.reservationDetails?.notes || 'Paiement effectué depuis le site'
            }, { headers: authHeaders });

            if (response.data.success) {
                alert(depot ? '✅ Dépôt enregistré ! Il sera ajouté à votre portefeuille après vérification par Kanari.' : '✅ Paiement enregistré avec succès ! En attente de validation.');
                terminer();
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Une erreur est survenue lors du traitement du paiement.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (etat === 'chargement' || (!reservation && etat !== 'erreur')) {
        return (
            <div className="min-h-screen bg-[#070b12] text-white flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="animate-pulse text-indigo-300 font-medium text-sm tracking-wider">Chargement sécurisé du module de paiement...</p>
            </div>
        );
    }

    const { services, reservationDetails } = reservation || {};
    const totalAffichage = du ? formatFCFA(du.montant) : '—';
    const moyenChoisi = MOYENS_PAIEMENT.find((m) => m.id === moyenId);

    return (
        <div className="min-h-screen bg-[#070b12] text-slate-100 font-sans p-4 md:p-8 pb-32">
            <div className="max-w-6xl mx-auto">

                {/* EN-TÊTE HAUT DE GAMME */}
                <header className="mb-10 border-b border-slate-800/80 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50"></span>
                            <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold">Sécurité Bancaire SSL</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Finalisation & Paiement</h1>
                        <p className="text-slate-400 mt-1 text-sm">
                            {etat === 'choix_mode'
                                ? 'Choisissez comment vous réglerez cette mission.'
                                : 'Choisissez votre mode de règlement pour valider votre dossier en toute sécurité.'}
                        </p>
                    </div>
                    <button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-[#131b2e] hover:bg-[#1a253f] border border-slate-700/60 rounded-xl text-sm font-semibold text-slate-200 transition shadow-md">
                        ← Retour
                    </button>
                </header>

                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/40 rounded-2xl text-red-400 text-sm flex items-center gap-3 shadow-lg">
                        <span className="text-lg">⚠️</span> <span>{errorMsg}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* COLONNE GAUCHE (FORMULAIRE & ACTIONS) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#0f1523] border border-slate-800/80 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>

                            {/* États informatifs */}
                            {['direct', 'deja', 'attente', 'erreur'].includes(etat) && (
                                <div className="space-y-6 text-center py-8">
                                    <p className={`text-base font-medium ${etat === 'erreur' ? 'text-red-400' : 'text-slate-200'}`}>
                                        {etat === 'direct' && 'Cette mission se règle directement auprès du prestataire à la fin de l\'intervention. Rien à payer en ligne.'}
                                        {etat === 'deja' && '✅ Ce dossier est déjà réglé avec succès.'}
                                        {etat === 'attente' && '⏳ Votre paiement est en cours de vérification par l\'administration Kanari.'}
                                        {etat === 'erreur' && etatMsg}
                                    </p>
                                    <button
                                        onClick={() => (etat === 'erreur' && !token ? navigate('/login') : terminer())}
                                        className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl font-bold text-white transition shadow-xl shadow-indigo-950"
                                    >
                                        {etat === 'erreur' && !token ? 'Se connecter' : 'Retour à mon espace'}
                                    </button>
                                </div>
                            )}

                            {/* Mission avant bon validé : choix du mode */}
                            {etat === 'choix_mode' && (
                                <>
                                    <h2 className="text-xl font-bold mb-2 text-white">Comment souhaitez-vous régler ?</h2>
                                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                                        Le prix exact sera fixé par le bon d'intervention que vous validerez après les travaux. Aucun paiement n'est demandé maintenant.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <OptionCard actif={mode === 'mobile_money'} onClick={() => setMode('mobile_money')}
                                            icone="📱" couleur="bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                            titre="Paiement en ligne via Kanari" texte="Mobile Money ou virement, après validation du bon" />
                                        <OptionCard actif={mode === 'direct_prestataire'} onClick={() => setMode('direct_prestataire')}
                                            icone="🤝" couleur="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                            titre="Paiement sur place / Espèces" texte="Règlement direct auprès du prestataire lors de l'intervention" />
                                    </div>
                                    <button onClick={enregistrerChoix} disabled={isProcessing}
                                        className="w-full mt-8 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white py-4 rounded-2xl font-black text-base transition-all shadow-xl shadow-indigo-950/80 disabled:opacity-50 active:scale-95">
                                        {isProcessing ? 'Enregistrement en cours...' : 'Enregistrer mon choix'}
                                    </button>
                                </>
                            )}

                            {/* Paiement en ligne (commande ou mission avec bon validé) */}
                            {etat === 'payer' && (
                                <>
                                    {!depot && portefeuille && du && portefeuille.disponible >= du.montant && (
                                        <div className="mb-6 p-5 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Votre portefeuille Kanari</p>
                                                <p className="text-sm text-slate-200">Disponible : <span className="font-black text-yellow-400">{Number(portefeuille.disponible).toLocaleString('fr-FR')} FCFA</span> — paiement immédiat, sans attente.</p>
                                            </div>
                                            <button onClick={payerAvecPortefeuille} disabled={isProcessing}
                                                className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md transition">
                                                {isProcessing ? 'Traitement…' : 'Payer avec mon portefeuille'}
                                            </button>
                                        </div>
                                    )}

                                    <h2 className="text-xl font-bold mb-2 text-white">
                                        {depot ? 'Déposer de l\'argent sur mon portefeuille' : (portefeuille && du && portefeuille.disponible >= du.montant ? 'Ou choisissez un autre moyen de paiement' : 'Choisissez votre moyen de paiement')}
                                    </h2>
                                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">Envoyez le montant exact au numéro ou compte indiqué, puis renseignez la référence officielle reçue.</p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {MOYENS_PAIEMENT.map((m) => (
                                            <OptionCard key={m.id} actif={moyenId === m.id} onClick={() => setMoyenId(m.id)}
                                                icone={m.icone} couleur={m.couleur} titre={m.nom} texte={m.description} />
                                        ))}
                                    </div>

                                    {moyenChoisi && (
                                        <div className="mt-6 p-5 rounded-2xl bg-[#070b12] border border-emerald-500/30 space-y-2 shadow-inner">
                                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <span>🔒</span> Instructions officielles — {moyenChoisi.nom}
                                            </p>
                                            <p className="text-sm text-slate-200">Envoyez exactement <span className="font-black text-yellow-400">{totalAffichage}</span> à :</p>
                                            {moyenChoisi.numero && <p className="text-2xl font-black text-white tracking-wider select-all bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">{moyenChoisi.numero}</p>}
                                            {moyenChoisi.banque && <p className="text-xs text-slate-300">Banque : <span className="font-bold text-white">{moyenChoisi.banque}</span></p>}
                                            {moyenChoisi.iban && <p className="text-sm text-slate-200 select-all font-mono">Compte / RIB : {moyenChoisi.iban}</p>}
                                            {moyenChoisi.titulaire && <p className="text-xs text-slate-300">Titulaire : <span className="font-bold text-white">{moyenChoisi.titulaire}</span></p>}
                                            {moyenChoisi.instructions && <p className="text-xs text-slate-400 italic pt-1">{moyenChoisi.instructions}</p>}
                                        </div>
                                    )}

                                    <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                                                Numéro de téléphone pour la transaction *
                                            </label>
                                            <input type="tel" placeholder="Ex: 90000000" value={telephone}
                                                onChange={(e) => setTelephone(e.target.value)}
                                                className="w-full bg-[#070b12] border border-slate-700/80 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                                                Référence de la transaction (SMS ou reçu) *
                                            </label>
                                            <input type="text" placeholder="Ex: MP240101.1234.A12345" value={referenceTx}
                                                onChange={(e) => setReferenceTx(e.target.value)}
                                                className="w-full bg-[#070b12] border border-slate-700/80 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm" />
                                            <p className="text-[11px] text-slate-500 mt-1.5">Obligatoire : l'administration l'utilise pour valider instantanément votre paiement.</p>
                                        </div>
                                    </div>

                                    <button onClick={payer} disabled={isProcessing}
                                        className="w-full mt-8 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white py-4.5 rounded-2xl font-black text-base md:text-lg transition-all shadow-xl shadow-indigo-950/80 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2">
                                        {isProcessing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Traitement en cours...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Valider et Payer ({totalAffichage})</span>
                                                <span>→</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* COLONNE DROITE : RÉCAPITULATIF HAUT DE GAMME */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-[#0f1523] border border-slate-800/80 p-6 rounded-3xl shadow-xl sticky top-8 space-y-6">

                            {/* BLOC TOTAL */}
                            <div className="bg-gradient-to-br from-indigo-600/15 via-blue-600/10 to-indigo-900/20 border border-indigo-500/30 p-5 rounded-2xl text-center shadow-lg">
                                <span className="text-xs text-indigo-300 font-bold uppercase tracking-widest block mb-1">Total à régler</span>
                                <span className="text-3xl font-black text-yellow-400 tracking-tight block drop-shadow">{totalAffichage}</span>
                                {etat === 'choix_mode' && (
                                    <span className="text-[11px] text-slate-400 mt-1 block">Fixé par le bon d'intervention</span>
                                )}
                            </div>

                            {/* ARTICLES / COMMANDE */}
                            {du?.details?.articles?.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                        {commandeId ? 'Votre commande' : 'Détail à régler'}
                                    </h3>
                                    <div className="space-y-2">
                                        {du.details.articles.map((a, i) => (
                                            <div key={i} className="bg-[#070b12] p-3 rounded-xl border border-slate-800/80 flex justify-between items-center gap-3">
                                                <p className="font-bold text-sm text-white">{a.nom}{a.quantite > 1 ? ` ×${a.quantite}` : ''}</p>
                                                <span className="text-xs text-indigo-400 font-black whitespace-nowrap">{formatFCFA(a.sousTotal)}</span>
                                            </div>
                                        ))}
                                        {du.details.fraisLivraison > 0 && (
                                            <div className="bg-[#070b12] p-3 rounded-xl border border-slate-800/80 flex justify-between items-center gap-3">
                                                <p className="font-bold text-sm text-white">Livraison</p>
                                                <span className="text-xs text-indigo-400 font-black">{formatFCFA(du.details.fraisLivraison)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* SERVICES SÉLECTIONNÉS */}
                            {services?.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Services sélectionnés ({services.length})</h3>
                                    <div className="space-y-3">
                                        {services.map((s, idx) => (
                                            <div key={idx} className="bg-[#070b12] p-3 rounded-xl border border-slate-800/80 flex justify-between items-center">
                                                <p className="font-bold text-sm text-white">{s.nom || s.titre}</p>
                                                {s.prix && <span className="text-xs text-indigo-400 font-black">{s.prix} FCFA</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* INFOS RENDEZ-VOUS */}
                            <div className="border-t border-slate-800/80 pt-4 space-y-3">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Informations de rendez-vous</h3>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Date :</span>
                                    <span className="font-bold text-white">{reservationDetails?.date || 'Non définie'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Heure :</span>
                                    <span className="font-bold text-white">{reservationDetails?.heure || 'Non définie'}</span>
                                </div>
                                {reservationDetails?.notes && (
                                    <div className="mt-2">
                                        <span className="text-xs text-slate-400 block mb-1">Instructions :</span>
                                        <p className="text-xs text-slate-300 bg-[#070b12] p-3 rounded-xl border border-slate-800/80 italic leading-relaxed">
                                            {reservationDetails.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}