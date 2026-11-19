import React, { useState, useEffect } from 'react';
import {
    autoriserDemarrage,
    assignerFournisseur,
    updateReservationStatut,
    getFournisseurs,
    getAdminFournisseurs,
    getBonInterventionParReservation
} from '../util/api';
import {
    User, Phone, MapPin, Home, Loader2, PhoneCall, Briefcase,
    Star, Check, FileText, ShieldAlert, Mic, Image as ImageIcon, Paperclip
} from 'lucide-react';
import { getStatutMeta } from '../constants/statuts';

const API_BASE_URL =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    process.env.REACT_APP_API_URL ||
    '';

function construireUrlFichier(chemin) {
    if (!chemin || typeof chemin !== 'string') return null;
    if (chemin.startsWith('http://') || chemin.startsWith('https://')) return chemin;
    const propre = chemin.replace(/\\/g, '/').replace(/^\/+/, '');
    const routeFichier = propre.startsWith('uploads/') ? `/${propre}` : `/uploads/${propre}`;
    return `${API_BASE_URL}${routeFichier}`;
}

function extrairePiecesJointes(reservation) {
    if (reservation?.piecesJointes && typeof reservation.piecesJointes === 'object') {
        return {
            photos: Array.isArray(reservation.piecesJointes.photos) ? reservation.piecesJointes.photos : [],
            documents: Array.isArray(reservation.piecesJointes.documents) ? reservation.piecesJointes.documents : [],
            vocal: reservation.piecesJointes.vocal || null,
        };
    }

    let srv = reservation?.services;
    if (typeof srv === 'string') {
        try {
            srv = JSON.parse(srv);
        } catch (_) {
            srv = {};
        }
    }
    const obj = srv && typeof srv === 'object' ? srv : {};
    return {
        photos: Array.isArray(obj.photos) ? obj.photos : [],
        documents: Array.isArray(obj.documents) ? obj.documents : [],
        vocal: obj.vocal || null,
    };
}

