// ==========================================
// Fichier : src/pages/PaiementPage.jsx
// Version corrigée et synchronisée backend
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function PaiementPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [reservation, setReservation] = useState(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('mobile_money');
    const [telephone, setTelephone] = useState('');
    const [nomPayer, setNomPayer] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Configuration dynamique de l'URL API (Vite / CRA / Localhost)
    const API_BASE_URL = 
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 
        process.env.REACT_APP_API_URL || 
        'http://localhost:5000';

    // 🛡️ Récupération sécurisée du payload
    useEffect(() => {
        const payload = location.state?.reservation || JSON.parse(localStorage.getItem('reservationPayload') || 'null');
        
        if (payload) {
            setReservation(payload);
            localStorage.setItem('reservationPayload', JSON.stringify(payload));
            
            // Pré-remplir les données utilisateur si présent dans le payload
            if (payload.reservationDetails?.nom) {
                setNomPayer(payload.reservationDetails.nom);
            }
            if (payload.reservationDetails?.telephone) {
                setTelephone(payload.reservationDetails.telephone);
            }
        } else {
            console.warn("⚠️ Aucune réservation/commande détectée. Redirection.");
            navigate('/');
        }
    }, [location.state, navigate]);

    // 💳 Validation et Envoi du Paiement
    const handleFinalPayment = async () => {
        setErrorMsg('');

        // Validation du numéro de téléphone
        if (!telephone.trim()) {
            setErrorMsg("Veuillez saisir votre numéro de téléphone pour le paiement.");
            return;
        }

        setIsProcessing(true);

        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            // Conversion du mode de paiement pour respecter les types attendus par le backend
            let modeBackend = 'mobile_money';
            if (selectedPaymentMethod === 'carte') modeBackend = 'carte_bancaire';
            if (selectedPaymentMethod === 'sur_place') modeBackend = 'especes';

            // Calcul du montant total sécurisé
            const montantTotal = reservation.montantTotal || reservation.prixTotal || reservation.total || 0;

            const payloadPaiement = {
                reservationId: reservation.id || reservation.reservationId || null,
                commandeId: reservation.commandeId || null,
                montant: montantTotal,
                telephone: telephone.trim(),
                nom: nomPayer.trim() || user.nom || 'Client',
                modePaiement: modeBackend,
                referenceClient: `PAY-${Date.now()}`,
                messageClient: reservation.reservationDetails?.notes || 'Paiement effectué depuis le site'
            };

            // Configuration du header HTTP (Gestion des utilisateurs invités et connectés)
            const configHeaders = {
                'Content-Type': 'application/json'
            };
            if (token) {
                configHeaders['Authorization'] = `Bearer ${token}`;
            }

            // Appel à l'API Backend
            const response = await axios.post(
                `${API_BASE_URL}/api/paiements/mobile-money`,
                payloadPaiement,
                { headers: configHeaders }
            );

            if (response.data.success) {
                // Nettoyage des données temporaires de réservation
                localStorage.removeItem('selectedServices');
                localStorage.removeItem('reservationPayload');

                alert("✅ Paiement enregistré avec succès ! En attente de validation.");
                
                // Redirection selon le statut d'authentification
                if (token) {
                    navigate('/dashboard-client');
                } else {
                    navigate('/');
                }
            }

        } catch (error) {
            console.error("Erreur lors du paiement :", error);
            const message = error.response?.data?.message || "Une erreur est survenue lors du traitement du paiement.";
            setErrorMsg(message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!reservation) {
        return (
            <div className="min-h-screen bg-[#050608] text-white flex items-center justify-center">
                <p className="animate-pulse">Chargement sécurisé du module de paiement...</p>
            </div>
        );
    }

    const { services, reservationDetails } = reservation;
    const totalAffichage = reservation.montantTotal || reservation.prixTotal || reservation.total || 0;

    return (
        <div className="min-h-screen bg-[#050608] text-slate-100 font-sans p-4 md:p-8 pb-32">
            <div className="max-w-5xl mx-auto">
                
                {/* Header */}
                <header className="mb-10 border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">Finalisation & Paiement</h1>
                        <p className="text-slate-400 mt-2">Choisissez votre mode de règlement pour valider votre dossier.</p>
                    </div>
                    <button onClick={() => navigate(-1)} className="mt-4 md:mt-0 px-6 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
                        Modifier le dossier
                    </button>
                </header>

                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-400 text-sm">
                        ⚠️ {errorMsg}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* COLONNE GAUCHE : OPTIONS DE PAIEMENT (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        <div className="bg-[#131921] border border-slate-800 p-8 rounded-3xl shadow-2xl">
                            <h2 className="text-xl font-bold mb-6">Modes de paiement acceptés</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                
                                {/* Option 1 : Mobile Money */}
                                <div 
                                    onClick={() => setSelectedPaymentMethod('mobile_money')}
                                    className={`p-6 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                                        selectedPaymentMethod === 'mobile_money'
                                            ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-950'
                                            : 'bg-[#0a0f16] border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 text-xl font-black flex-shrink-0">
                                        📱
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-base">Mobile Money</h3>
                                        <p className="text-xs text-slate-400 mt-1">Orange, MTN, Moov (Paiement direct sécurisé)</p>
                                    </div>
                                </div>

                                {/* Option 2 : Carte Bancaire */}
                                <div 
                                    onClick={() => setSelectedPaymentMethod('carte')}
                                    className={`p-6 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                                        selectedPaymentMethod === 'carte'
                                            ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-950'
                                            : 'bg-[#0a0f16] border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 text-xl font-black flex-shrink-0">
                                        💳
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-base">Carte Bancaire</h3>
                                        <p className="text-xs text-slate-400 mt-1">Visa, Mastercard (Paiement 3D Secure)</p>
                                    </div>
                                </div>

                                {/* Option 3 : Paiement sur place */}
                                <div 
                                    onClick={() => setSelectedPaymentMethod('sur_place')}
                                    className={`p-6 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 sm:col-span-2 ${
                                        selectedPaymentMethod === 'sur_place'
                                            ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-950'
                                            : 'bg-[#0a0f16] border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 text-xl font-black flex-shrink-0">
                                        🤝
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-base">Paiement sur place / Espèces</h3>
                                        <p className="text-xs text-slate-400 mt-1">Règlement direct auprès du prestataire lors de l'intervention physique</p>
                                    </div>
                                </div>

                            </div>

                            {/* Formulaire d'information de règlement */}
                            <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Numéro de téléphone pour la transaction *
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="Ex: 0102030405"
                                        value={telephone}
                                        onChange={(e) => setTelephone(e.target.value)}
                                        className="w-full bg-[#0a0f16] border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleFinalPayment}
                                disabled={isProcessing}
                                className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-950 disabled:opacity-50 active:scale-95"
                            >
                                {isProcessing ? "Traitement en cours..." : `Payer et Valider (${totalAffichage} FCFA)`}
                            </button>
                        </div>
                    </div>

                    {/* COLONNE DROITE : RÉCAPITULATIF (1/3) */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-[#131921] border border-slate-800 p-6 rounded-3xl shadow-xl sticky top-8 space-y-6">
                            
                            {/* Montant Total */}
                            <div className="bg-indigo-600/10 border border-indigo-500/30 p-4 rounded-2xl text-center">
                                <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest block">Total à régler</span>
                                <span className="text-3xl font-black text-white mt-1 block">{totalAffichage} FCFA</span>
                            </div>

                            {/* Liste des services */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Services sélectionnés ({services?.length || 0})</h3>
                                <div className="space-y-3">
                                    {services?.map((s, idx) => (
                                        <div key={idx} className="bg-[#0a0f16] p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                                            <p className="font-bold text-sm text-white">{s.nom || s.titre}</p>
                                            {s.prix && <span className="text-xs text-indigo-400 font-bold">{s.prix} FCFA</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Détails de planification */}
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