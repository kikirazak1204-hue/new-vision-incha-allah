// ==========================================
// Fichier : src/pages/PaiementPage.jsx
// Le montant vient du serveur (GET /api/paiements/a-payer) — jamais du navigateur.
//  - Commande boutique  → paiement immédiat
//  - Mission            → avant le bon d'intervention validé : on choisit seulement le mode
//                         de règlement ; après validation du bon : paiement du montant du bon
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
                    ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-950'
                    : 'bg-[#0a0f16] border-slate-800 hover:border-slate-700'
            }`}
        >
            <div className={`w-12 h-12 ${couleur} rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0`}>
                {icone}
            </div>
            <div>
                <h3 className="font-bold text-white text-base">{titre}</h3>
                <p className="text-xs text-slate-400 mt-1">{texte}</p>
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
    const [du, setDu] = useState(null);         // { montant, typePaiement, ... } si payable maintenant
    const [etat, setEtat] = useState('chargement'); // chargement | payer | choix_mode | direct | deja | attente | erreur
    const [etatMsg, setEtatMsg] = useState('');

    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    // 🛡️ Récupération du dossier
    useEffect(() => {
        const st = location.state || {};
        const params = new URLSearchParams(location.search);
        // Accepte plusieurs formes venant du panier : ?commandeId=, state.commandeId, state.commande, state.reservation
        const cmdId = params.get('commandeId') || st.commandeId || st.commande?.id || st.reservation?.commandeId || null;
        const resId = params.get('reservationId') || st.reservationId || null;
        let payload = st.reservation || st.commande || ((cmdId || resId) ? {} : null);
        if (!payload) {
            try { payload = JSON.parse(localStorage.getItem('reservationPayload') || 'null'); } catch (e) { payload = null; }
        }

        if (payload) {
            const complet = { ...payload };
            if (cmdId) complet.commandeId = cmdId; else if (resId) complet.reservationId = resId;
            setReservation(complet);
            localStorage.setItem('reservationPayload', JSON.stringify(complet));
            if (complet.reservationDetails?.nom) setNomPayer(complet.reservationDetails.nom);
            if (complet.reservationDetails?.telephone) setTelephone(complet.reservationDetails.telephone);
        } else {
            setEtat('erreur');
            setEtatMsg("Aucun dossier à payer n'a été transmis. Retournez à votre panier et réessayez.");
        }
    }, [location.state, location.search]);

    const commandeId = reservation?.commandeId || null;
    const reservationId = commandeId ? null : (reservation?.id || reservation?.reservationId || null);

    // 💰 Montant dû calculé par le serveur
    useEffect(() => {
        if (!reservation) return;
        if (!token) { setEtat('erreur'); setEtatMsg('Connectez-vous pour effectuer un paiement.'); return; }
        if (!commandeId && !reservationId) { setEtat('erreur'); setEtatMsg('Dossier introuvable.'); return; }

        let annule = false;
        (async () => {
            try {
                const { data } = await axios.get(`${API_BASE_URL}/api/paiements/a-payer`, {
                    params: commandeId ? { commandeId } : { reservationId },
                    headers: authHeaders
                });
                if (annule) return;
                setDu(data.data);
                setEtat('payer');
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
        navigate('/dashboard-client');
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
                telephone: telephone.trim(),
                nom: nomPayer.trim() || user.nom || 'Client',
                modePaiement: moyenId,
                referenceClient: referenceTx.trim(),
                messageClient: reservation.reservationDetails?.notes || 'Paiement effectué depuis le site'
            }, { headers: authHeaders });

            if (response.data.success) {
                alert('✅ Paiement enregistré avec succès ! En attente de validation.');
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
            <div className="min-h-screen bg-[#050608] text-white flex items-center justify-center">
                <p className="animate-pulse">Chargement sécurisé du module de paiement...</p>
            </div>
        );
    }

    const { services, reservationDetails } = reservation || {};
    const totalAffichage = du ? formatFCFA(du.montant) : '—';
    const moyenChoisi = MOYENS_PAIEMENT.find((m) => m.id === moyenId);

    return (
        <div className="min-h-screen bg-[#050608] text-slate-100 font-sans p-4 md:p-8 pb-32">
            <div className="max-w-5xl mx-auto">

                <header className="mb-10 border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">Finalisation & Paiement</h1>
                        <p className="text-slate-400 mt-2">
                            {etat === 'choix_mode'
                                ? 'Choisissez comment vous réglerez cette mission.'
                                : 'Choisissez votre mode de règlement pour valider votre dossier.'}
                        </p>
                    </div>
                    <button onClick={() => navigate(-1)} className="mt-4 md:mt-0 px-6 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
                        Retour
                    </button>
                </header>

                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-400 text-sm">⚠️ {errorMsg}</div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* COLONNE GAUCHE */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#131921] border border-slate-800 p-8 rounded-3xl shadow-2xl">

                            {/* États informatifs */}
                            {['direct', 'deja', 'attente', 'erreur'].includes(etat) && (
                                <div className="space-y-5 text-center">
                                    <p className={`text-sm font-semibold ${etat === 'erreur' ? 'text-red-400' : 'text-slate-200'}`}>
                                        {etat === 'direct' && 'Cette mission se règle directement auprès du prestataire à la fin de l\'intervention. Rien à payer en ligne.'}
                                        {etat === 'deja' && '✅ Ce dossier est déjà réglé.'}
                                        {etat === 'attente' && '⏳ Votre paiement est en cours de vérification par l\'administration.'}
                                        {etat === 'erreur' && etatMsg}
                                    </p>
                                    <button
                                        onClick={() => (etat === 'erreur' && !token ? navigate('/login') : terminer())}
                                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition"
                                    >
                                        {etat === 'erreur' && !token ? 'Se connecter' : 'Retour à mon espace'}
                                    </button>
                                </div>
                            )}

                            {/* Mission avant bon validé : choix du mode */}
                            {etat === 'choix_mode' && (
                                <>
                                    <h2 className="text-xl font-bold mb-2">Comment souhaitez-vous régler ?</h2>
                                    <p className="text-xs text-slate-400 mb-6">
                                        Le prix exact sera fixé par le bon d'intervention que vous validerez après les travaux. Aucun paiement n'est demandé maintenant.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <OptionCard actif={mode === 'mobile_money'} onClick={() => setMode('mobile_money')}
                                            icone="📱" couleur="bg-amber-500/10 text-amber-400"
                                            titre="Paiement en ligne via Kanari" texte="Mobile Money ou virement, après validation du bon" />
                                                                                <OptionCard actif={mode === 'direct_prestataire'} onClick={() => setMode('direct_prestataire')}
                                            icone="🤝" couleur="bg-emerald-500/10 text-emerald-400"
                                            titre="Paiement sur place / Espèces" texte="Règlement direct auprès du prestataire lors de l'intervention" />
                                    </div>
                                    <button onClick={enregistrerChoix} disabled={isProcessing}
                                        className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-950 disabled:opacity-50 active:scale-95">
                                        {isProcessing ? 'Enregistrement...' : 'Enregistrer mon choix'}
                                    </button>
                                </>
                            )}

                            {/* Paiement en ligne (commande ou mission avec bon validé) */}
                            {etat === 'payer' && (
                                <>
                                    <h2 className="text-xl font-bold mb-2">Choisissez votre moyen de paiement</h2>
                                    <p className="text-xs text-slate-400 mb-6">Envoyez le montant exact au numéro indiqué, puis renseignez la référence reçue par SMS.</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {MOYENS_PAIEMENT.map((m) => (
                                            <OptionCard key={m.id} actif={moyenId === m.id} onClick={() => setMoyenId(m.id)}
                                                icone={m.icone} couleur={m.couleur} titre={m.nom} texte={m.description} />
                                        ))}
                                    </div>

                                    {moyenChoisi && (
                                        <div className="mt-6 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/30 space-y-2">
                                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Instructions — {moyenChoisi.nom}</p>
                                            <p className="text-sm text-slate-200">Envoyez exactement <span className="font-black text-white">{totalAffichage}</span> à :</p>
                                            {moyenChoisi.numero && <p className="text-2xl font-black text-white tracking-wider select-all">{moyenChoisi.numero}</p>}
                                            {moyenChoisi.banque && <p className="text-xs text-slate-400">Banque : {moyenChoisi.banque}</p>}
                                            {moyenChoisi.iban && <p className="text-sm text-slate-200 select-all">Compte / RIB : {moyenChoisi.iban}</p>}
                                            {moyenChoisi.titulaire && <p className="text-xs text-slate-400">Titulaire : {moyenChoisi.titulaire}</p>}
                                            {moyenChoisi.instructions && <p className="text-xs text-slate-400">{moyenChoisi.instructions}</p>}
                                        </div>
                                    )}

                                    <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                Numéro de téléphone pour la transaction *
                                            </label>
                                            <input type="tel" placeholder="Ex: 0102030405" value={telephone}
                                                onChange={(e) => setTelephone(e.target.value)}
                                                className="w-full bg-[#0a0f16] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                Référence de la transaction (SMS ou reçu) *
                                            </label>
                                            <input type="text" placeholder="Ex: MP240101.1234.A12345" value={referenceTx}
                                                onChange={(e) => setReferenceTx(e.target.value)}
                                                className="w-full bg-[#0a0f16] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition" />
                                            <p className="text-[11px] text-slate-500 mt-1.5">Obligatoire : l'administration l'utilise pour retrouver votre paiement.</p>
                                        </div>
                                    </div>

                                    <button onClick={payer} disabled={isProcessing}
                                        className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-950 disabled:opacity-50 active:scale-95">
                                        {isProcessing ? 'Traitement en cours...' : `Payer et Valider (${totalAffichage})`}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* COLONNE DROITE : RÉCAPITULATIF */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-[#131921] border border-slate-800 p-6 rounded-3xl shadow-xl sticky top-8 space-y-6">

                            <div className="bg-indigo-600/10 border border-indigo-500/30 p-4 rounded-2xl text-center">
                                <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest block">Total à régler</span>
                                <span className="text-3xl font-black text-white mt-1 block">{totalAffichage}</span>
                                {etat === 'choix_mode' && (
                                    <span className="text-[11px] text-slate-400 mt-1 block">Fixé par le bon d'intervention</span>
                                )}
                            </div>

                            {services?.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Services sélectionnés ({services.length})</h3>
                                    <div className="space-y-3">
                                        {services.map((s, idx) => (
                                            <div key={idx} className="bg-[#0a0f16] p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                                                <p className="font-bold text-sm text-white">{s.nom || s.titre}</p>
                                                {s.prix && <span className="text-xs text-indigo-400 font-bold">{s.prix} FCFA</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-slate-800 pt-4 space-y-3">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Informations de rendez-vous</h3>
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
                                        <p className="text-xs text-slate-300 bg-[#0a0f16] p-3 rounded-xl border border-slate-800 italic">
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