export default function MissionDetailsModal({ reservation, onClose, onRefresh }) {
    const [processing, setProcessing] = useState(false);
    const [fournisseurId, setFournisseurId] = useState(
        reservation?.fournisseurId || reservation?.fournisseur_id || ''
    );
    const [accordTelephone, setAccordTelephone] = useState(false);
    const [modeReassignation, setModeReassignation] = useState(false);

    const [fournisseurs, setFournisseurs] = useState([]);
    const [loadingFournisseurs, setLoadingFournisseurs] = useState(false);

    const [bon, setBon] = useState(null);
    const [loadingBon, setLoadingBon] = useState(false);

    useEffect(() => {
        const fetchListeFournisseurs = async () => {
            setLoadingFournisseurs(true);
            try {
                let data = await getFournisseurs();

                let list = Array.isArray(data)
                    ? data
                    : (data?.fournisseurs || data?.data || data?.utilisateurs || []);

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
                console.error("Erreur lors du chargement des prestataires :", error);
            } finally {
                setLoadingFournisseurs(false);
            }
        };

        if (reservation) {
            fetchListeFournisseurs();
        }
    }, [reservation]);

    useEffect(() => {
        const statutBrutInit = reservation?.statut || reservation?.status || '';
        if (!reservation || !['TERMINEE', 'VALIDEE'].includes(statutBrutInit)) {
            setBon(null);
            return;
        }
        let actif = true;
        setLoadingBon(true);
        getBonInterventionParReservation(reservation.id)
            .then(d => { if (actif && d.success) setBon(d.data); })
            .catch(() => { if (actif) setBon(null); })
            .finally(() => { if (actif) setLoadingBon(false); });
        return () => { actif = false; };
    }, [reservation]);

    if (!reservation) return null;

    const getFournisseurName = (f) => {
        if (!f) return 'Prestataire inconnu';
        const nomComplet = [
            f.prenom || f.User?.prenom,
            f.nom || f.User?.nom || f.name
        ].filter(Boolean).join(' ');

        return f.nomEntreprise || f.nom_entreprise || nomComplet || f.email || `Prestataire #${f.id}`;
    };

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

    const prestataireSelectionne = fournisseurs.find(f => {
        const id = f.id ?? f.fournisseurId;
        return id !== undefined && id !== null && id.toString() === fournisseurId.toString();
    });

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

    const getStatusBadge = () => {
        const meta = getStatutMeta(statut);
        const labelsAdmin = {
            EN_ATTENTE: "En attente d'assignation",
            ASSIGNEE: "Assignée — en attente d'acceptation du prestataire",
            EN_VALIDATION_ADMIN: "Prestataire OK — en attente du feu vert admin",
            ACCEPTEE: "Prête à démarrer",
            EN_PREPARATION: "Préparation matériel",
            EN_COURS: "Intervention en cours",
            TERMINEE: "Terminée — en attente de validation client",
            VALIDEE: "Clôturée & validée par le client",
            ANNULEE: "Annulée",
        };
        const label = labelsAdmin[statut] || meta.label || statutBrut;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${meta.bg} ${meta.text} ${meta.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                {label}
            </span>
        );
    };

    const afficherZoneAssignation = ['EN_ATTENTE', 'NOUVEAU', 'PENDING', 'INCONNU'].includes(statut) || !currentFournisseurId || modeReassignation;
    const afficherFeuVert = ['EN_VALIDATION_ADMIN', 'EN_ATTENTE_VALIDATION'].includes(statut);

    const total = bon ? Number(bon.montantFinal ?? (Number(bon.montantMainOeuvre || 0) + Number(bon.montantPiecesOutils || 0))) : 0;

    const pieces = extrairePiecesJointes(reservation);
    const vocalSrc = construireUrlFichier(pieces.vocal);
    const photosUrls = pieces.photos.map(construireUrlFichier).filter(Boolean);
    const documentsUrls = pieces.documents.map(construireUrlFichier).filter(Boolean);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-[#070b12] border border-indigo-500/30 p-6 sm:p-8 rounded-3xl max-w-lg w-full shadow-2xl relative my-8 text-slate-100 space-y-6">

                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition font-bold"
                >
                    ×
                </button>

                <div>
                    <div className="flex items-center justify-between flex-wrap gap-2 pr-8 mb-2">
                        <span className="text-[11px] font-extrabold tracking-widest text-[#F2B632] uppercase">Administration Kanari</span>
                        {getStatusBadge()}
                    </div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2 flex-wrap">
                        <span>Dossier #{reservation.id}</span>
                        {Boolean(currentFournisseurId) && (
                            <span className="text-xs bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-lg font-bold">
                                Prestataire ID: #{currentFournisseurId}
                            </span>
                        )}
                    </h3>
                </div>

                {/* INFORMATIONS DU CLIENT & MISSION */}
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-[#0f1523] p-3.5 rounded-2xl border border-slate-800">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                                <User size={13} className="text-indigo-400" /> Client
                            </span>
                            <p className="text-white font-extrabold text-sm break-words">
                                {reservation.clientNom || reservation.client_nom || '—'}
                            </p>
                        </div>

                        <div className="bg-[#0f1523] p-3.5 rounded-2xl border border-slate-800">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                                <Phone size={13} className="text-[#F2B632]" /> Téléphone
                            </span>
                            <p className="text-white font-extrabold text-sm break-words">
                                {reservation.telephone || '—'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-[#0f1523] p-3.5 rounded-2xl border border-slate-800">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                            <MapPin size={13} className="text-[#F2B632]" /> Lieu d&apos;intervention
                        </span>
                        <p className="text-white font-medium text-xs sm:text-sm break-words">
                            {reservation.adresse || '—'}
                        </p>
                    </div>

                    <div className="bg-[#0f1523] p-3.5 rounded-2xl border border-slate-800">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                            <Home size={13} className="text-indigo-400" /> Besoin client
                        </span>
                        <p className="text-slate-200 font-medium text-xs sm:text-sm break-words whitespace-pre-line mt-1 bg-[#070b12] p-3 rounded-xl border border-slate-800/80">
                            {reservation.besoin || reservation.description || '—'}
                        </p>
                    </div>

                    {/* PIÈCES JOINTES : VOCAL, PHOTOS & DOCUMENTS */}
                    <div className="bg-[#0f1523] p-4 rounded-2xl border border-indigo-500/25 space-y-4">
                        <span className="text-[10px] uppercase tracking-wider text-[#F2B632] font-extrabold flex items-center gap-1.5">
                            <Paperclip size={13} /> Pièces jointes du client (Vocal, Photos, Documents)
                        </span>

                        {vocalSrc ? (
                            <div className="bg-[#070b12] p-3 rounded-xl border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-white flex items-center gap-1.5">
                                        <Mic size={14} className="text-[#F2B632]" /> Message vocal
                                    </span>
                                    <a
                                        href={vocalSrc}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[11px] text-indigo-300 hover:text-white underline"
                                    >
                                        Ouvrir
                                    </a>
                                </div>
                                <audio controls src={vocalSrc} className="w-full h-9" />
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500">Aucun message vocal joint.</p>
                        )}

                        {photosUrls.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                    <ImageIcon size={14} className="text-indigo-400" /> Photos ({photosUrls.length})
                                </p>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {photosUrls.map((url, idx) => (
                                        <a
                                            key={idx}
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group block rounded-xl overflow-hidden border border-slate-800 bg-[#070b12] aspect-square"
                                        >
                                            <img
                                                src={url}
                                                alt={`Photo ${idx + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {documentsUrls.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                    <FileText size={14} className="text-[#F2B632]" /> Documents ({documentsUrls.length})
                                </p>
                                <div className="space-y-1.5">
                                    {documentsUrls.map((url, idx) => (
                                        <a
                                            key={idx}
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between bg-[#070b12] hover:bg-indigo-950/40 px-3 py-2 rounded-xl border border-slate-800 text-xs text-indigo-200 font-semibold transition"
                                        >
                                            <span className="truncate">Document #{idx + 1}</span>
                                            <span className="text-[#F2B632] font-bold ml-2 shrink-0">Télécharger →</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* BON D'INTERVENTION */}
                {['TERMINEE', 'VALIDEE'].includes(statut) && (
                    <div className="bg-[#0f1523] p-4 rounded-2xl border border-slate-800 space-y-3">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                            <FileText size={13} className="text-[#F2B632]" /> Bon d&apos;intervention
                        </span>

                        {loadingBon && (
                            <p className="text-xs text-slate-500">Chargement du bon d&apos;intervention...</p>
                        )}

                        {!loadingBon && !bon && (
                            <p className="text-xs text-rose-400">Aucun bon d&apos;intervention trouvé pour cette mission — anomalie à vérifier.</p>
                        )}

                        {!loadingBon && bon && (
                            <div className="space-y-2 text-xs">
                                <p className="text-slate-200 whitespace-pre-line bg-[#070b12] p-3 rounded-xl border border-slate-800">{bon.descriptionTravail}</p>
                                {bon.piecesOutils && (
                                    <p className="text-slate-400"><span className="text-slate-500">Pièces / matériel :</span> {bon.piecesOutils}</p>
                                )}
                                <div className="flex justify-between pt-2 border-t border-slate-800">
                                    <span className="text-slate-400">Total facturé au client</span>
                                    <span className="font-black text-[#F2B632]">{total.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-slate-400">Validé par le client</span>
                                    <span className={`font-bold ${bon.valide ? 'text-emerald-400' : 'text-[#F2B632]'}`}>
                                        {bon.valide ? 'Oui' : 'Pas encore'}
                                    </span>
                                </div>
                                {bon.valide && bon.note && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Note laissée par le client</span>
                                        <span className="flex items-center gap-1 text-[#F2B632] font-bold">
                                            <Star size={12} className="fill-[#F2B632]" /> {bon.note}/5
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ZONE D'ACTIONS ADMINISTRATIVES */}
                <div className="pt-4 border-t border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                            Actions Administratives
                        </span>

                        {Boolean(currentFournisseurId) && !modeReassignation && !['ANNULEE', 'TERMINEE', 'VALIDEE'].includes(statut) && (
                            <button
                                type="button"
                                onClick={() => setModeReassignation(true)}
                                className="text-[11px] text-[#F2B632] hover:underline font-bold"
                            >
                                Modifier le prestataire
                            </button>
                        )}
                    </div>

                    {afficherZoneAssignation && !['ANNULEE', 'TERMINEE', 'VALIDEE'].includes(statut) && (
                        <div className="p-4 sm:p-5 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-[#F2B632] font-extrabold flex items-center gap-1.5">
                                    <Briefcase size={14} />
                                    {currentFournisseurId ? 'Réassigner à un autre prestataire :' : 'Choisir un prestataire dans la liste :'}
                                </label>
                                {modeReassignation && (
                                    <button type="button" onClick={() => setModeReassignation(false)} className="text-[10px] text-slate-400 hover:text-white">Annuler</button>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2.5">
                                <select
                                    value={fournisseurId}
                                    onChange={(e) => setFournisseurId(e.target.value)}
                                    disabled={loadingFournisseurs || processing}
                                    className="flex-1 bg-[#070b12] border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F2B632] text-white font-bold cursor-pointer"
                                >
                                    <option value="">
                                        {loadingFournisseurs
                                            ? "Chargement des prestataires..."
                                            : fournisseurs.length === 0
                                                ? "Aucun prestataire trouvé"
                                                : "-- Sélectionner un prestataire --"
                                        }
                                    </option>
                                    {fournisseurs.map((f) => {
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
                                    type="button"
                                    onClick={handleAssignation}
                                    disabled={processing || !fournisseurId || loadingFournisseurs}
                                    className="px-5 py-2.5 bg-[#F2B632] hover:bg-[#e5a91f] disabled:opacity-50 text-[#061A3A] font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                                >
                                    {processing ? <Loader2 className="animate-spin" size={16} /> : 'Assigner'}
                                </button>
                            </div>

                            {prestataireSelectionne && (
                                <div className="bg-[#070b12] border border-slate-800 p-3 rounded-xl text-xs space-y-1">
                                    <div className="flex justify-between items-center text-[#F2B632] font-bold">
                                        <span>{getFournisseurName(prestataireSelectionne)}</span>
                                        {Number(prestataireSelectionne.note) > 0 && (
                                            <span className="flex items-center gap-1 bg-[#F2B632]/15 px-2 py-0.5 rounded text-[10px]">
                                                <Star size={10} className="fill-[#F2B632] text-[#F2B632]" /> {prestataireSelectionne.note}/5
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-slate-300 flex flex-wrap gap-x-4 gap-y-1 text-[11px] pt-1">
                                        <span>{prestataireSelectionne.telephone || prestataireSelectionne.User?.telephone || 'Non renseigné'}</span>
                                        <span>{prestataireSelectionne.specialite || 'Spécialité polyvalente'}</span>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 border-t border-slate-800">
                                <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer select-none bg-[#070b12] p-3 rounded-xl border border-slate-800 hover:border-indigo-500/40 transition">
                                    <input
                                        type="checkbox"
                                        checked={accordTelephone}
                                        onChange={(e) => setAccordTelephone(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-black text-[#F2B632] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#F2B632]"
                                    />
                                    <div className="space-y-0.5">
                                        <span className="flex items-center gap-1.5 text-[#F2B632] font-extrabold text-xs">
                                            <PhoneCall size={13} /> Accord téléphonique direct obtenu
                                        </span>
                                        <p className="text-[11px] text-slate-400 leading-tight">
                                            En cochant ceci, la mission passe directement au statut &quot;Prête à démarrer&quot;, sans attendre que le prestataire l&apos;accepte sur son application.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {afficherFeuVert && (
                        <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-3">
                            <p className="text-xs text-indigo-200 font-medium flex items-center gap-2">
                                <Check size={16} className="text-[#F2B632] shrink-0" />
                                <span>Le prestataire a accepté la mission. Vous pouvez donner l&apos;autorisation officielle de démarrer.</span>
                            </p>
                            <button
                                type="button"
                                onClick={() => handleAction(autoriserDemarrage, reservation.id)}
                                disabled={processing}
                                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                            >
                                {processing ? <Loader2 className="animate-spin" size={16} /> : "Accorder le feu vert d'intervention"}
                            </button>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        {!['ANNULEE', 'TERMINEE', 'VALIDEE'].includes(statut) && (
                            <button
                                type="button"
                                onClick={() => window.confirm("Voulez-vous vraiment annuler définitivement cette mission ?") && handleAction(updateReservationStatut, reservation.id, 'ANNULEE')}
                                disabled={processing}
                                className="flex-1 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-extrabold transition border border-rose-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <ShieldAlert size={15} /> Annuler
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-[#0f1523] hover:bg-slate-800 rounded-xl text-xs font-bold transition text-slate-200 border border-slate-700 cursor-pointer"
                        >
                            Fermer
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}