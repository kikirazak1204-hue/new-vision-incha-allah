import React, { useEffect, useState } from 'react';
import { getAdminReservations } from '../../util/api';
import { Loader2, AlertCircle, Plus, RefreshCw, Mic, Image as ImageIcon, FileText } from 'lucide-react';
import StatusBadge from "../StatusBadge";
import CreateMissionModal from "../CreateMissionModal";
import MissionDetailsModal from "../MissionDetailsModal";

function extrairePieces(reservation) {
    let details = reservation?.piecesJointes;
    if (!details) {
        let srv = reservation?.services;
        if (typeof srv === 'string') {
            try {
                srv = JSON.parse(srv);
            } catch (_) {
                srv = {};
            }
        }
        const obj = srv && typeof srv === 'object' ? srv : {};
        details = {
            photos: Array.isArray(obj.photos) ? obj.photos : [],
            documents: Array.isArray(obj.documents) ? obj.documents : [],
            vocal: obj.vocal || null,
        };
    }
    return {
        photos: Array.isArray(details.photos) ? details.photos : [],
        documents: Array.isArray(details.documents) ? details.documents : [],
        vocal: details.vocal || null,
    };
}

export default function ReservationsAdmin() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getAdminReservations();
            setReservations(res.data || []);
        } catch (e) {
            console.error("Erreur chargement:", e);
            setError("Impossible de charger les réservations. Le serveur est indisponible.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div className="space-y-6 bg-[#070b12] text-slate-100 p-4 md:p-6 rounded-2xl border border-indigo-950/60">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-white/10 pb-6 gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                        Gestion du Réseau <span className="text-[#F2B632]">Kanari</span>
                    </h2>
                    <p className="text-indigo-200/80 text-sm mt-1">
                        Supervision en temps réel des interventions, pièces jointes et validations
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="px-5 py-2.5 bg-[#F2B632] hover:bg-[#e5a91f] rounded-2xl text-xs font-black text-[#061A3A] transition flex items-center gap-2 shadow-lg shadow-amber-500/15 active:scale-95"
                    >
                        <Plus size={15} /> Créer une Mission
                    </button>
                    <button
                        type="button"
                        onClick={loadData}
                        className="px-5 py-2.5 bg-[#0f1523] hover:bg-indigo-950 rounded-2xl text-xs font-bold text-white border border-indigo-500/30 transition active:scale-95 flex items-center gap-2"
                    >
                        <RefreshCw size={14} className="text-[#F2B632]" /> Actualiser
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 flex items-center gap-2 text-sm">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-[#0f1523] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[860px]">
                        <thead>
                            <tr className="border-b border-slate-800 text-indigo-300 text-[10px] uppercase tracking-widest bg-[#061A3A]/70">
                                <th className="px-6 py-5">Dossier / Client</th>
                                <th className="px-6 py-5">Service & Pièces</th>
                                <th className="px-6 py-5">Prestataire Assigné</th>
                                <th className="px-6 py-5">Statut actuel</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-[#F2B632]" size={30} />
                                            <span className="text-sm">Synchronisation avec la base Kanari...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : reservations.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-slate-400 text-sm">
                                        Aucune mission enregistrée pour le moment.
                                    </td>
                                </tr>
                            ) : reservations.map(r => {
                                const pieces = extrairePieces(r);
                                const aDesPieces = pieces.photos.length > 0 || pieces.documents.length > 0 || Boolean(pieces.vocal);

                                return (
                                    <tr key={r.id} className="hover:bg-indigo-950/25 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white text-sm">{r.clientNom || 'Client Anonyme'}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">{r.telephone || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-[#F2B632]">{r.serviceNom || 'Intervention'}</div>
                                            <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{r.adresse}</div>
                                            {aDesPieces && (
                                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                                    {pieces.vocal && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F2B632]/15 text-[#F2B632] border border-[#F2B632]/30">
                                                            <Mic size={11} /> Vocal
                                                        </span>
                                                    )}
                                                    {pieces.photos.length > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                                                            <ImageIcon size={11} /> {pieces.photos.length} photo(s)
                                                        </span>
                                                    )}
                                                    {pieces.documents.length > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                                                            <FileText size={11} /> {pieces.documents.length} doc(s)
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            {r.prestataire ? (
                                                <div>
                                                    <div className="text-sm font-semibold text-white">{r.prestataire.nomEntreprise || 'Prestataire'}</div>
                                                    <div className="text-[10px] text-slate-400">ID : #{r.prestataire.id}</div>
                                                </div>
                                            ) : r.fournisseurId ? (
                                                <div className="text-xs text-indigo-300 font-semibold">
                                                    Assigné (ID: {r.fournisseurId})
                                                </div>
                                            ) : r.refusePar ? (
                                                <span className="text-[11px] text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                                                    Refusé #{r.refusePar}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-500 italic">Aucun prestataire</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <StatusBadge statut={r.statut} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedReservation(r)}
                                                className="px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-400/30 rounded-xl text-white hover:text-[#F2B632] transition text-xs font-bold"
                                            >
                                                Gérer
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modales */}
            {selectedReservation && (
                <MissionDetailsModal
                    reservation={selectedReservation}
                    onClose={() => setSelectedReservation(null)}
                    onRefresh={loadData}
                />
            )}
            {showCreateModal && (
                <CreateMissionModal
                    onClose={() => setShowCreateModal(false)}
                    onRefresh={loadData}
                />
            )}
        </div>
    );
}