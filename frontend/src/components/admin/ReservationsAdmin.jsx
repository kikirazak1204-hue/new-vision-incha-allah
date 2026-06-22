import React, { useEffect, useState } from 'react';
import { getAdminReservations, updateReservationStatut } from '../../util/api';
import { Check, X, Info, MapPin, Loader2, User, Phone, Home, AlertCircle } from 'lucide-react';

export default function ReservationsAdmin() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [selected, setSelected] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getAdminReservations();
            setReservations(res.data || []);
        } catch (e) {
            console.error("Erreur chargement:", e);
            setError("Impossible de charger les réservations.");
        } finally {
            setLoading(false);
        }
    };

    const handleChangeStatut = async (id, statut) => {
        if (!window.confirm(`Confirmer le changement de statut vers : ${statut} ?`)) return;
        
        setProcessing(id);
        try {
            await updateReservationStatut(id, statut);
            // On recharge les données pour une UI propre et synchronisée
            await loadData(); 
            setSelected(null);
        } catch (e) {
            alert("Erreur lors de la mise à jour : " + e.message);
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-white/5 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-white">Gestion des Missions</h2>
                    <p className="text-slate-400">Suivi des interventions et localisation</p>
                </div>
                <button 
                    onClick={loadData} 
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold text-white border border-white/10 transition active:scale-95"
                >
                    🔄 Actualiser
                </button>
            </div>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 flex items-center gap-2">
                    <AlertCircle size={18}/> {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 text-slate-500 text-[10px] uppercase tracking-widest">
                            <th className="px-6 py-5">Client</th>
                            <th className="px-6 py-5">Service</th>
                            <th className="px-6 py-5">Localisation</th>
                            <th className="px-6 py-5">Statut</th>
                            <th className="px-6 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan="5" className="py-20 text-center text-slate-500">Chargement...</td></tr>
                        ) : reservations.map(r => (
                            <tr key={r.id} className="hover:bg-white/[0.02] transition">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-white text-sm">{r.clientNom || 'Anonyme'}</div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-1"><Phone size={10}/> {r.telephone || 'N/A'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-purple-300 font-medium">{r.serviceNom}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                                        <MapPin size={14} className="text-purple-500"/>
                                        {r.adresse || r.adresseIntervention || <span className="text-slate-700 italic">Non renseigné</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge statut={r.statut} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => setSelected(r)} 
                                        className="p-2 bg-white/5 hover:bg-purple-500/20 rounded-xl text-slate-400 hover:text-purple-300 transition"
                                    >
                                        <Info size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Détails */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-lg w-full shadow-2xl relative">
                        <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                            <MapPin className="text-purple-500"/> Dossier #{selected.id.toString().slice(-4)}
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem icon={<User size={14}/>} label="Client" value={selected.clientNom} />
                                <DetailItem icon={<Phone size={14}/>} label="Téléphone" value={selected.telephone} />
                            </div>
                            
                            <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                                <div className="text-[10px] uppercase tracking-wider text-purple-400/70 font-bold mb-1 flex items-center gap-1">
                                    <MapPin size={12}/> Lieu d'intervention
                                </div>
                                <div className="text-white font-bold text-lg">{selected.adresse || selected.adresseIntervention || 'Non renseigné'}</div>
                            </div>

                            <DetailItem icon={<Home size={14}/>} label="Description" value={selected.besoin} isLong />
                            
                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                <button 
                                    onClick={() => handleChangeStatut(selected.id, 'ACCEPTEE')} 
                                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                                >
                                    {processing === selected.id ? <Loader2 className="animate-spin" size={18}/> : 'Valider'}
                                </button>
                                <button 
                                    onClick={() => handleChangeStatut(selected.id, 'ANNULEE')} 
                                    className="flex-1 py-3 bg-white/5 hover:bg-rose-500/20 text-white hover:text-rose-400 rounded-xl font-bold transition"
                                >
                                    Refuser
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const StatusBadge = ({ statut }) => {
    const colors = {
        ACCEPTEE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        ANNULEE: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        EN_ATTENTE: "text-amber-400 bg-amber-500/10 border-amber-500/20"
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${colors[statut] || colors.EN_ATTENTE}`}>
            {statut?.replace('_', ' ') || 'En attente'}
        </span>
    );
};

const DetailItem = ({ icon, label, value, isLong }) => (
    <div className={isLong ? "col-span-2" : ""}>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 flex items-center gap-1">{icon} {label}</div>
        <div className="text-white font-medium p-3 bg-white/5 rounded-xl border border-white/5">{value || '—'}</div>
    </div>
);