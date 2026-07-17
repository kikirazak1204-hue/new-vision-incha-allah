import React, { useEffect, useState } from 'react';
import { getAdminReservations, updateReservationStatut, deleteReservation } from '../../util/api';
import { ShieldAlert, User, Briefcase, MapPin, Phone, FileText, Check, X, Trash2, Layers } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;
const fileUrl = (filename) => {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename;
    return `${API_URL}/uploads/reservations/${filename}`;
};

export default function ReservationsAdmin() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [selected, setSelected] = useState(null);
    const [filtreStatut, setFiltreStatut] = useState('TOUS');

    const fetchReservations = () => {
        setLoading(true);
        getAdminReservations()
            .then(res => setReservations(res.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const handleChangeStatut = async (id, statut) => {
        if (!window.confirm(`Voulez-vous passer le statut de cette réservation en : ${statut} ?`)) return;
        setProcessing(id);
        try {
            const res = await updateReservationStatut(id, statut);
            setReservations(prev => prev.map(r => (r.id === id || r._id === id ? { ...r, ...res.data } : r)));
            if (selected && (selected.id === id || selected._id === id)) {
                setSelected(prev => ({ ...prev, statut }));
            }
        } catch (err) {
            console.error("Erreur de modification du statut :", err);
        } finally {
            setProcessing(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("🚨 ATTENTION ! Confirmez-vous la suppression définitive de cette réservation ?")) return;
        setProcessing(id);
        try {
            await deleteReservation(id);
            setReservations(prev => prev.filter(r => r.id !== id && r._id !== id));
            if (selected && (selected.id === id || selected._id === id)) setSelected(null);
        } catch (err) {
            console.error("Erreur lors de la suppression :", err);
        } finally {
            setProcessing(null);
        }
    };

    const reservationsFiltrées = reservations.filter(r => {
        if (filtreStatut === 'TOUS') return true;
        if (filtreStatut === 'EN_ATTENTE') return !r.statut || r.statut === 'EN_ATTENTE';
        return r.statut === filtreStatut;
    });

    return (
        <div className="space-y-6 p-2">
            {/* EN-TÊTE PREMIUM */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-850 p-6 rounded-3xl gap-4 shadow-xl">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <Layers className="text-purple-500" /> Gestion des Réservations
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">Supervisez, validez et inspectez l'intégralité des demandes d'interventions du réseau.</p>
                </div>
                <div className="px-4 py-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 font-mono text-sm font-bold shrink-0">
                    {reservations.length} Dossier(s) au total
                </div>
            </div>

            {/* BARRE D'ONGLETS DE FILTRAGE */}
            <div className="flex gap-2 p-1 bg-slate-900/60 border border-slate-850 rounded-2xl overflow-x-auto scrollbar-none">
                {['TOUS', 'EN_ATTENTE', 'ACCEPTEE', 'ANNULEE'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFiltreStatut(tab)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shrink-0 ${filtreStatut === tab
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                    >
                        {tab.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* CONTENU PRINCIPAL */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-purple-400">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-sm uppercase tracking-widest font-bold opacity-70">Chargement des dossiers...</p>
                </div>
            ) : reservationsFiltrées.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-slate-850 text-slate-500">
                    Aucune réservation ne correspond à ce filtre actuellement.
                </div>
            ) : (
                <div className="bg-slate-900/40 rounded-3xl border border-slate-850 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-850 bg-slate-900/50 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4.5">Données Client</th>
                                    <th className="px-6 py-4.5">Service Demandé</th>
                                    <th className="px-6 py-4.5">Prestataire Assigné</th>
                                    <th className="px-6 py-4.5">Date Soumission</th>
                                    <th className="px-6 py-4.5">Statut</th>
                                    <th className="px-6 py-4.5 text-right">Actions de Contrôle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850/60">
                                {reservationsFiltrées.map(r => {
                                    const id = r.id || r._id;
                                    const isProcessing = processing === id;
                                    return (
                                        <tr key={id} className="hover:bg-slate-800/20 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white flex items-center gap-1.5">
                                                    <User size={14} className="text-slate-500" /> {r.clientNom || 'Client Inconnu'}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                    <Phone size={12} className="text-purple-400" /> {r.telephone || '—'}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-sm font-semibold text-slate-200">
                                                <span className="bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-lg text-xs">
                                                    {r.serviceNom || r.service?.nom || '—'}
                                                </span>
                                            </td>

                                            {/* FOURNISSEUR CORRIGÉ */}
                                            <td className="px-6 py-4 text-sm">
                                                {r.fournisseur || r.fournisseurNom ? (
                                                    <div>
                                                        <div className="text-purple-400 font-bold text-xs uppercase tracking-wide">
                                                            {r.fournisseur?.nomEntreprise || r.fournisseurNom || "Prestataire"}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                                            ID: {r.fournisseur?._id || r.fournisseurId || 'Non défini'}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-amber-500 font-medium bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded">
                                                        ⚠️ Non spécifié
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-xs text-slate-400">
                                                {new Date(r.date || r.createdAt).toLocaleDateString('fr-FR', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border tracking-wider ${r.statut === 'ACCEPTEE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                        r.statut === 'ANNULEE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    }`}>
                                                    {r.statut || 'EN ATTENTE'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                                                <button
                                                    disabled={isProcessing}
                                                    onClick={() => setSelected(r)}
                                                    className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-700 transition font-medium"
                                                >
                                                    Détails
                                                </button>

                                                {(!r.statut || r.statut === 'EN_ATTENTE') && (
                                                    <>
                                                        <button
                                                            disabled={isProcessing}
                                                            onClick={() => handleChangeStatut(id, 'ACCEPTEE')}
                                                            className="p-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-600 hover:text-white transition inline-flex items-center"
                                                        >
                                                            <Check size={15} />
                                                        </button>
                                                        <button
                                                            disabled={isProcessing}
                                                            onClick={() => handleChangeStatut(id, 'ANNULEE')}
                                                            className="p-1.5 bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-600 hover:text-white transition inline-flex items-center"
                                                        >
                                                            <X size={15} />
                                                        </button>
                                                    </>
                                                )}

                                                <button
                                                    disabled={isProcessing}
                                                    onClick={() => handleDelete(id)}
                                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition inline-flex items-center"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL */}
            {selected && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-[10px] font-bold tracking-widest text-purple-500 uppercase">Fiche d'intervention complète</span>
                                <h3 className="text-2xl font-black text-white mt-0.5">Dossier de Réservation</h3>
                            </div>
                            <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase border ${selected.statut === 'ACCEPTEE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    selected.statut === 'ANNULEE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}>
                                {selected.statut || 'EN ATTENTE'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4 bg-slate-950/50 p-5 rounded-2xl border border-slate-850">
                                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Briefcase size={14} /> Description du Besoin
                                </h4>
                                <div className="space-y-3 text-sm text-slate-300">
                                    <p><span className="text-slate-500 block text-xs">Service requis :</span> <span className="font-semibold text-white">{selected.serviceNom || selected.service?.nom || 'Non spécifié'}</span></p>
                                    <div>
                                        <span className="text-slate-500 block text-xs">Note :</span>
                                        <p className="text-slate-300 italic text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800 mt-1 leading-relaxed">
                                            "{selected.description || 'Aucune consigne.'}"
                                        </p>
                                    </div>
                                    <p className="flex items-start gap-1.5 text-xs"><MapPin size={14} className="text-purple-500 shrink-0 mt-0.5" /> <span><span className="text-slate-500">Zone :</span> {selected.adresseIntervention || 'À distance'}</span></p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3 bg-slate-950/30 p-4 rounded-xl border border-slate-850">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <User size={14} /> Profil Demandeur
                                    </h4>
                                    <div className="text-xs space-y-1 text-slate-300">
                                        <p><span className="text-slate-500">Nom :</span> <span className="text-white font-medium">{selected.clientNom || '—'}</span></p>
                                        <p><span className="text-slate-500">Téléphone :</span> <span className="text-purple-300 font-mono font-medium">{selected.telephone || '—'}</span></p>
                                    </div>
                                </div>

                                <div className="space-y-3 bg-purple-950/10 p-4 rounded-xl border border-purple-900/20">
                                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <ShieldAlert size={14} /> Expert Sélectionné
                                    </h4>
                                    <div className="text-xs space-y-1 text-slate-300">
                                        {selected.fournisseurNom || selected.fournisseur?.nomEntreprise ? (
                                            <>
                                                <p><span className="text-slate-500">Entreprise :</span> <span className="text-white font-bold">{selected.fournisseurNom || selected.fournisseur?.nomEntreprise}</span></p>
                                                <p><span className="text-slate-500">ID :</span> <span className="text-slate-400 font-mono">{selected.fournisseurId || selected.fournisseur?._id}</span></p>
                                            </>
                                        ) : (
                                            <p className="text-amber-400 italic">Aucun prestataire ciblé.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selected.photo && (
                            <div className="mt-5 bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                    <FileText size={14} /> Pièce justificative
                                </h4>
                                <img
                                    src={fileUrl(selected.photo)}
                                    className="w-full h-48 md:h-56 object-cover rounded-xl border border-slate-800 shadow-inner"
                                    alt="Justificatif"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML += '<div class="p-4 text-xs text-rose-500">Image indisponible</div>';
                                    }}
                                />
                            </div>
                        )}

                        <div className="mt-8 flex flex-col sm:flex-row gap-3">
                            <button onClick={() => setSelected(null)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition text-xs uppercase tracking-wider">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}