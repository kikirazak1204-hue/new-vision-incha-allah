import React, { useState, useEffect } from 'react';
import {
    autoriserDemarrage,
    assignerFournisseur,
    updateReservationStatut,
    getFournisseurs,
    getAdminFournisseurs
} from '../util/api';
import {
    User, Phone, MapPin, Home, Loader2, PhoneCall, Briefcase,
    AlertCircle, CheckCircle, Clock, ShieldAlert, Star, Check
} from 'lucide-react';

export default function MissionDetailsModal({ reservation, onClose, onRefresh }) {
    // 1. ÉTATS DU COMPOSANT
    const [processing, setProcessing] = useState(false);
    const [fournisseurId, setFournisseurId] = useState(
        reservation?.fournisseurId || reservation?.fournisseur_id || ''
    );
    const [accordTelephone, setAccordTelephone] = useState(false);
    const [modeReassignation, setModeReassignation] = useState(false);

    // États pour la liste des prestataires venue du backend
    const [fournisseurs, setFournisseurs] = useState([]);
    const [loadingFournisseurs, setLoadingFournisseurs] = useState(false);

    // 2. CHARGEMENT ROBUSTE DES PRESTATAIRES
    useEffect(() => {
        const fetchListeFournisseurs = async () => {
            setLoadingFournisseurs(true);
            try {
                let data = await getFournisseurs();

                // Extraction intelligente du tableau peu importe la structure backend
                let list = Array.isArray(data)
                    ? data
                    : (data?.fournisseurs || data?.data || data?.utilisateurs || []);

                // Si la liste est vide, tentative de secours via l'API Admin
                if (list.length === 0) {
                    try {
                        const adminData = await getAdminFournisseurs();
                        list = Array.isArray(adminData)
                            ? adminData
                            : (adminData?.fournisseurs || adminData?.data || []);
                    } catch (e) {
                        console.warn("Fallback admin échoué :", e);
                    }
                }

                setFournisseurs(list);
            } catch (error) {
                console.error("❌ Erreur lors du chargement des prestataires :", error);
            } finally {
                setLoadingFournisseurs(false);
            }
        };

        if (reservation) {
            fetchListeFournisseurs();
        }
    }, [reservation]);

    if (!reservation) return null;

    // Helper pour générer le nom d'affichage d'un prestataire sans bug
    const getFournisseurName = (f) => {
        if (!f) return 'Prestataire inconnu';
        const nomComplet = [
            f.prenom || f.User?.prenom,
            f.nom || f.User?.nom || f.name
        ].filter(Boolean).join(' ');

        return f.nomEntreprise || f.nom_entreprise || nomComplet || f.email || `Prestataire #${f.id}`;
    };

    // 3. NORMALISATION DES DONNÉES
    const normalizeStatut = (raw) => {
        return String(raw || 'INCONNU')
            .trim()
            .toUpperCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/\s+/g, '_');
    };

    const statutBrut = reservation.statut || reservation.status || 'INCONNU';
    const statut = normalizeStatut(statutBrut);
    const currentFournisseurId = reservation.fournisseurId || reservation.fournisseur_id || null;

    // Récupérer les infos du prestataire sélectionné en gérant correctement les IDs
    const prestataireSelectionne = fournisseurs.find(f => {
        const id = f.id ?? f.fournisseurId;
        return id !== undefined && id !== null && id.toString() === fournisseurId.toString();
    });

    // 4. GESTION DES APPELS API
    const handleAction = async (actionFn, ...args) => {
        setProcessing(true);
        try {
            await actionFn(...args);
            await onRefresh();
            onClose();
        } catch (e) {
            alert("Erreur lors de l'opération : " + (e.message || "Erreur réseau/serveur"));
        } finally {
            setProcessing(false);
        }
    };

    const handleAssignation = () => {
        if (!fournisseurId) {
            return alert("Veuillez sélectionner un prestataire dans la liste.");
        }
        handleAction(assignerFournisseur, reservation.id, parseInt(fournisseurId, 10), accordTelephone);
    };

    // Helper pour le badge de statut
    const getStatusBadge = () => {
        switch (statut) {
            case 'EN_ATTENTE':
            case 'PENDING':
            case 'NOUVEAU':
                return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5"><Clock size={14} /> EN ATTENTE D'ASSIGNATION</span>;
            case 'EN_VALIDATION_ADMIN':
            case 'ASSIGNEE':
                return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5"><AlertCircle size={14} /> EN ATTENTE DE VALIDATION</span>;
            case 'VALIDEE':
            case 'ACCEPTEE':
            case 'EN_COURS':
                return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5"><CheckCircle size={14} /> MISSION EN COURS</span>;
            case 'ANNULEE':
                return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5"><ShieldAlert size={14} /> MISSION ANNULÉE</span>;
            default:
                return <span className="bg-slate-500/20 text-slate-300 border border-slate-500/30 px-3 py-1 rounded-full text-xs font-black">{statutBrut}</span>;
        }
    };

    const afficherZoneAssignation = ['EN_ATTENTE', 'NOUVEAU', 'PENDING', 'INCONNU'].includes(statut) || !currentFournisseurId || modeReassignation;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
            <div className="bg-[#0A0E17] border border-white/10 p-6 sm:p-8 rounded-3xl max-w-lg w-full shadow-2xl relative my-8 text-slate-100 space-y-6">

                {/* BOUTON FERMER */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition font-bold"
                >
                    ✕
                </button>

                {/* EN-TÊTE DU DOSSIER */}
                <div>
                    <div className="flex items-center justify-between flex-wrap gap-2 pr-8 mb-2">
                        <span className="text-[11px] font-extrabold tracking-widest text-purple-400 uppercase">Administration Kanari</span>
                        {getStatusBadge()}
                    </div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                        <span>📂 Dossier #{reservation.id}</span>
                        {/* ✅ CORRECTION : Boolean() évite l'affichage d'un 0 intempestif */}
                        {Boolean(currentFournisseurId) && (
                            <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-lg font-bold">
                                Prestataire ID: #{currentFournisseurId}
                            </span>
                        )}
                    </h3>
                </div>

                {/* INFORMATIONS DU CLIENT & MISSION */}
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/5">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                                <User size={13} className="text-purple-400" /> Client
                            </span>
                            <p className="text-white font-extrabold text-sm break-words">
                                {reservation.clientNom || reservation.client_nom || '—'}
                            </p>
                        </div>

                        <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/5">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                                <Phone size={13} className="text-emerald-400" /> Téléphone
                            </span>
                            <p className="text-white font-extrabold text-sm break-words">
                                {reservation.telephone || '—'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/5">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                            <MapPin size={13} className="text-rose-400" /> Lieu d'intervention
                        </span>
                        <p className="text-white font-medium text-xs sm:text-sm break-words">
                            {reservation.adresse || '—'}
                        </p>
                    </div>

                    <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/5">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                            <Home size={13} className="text-blue-400" /> Besoin client
                        </span>
                        <p className="text-slate-200 font-medium text-xs sm:text-sm break-words whitespace-pre-line mt-1 bg-black/30 p-3 rounded-xl border border-white/5">
                            {reservation.besoin || reservation.description || '—'}
                        </p>
                    </div>
                </div>

                {/* ZONE D'ACTIONS ADMINISTRATIVES */}
                <div className="pt-4 border-t border-white/10 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                            🛠️ Actions Administratives :
                        </span>

                        {/* ✅ CORRECTION : Boolean(currentFournisseurId) */}
                        {Boolean(currentFournisseurId) && !modeReassignation && !['ANNULEE', 'TERMINÉE', 'TERMINEE'].includes(statut) && (
                            <button
                                type="button"
                                onClick={() => setModeReassignation(true)}
                                className="text-[11px] text-amber-400 hover:text-amber-300 underline font-bold"
                            >
                                Modifier le prestataire
                            </button>
                        )}
                    </div>

                    {/* 1. BLOC ASSIGNATION & SÉLECTION DU PRESTATAIRE */}
                    {afficherZoneAssignation && !['ANNULEE', 'TERMINÉE', 'TERMINEE'].includes(statut) && (
                        <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl space-y-4 shadow-inner">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-amber-300 font-extrabold flex items-center gap-1.5">
                                    <Briefcase size={14} />
                                    {currentFournisseurId ? 'Réassigner à un autre prestataire :' : 'Choisir un prestataire dans la liste :'}
                                </label>
                                {modeReassignation && (
                                    <button onClick={() => setModeReassignation(false)} className="text-[10px] text-slate-400 hover:text-white">Annuler</button>
                                )}
                            </div>

                            {/* LISTE DÉROULANTE CONNECTÉE ET SÉCURISÉE */}
                            <div className="flex flex-col sm:flex-row gap-2.5">
                                <select
                                    value={fournisseurId}
                                    onChange={(e) => setFournisseurId(e.target.value)}
                                    disabled={loadingFournisseurs || processing}
                                    className="flex-1 bg-black/80 border border-amber-500/30 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 text-white font-bold cursor-pointer"
                                >
                                    <option value="">
                                        {loadingFournisseurs
                                            ? "⏳ Chargement des prestataires..."
                                            : fournisseurs.length === 0
                                                ? "⚠️ Aucun prestataire trouvé"
                                                : "-- Sélectionner un prestataire --"
                                        }
                                    </option>
                                    {fournisseurs.map((f) => {
                                        // Extraction robuste de l'ID
                                        const id = f.id ?? f.fournisseurId;
                                        if (!id) return null;

                                        const name = getFournisseurName(f);
                                        const spec = f.specialite || f.Service?.nom || 'Général';

                                        return (
                                            <option key={id} value={id} className="bg-slate-900 text-white py-1">
                                                #{id} - {name} ({spec})
                                            </option>
                                        );
                                    })}
                                </select>

                                <button
                                    onClick={handleAssignation}
                                    disabled={processing || !fournisseurId || loadingFournisseurs}
                                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                                >
                                    {processing ? <Loader2 className="animate-spin" size={16} /> : 'Assigner 🚀'}
                                </button>
                            </div>

                            {/* APERÇU / INFOS DU PRESTATAIRE SÉLECTIONNÉ */}
                            {prestataireSelectionne && (
                                <div className="bg-black/50 border border-amber-500/30 p-3 rounded-xl text-xs space-y-1 animate-fadeIn">
                                    <div className="flex justify-between items-center text-amber-300 font-bold">
                                        <span>👤 {getFournisseurName(prestataireSelectionne)}</span>
                                        {/* ✅ CORRECTION MAJEURE DU BUG DU "0" : On vérifie que la note est strictement supérieure à 0 */}
                                        {Number(prestataireSelectionne.note) > 0 && (
                                            <span className="flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded text-[10px]">
                                                <Star size={10} className="fill-amber-400 text-amber-400" /> {prestataireSelectionne.note}/5
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-slate-300 flex flex-wrap gap-x-4 gap-y-1 text-[11px] pt-1">
                                        <span>📞 {prestataireSelectionne.telephone || prestataireSelectionne.User?.telephone || 'Non renseigné'}</span>
                                        <span>🛠️ {prestataireSelectionne.specialite || 'Spécialité polyvalente'}</span>
                                    </div>
                                </div>
                            )}

                            {/* CASE À COCHER ACCORD TÉLÉPHONIQUE */}
                            <div className="pt-2 border-t border-amber-500/10">
                                <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer select-none bg-black/40 p-3 rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition">
                                    <input
                                        type="checkbox"
                                        checked={accordTelephone}
                                        onChange={(e) => setAccordTelephone(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded border-amber-500/40 bg-black text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500"
                                    />
                                    <div className="space-y-0.5">
                                        <span className="flex items-center gap-1.5 text-amber-400 font-extrabold text-xs">
                                            <PhoneCall size={13} /> Accord téléphonique direct obtenu !
                                        </span>
                                        <p className="text-[11px] text-slate-400 leading-tight">
                                            En cochant ceci, la mission sera <strong className="text-slate-200">validée instantanément</strong> sans attendre la confirmation du prestataire sur son application.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* 2. BLOC FEU VERT (Si en validation) */}
                    {['EN_VALIDATION_ADMIN', 'EN_ATTENTE_VALIDATION', 'ASSIGNEE'].includes(statut) && (
                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl space-y-3">
                            <p className="text-xs text-purple-200 font-medium flex items-center gap-2">
                                <Check size={16} className="text-purple-400 shrink-0" />
                                <span>Le prestataire est assigné. Vous pouvez donner l'autorisation officielle de démarrer.</span>
                            </p>
                            <button
                                onClick={() => handleAction(autoriserDemarrage, reservation.id)}
                                disabled={processing}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 cursor-pointer"
                            >
                                {processing ? <Loader2 className="animate-spin" size={16} /> : '🟢 ACCORDER LE FEU VERT D\'INTERVENTION'}
                            </button>
                        </div>
                    )}

                    {/* 3. BOUTONS ANNULER & FERMER */}
                    <div className="flex gap-3 pt-2">
                        {!['ANNULEE', 'TERMINÉE', 'TERMINEE', 'VALIDEE'].includes(statut) && (
                            <button
                                type="button"
                                onClick={() => window.confirm("⚠️ Voulez-vous vraiment annuler définitivement cette mission ?") && handleAction(updateReservationStatut, reservation.id, 'ANNULEE')}
                                disabled={processing}
                                className="flex-1 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-extrabold transition border border-rose-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <ShieldAlert size={15} /> Annuler
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition text-slate-300 border border-white/5 cursor-pointer"
                        >
                            Fermer
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}