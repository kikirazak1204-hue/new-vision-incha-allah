import React, { useState } from 'react';
import {
    X,
    CheckCircle,
    XCircle,
    Calendar,
    MapPin,
    Phone,
    User,
    Briefcase,
    FileText,
    Loader2,
    AlertTriangle,
    Star
} from 'lucide-react';
import StatusBadge from './StatusBadge';
// 🟢 IMPORTATIONS DES VRAIES FONCTIONS API DEPUIS api.js (Ajout de validerBonIntervention)
import { validerReservation, refuserReservation, validerBonIntervention } from '../util/api';

export default function MissionDetailsModal({ reservation, onClose, onRefresh }) {
    const [loadingAction, setLoadingAction] = useState(false);
    const [error, setError] = useState(null);

    // Si aucune réservation n'est fournie, on ne rend rien
    if (!reservation) return null;

    // Récupération sécurisée du Bon d'Intervention s'il existe dans ta donnée
    const bon = reservation.BonIntervention || reservation.bonIntervention;

    // Normalisation du statut pour les vérifications d'activation de bouton
    const statusUpper = reservation.statut?.toUpperCase() || '';
    const isDejaRefuse = statusUpper === 'ANNULEE' || statusUpper === 'ANNULE' || statusUpper === 'REFUSEE' || statusUpper === 'REFUSE';

    // 🟢 Un bon d'intervention validé ou une réservation validée bloque une nouvelle validation
    const isDejaValide = statusUpper === 'VALIDEE' || statusUpper === 'VALIDE' || (bon && bon.valide);

    // ── GESTIONNAIRE : VALIDER LA MISSION OU LE BON ─────────────────────────
    const handleValider = async () => {
        setLoadingAction(true);
        setError(null);

        try {
            if (bon) {
                // 1. Si un bon existe, on demande la note et l'avis pour le prestataire
                const noteSaisie = window.prompt("Attribuez une note au prestataire pour cette intervention (de 1 à 5) :", "5");
                if (noteSaisie === null) {
                    setLoadingAction(false);
                    return; // Annulation par l'utilisateur
                }

                const noteInt = parseInt(noteSaisie, 10);
                if (isNaN(noteInt) || noteInt < 1 || noteInt > 5) {
                    alert("⚠️ La note doit être un nombre entier compris entre 1 et 5.");
                    setLoadingAction(false);
                    return;
                }

                const commentaire = window.prompt("Laissez un court commentaire sur l'intervention (optionnel) :", "Travail impeccable et rapide.");
                if (commentaire === null) {
                    setLoadingAction(false);
                    return;
                }

                // 🟢 APPEL DE LA NOUVELLE API POUR LE BON D'INTERVENTION
                await validerBonIntervention(bon.id, { note: noteInt, commentaire });
                alert("✅ Bon d'intervention et prestation validés avec succès !");
            } else {
                // 2. Si aucun bon n'existe (simple réservation), validation classique
                if (!window.confirm("Voulez-vous vraiment valider cette réservation ?")) {
                    setLoadingAction(false);
                    return;
                }
                await validerReservation(reservation.id);
                alert("✅ Réservation validée avec succès !");
            }

            onRefresh(); // Recharge le tableau de bord
            onClose();   // Ferme la modale
        } catch (err) {
            console.error(err);
            setError("Erreur lors de la validation : " + (err.response?.data?.message || err.message));
        } finally {
            setLoadingAction(false);
        }
    };

    // ── GESTIONNAIRE : REFUSER / ANNULER LA MISSION ─────────────────────────
    const handleRefuser = async () => {
        const motif = window.prompt("Veuillez indiquer le motif du refus / de l'annulation :");
        if (motif === null) return; // Le client a cliqué sur "Annuler" dans le prompt

        setLoadingAction(true);
        setError(null);
        try {
            // 🟢 APPEL API RÉEL
            await refuserReservation(reservation.id, motif);

            alert("❌ Mission refusée.");
            onRefresh(); // Recharge le tableau de bord
            onClose();   // Ferme la modale
        } catch (err) {
            console.error(err);
            setError("Erreur lors du refus : " + (err.response?.data?.message || err.message));
        } finally {
            setLoadingAction(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            {/* Boîte Modale */}
            <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-slate-100">

                {/* ── EN-TÊTE ──────────────────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-slate-900/50">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-black text-white">
                                Dossier #{reservation.id}
                            </h3>
                            <StatusBadge statut={reservation.statut} />
                        </div>
                        <p className="text-xs text-purple-300 font-medium mt-1">
                            {reservation.serviceNom || 'Service de maintenance Kanari'}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ── CORPS SCROLLABLE ─────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Alerte Erreur */}
                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 flex items-center gap-3 text-sm">
                            <AlertTriangle size={18} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Bloc 1 : Client & Lieu */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1.5">
                                <User size={12} className="text-purple-400" /> Client
                            </span>
                            <p className="font-bold text-sm text-white">
                                {reservation.clientNom || 'Client Anonyme'}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                <Phone size={12} /> {reservation.telephone || 'Non renseigné'}
                            </p>
                        </div>

                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1.5">
                                <MapPin size={12} className="text-purple-400" /> Lieu & Date
                            </span>
                            <p className="font-semibold text-xs text-slate-200 line-clamp-2">
                                {reservation.adresse || 'Adresse non spécifiée'}
                            </p>
                            <p className="text-xs text-purple-300 flex items-center gap-1.5 font-medium">
                                <Calendar size={12} />
                                {reservation.dateIntervention
                                    ? new Date(reservation.dateIntervention).toLocaleString('fr-FR')
                                    : 'Date à définir'}
                            </p>
                        </div>
                    </div>

                    {/* Bloc 2 : Prestataire Assigné */}
                    <div className="p-4 bg-purple-950/20 border border-purple-500/20 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                                <Briefcase size={20} />
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400">
                                    Prestataire Assigné
                                </span>
                                <h4 className="font-bold text-sm text-white">
                                    {reservation.prestataire?.nomEntreprise || `Fournisseur ID #${reservation.fournisseurId || 'Non assigné'}`}
                                </h4>
                            </div>
                        </div>
                        {reservation.fournisseurId && (
                            <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg font-semibold">
                                Actif
                            </span>
                        )}
                    </div>

                    {/* Bloc 3 : Bon d'intervention (S'il existe) */}
                    {bon ? (
                        <div className="p-5 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                                    <FileText size={16} /> Bon d'Intervention Rempli
                                </span>
                                <span className="text-xs text-slate-400">
                                    Soumis le {new Date(bon.createdAt || Date.now()).toLocaleDateString('fr-FR')}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[11px] text-slate-400 uppercase font-semibold">Description des travaux :</span>
                                <p className="text-xs text-slate-200 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                                    {bon.descriptionTravail || 'Aucune description fournie.'}
                                </p>
                            </div>

                            {bon.piecesOutils && (
                                <div className="space-y-1">
                                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Pièces / Outils utilisés :</span>
                                    <p className="text-xs text-slate-300 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                                        {bon.piecesOutils}
                                    </p>
                                </div>
                            )}

                            <div className="pt-2 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 bg-slate-900 rounded-lg">
                                    <span className="text-[10px] text-slate-400 block">Main d'œuvre</span>
                                    <span className="text-xs font-bold text-slate-200">{bon.montantMainOeuvre} FCFA</span>
                                </div>
                                <div className="p-2 bg-slate-900 rounded-lg">
                                    <span className="text-[10px] text-slate-400 block">Pièces & Outils</span>
                                    <span className="text-xs font-bold text-slate-200">{bon.montantPiecesOutils || 0} FCFA</span>
                                </div>
                                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <span className="text-[10px] text-emerald-400 font-bold block">Total Final</span>
                                    <span className="text-sm font-black text-emerald-400">{bon.montantFinal} FCFA</span>
                                </div>
                            </div>

                            {/* Affichage de la note et du commentaire si déjà validé */}
                            {bon.valide && bon.note && (
                                <div className="pt-3 border-t border-white/5 space-y-2">
                                    <span className="text-[11px] text-amber-400 uppercase font-bold flex items-center gap-1.5">
                                        <Star size={12} className="fill-amber-400" /> Évaluation enregistrée
                                    </span>
                                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5 text-xs text-slate-300">
                                        <div className="flex gap-1 mb-1.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={12} className={i < bon.note ? "fill-amber-400 text-amber-400" : "text-slate-600"} />
                                            ))}
                                        </div>
                                        {bon.commentaire && <p className="italic text-slate-400">"{bon.commentaire}"</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl text-center text-slate-500">
                            <FileText size={24} className="mx-auto mb-2 opacity-40" />
                            <p className="text-xs font-medium">Aucun bon d'intervention n'a encore été soumis par le prestataire pour cette mission.</p>
                        </div>
                    )}
                </div>

                {/* ── PIED DE PAGE : LES BOUTONS DE VALIDATION / REFUS ──────────── */}
                <div className="p-5 border-t border-white/10 bg-slate-900/80 flex flex-col sm:flex-row justify-between items-center gap-3">

                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition order-2 sm:order-1"
                    >
                        Fermer
                    </button>

                    {/* ZONES DES BOUTONS D'ACTION */}
                    <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">

                        {/* BOUTON REFUSER */}
                        <button
                            onClick={handleRefuser}
                            disabled={loadingAction || isDejaRefuse}
                            className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            {loadingAction ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={15} />}
                            Refuser / Annuler
                        </button>

                        {/* BOUTON VALIDER */}
                        <button
                            onClick={handleValider}
                            disabled={loadingAction || isDejaValide}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            {loadingAction ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={15} />}
                            {bon ? "Valider la prestation" : "Valider la mission"}
                        </button>

                    </div>

                </div>

            </div>
        </div>
    );
}