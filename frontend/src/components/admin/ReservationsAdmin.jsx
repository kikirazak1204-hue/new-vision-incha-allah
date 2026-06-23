import React, { useEffect, useState } from 'react';
import { 
    getAdminReservations, 
    assignerFournisseur, 
    autoriserDemarrage, 
    updateReservationStatut,
    adminCreerReservation 
} from '../../util/api';
import { 
    Check, X, Info, MapPin, Loader2, User, Phone, 
    Home, AlertCircle, Briefcase, Calendar, Plus, ShieldCheck 
} from 'lucide-react';

// Configuration visuelle et textuelle des statuts synchronisée avec le backend
const STATUT_CONFIG = {
    en_attente: { label: 'En attente d\'assignation', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    assigne: { label: 'Assigné (Attente Presta)', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    en_validation_admin: { label: 'À Valider (Feu Vert)', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20 animate-pulse' },
    accepte: { label: 'Démarrage autorisé', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    en_cours: { label: 'Intervention en cours', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    termine: { label: 'Terminé (Attente Client)', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    valide: { label: 'Validé par le client ✅', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
    annule: { label: 'Annulé', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
};

export default function ReservationsAdmin() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [selected, setSelected] = useState(null);
    const [error, setError] = useState(null);
    
    // États pour la création d'une mission par l'admin
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [fournisseurInputId, setFournisseurInputId] = useState('');
    const [newMission, setNewMission] = useState({
        besoin: '', adresse: '', telephone: '', clientNom: '',
        serviceId: '', serviceNom: '', type: 'classique', dateIntervention: ''
    });

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
            setError("Impossible de charger les réservations. Le serveur est peut-être indisponible.");
        } finally {
            setLoading(false);
        }
    };

    // Action 1 : Donner le feu vert (Double validation)
    const handleAutoriser = async (id) => {
        setProcessing(id);
        try {
            await autoriserDemarrage(id);
            await loadData();
            setSelected(null);
        } catch (e) {
            alert("Erreur d'autorisation : " + e.message);
        } finally {
            setProcessing(null);
        }
    };

    // Action 2 : Assigner un prestataire de force
    const handleAssigner = async (id, fId) => {
        if (!fId) return alert("Veuillez renseigner un ID de prestataire.");
        setProcessing(id);
        try {
            await assignerFournisseur(id, parseInt(fId));
            await loadData();
            setSelected(null);
            setFournisseurInputId('');
        } catch (e) {
            alert("Erreur d'assignation : " + e.message);
        } finally {
            setProcessing(null);
        }
    };

    // Action 3 : Annuler générique
    const handleCancel = async (id) => {
        if (!window.confirm("Confirmer l'annulation de cette mission ?")) return;
        setProcessing(id);
        try {
            await updateReservationStatut(id, 'annule');
            await loadData();
            setSelected(null);
        } catch (e) {
            alert("Erreur lors de l'annulation : " + e.message);
        } finally {
            setProcessing(null);
        }
    };

    // Action 4 : Soumettre la création forcée d'une mission
    const handleCreateMission = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newMission,
                fournisseurId: fournisseurInputId ? parseInt(fournisseurInputId) : null
            };
            await adminCreerReservation(payload);
            setShowCreateModal(false);
            // Reset du formulaire
            setNewMission({
                besoin: '', adresse: '', telephone: '', clientNom: '',
                serviceId: '', serviceNom: '', type: 'classique', dateIntervention: ''
            });
            setFournisseurInputId('');
            loadData();
        } catch (e) {
            alert("Erreur lors de la création : " + e.message);
        }
    };

    return (
        <div className="space-y-6 text-slate-100">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-white/5 pb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Gestion du Réseau Kanari</h2>
                    <p className="text-slate-400 text-sm">Supervision en temps réel des interventions et de la double validation</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-2xl text-xs font-bold text-white transition flex items-center gap-2 shadow-lg shadow-purple-600/20 active:scale-95"
                    >
                        <Plus size={14}/> Créer une Mission
                    </button>
                    <button 
                        onClick={loadData} 
                        className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold text-white border border-white/10 transition active:scale-95"
                    >
                        🔄 Actualiser
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 flex items-center gap-2 text-sm">
                    <AlertCircle size={18}/> {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="border-b border-white/5 text-slate-500 text-[10px] uppercase tracking-widest bg-white/[0.01]">
                                <th className="px-6 py-5">Dossier / Client</th>
                                <th className="px-6 py-5">Service requis</th>
                                <th className="px-6 py-5">Prestataire Assigné</th>
                                <th className="px-6 py-5">Statut actuel</th>
                                <th className="px-6 py-5 text-right">Détails</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-purple-500" size={30} />
                                            <span className="text-sm">Synchronisation avec la base Kanari...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : reservations.length === 0 ? (
                                <tr><td colSpan="5" className="py-12 text-center text-slate-500 text-sm">Aucune mission enregistrée pour le moment.</td></tr>
                            ) : reservations.map(r => (
                                <tr key={r.id} className="hover:bg-white/[0.02] transition">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white text-sm">{r.clientNom || 'Client Anonyme'}</div>
                                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5"><Phone size={10}/> {r.telephone || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-purple-300">{r.serviceNom || 'Intervention'}</div>
                                        <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{r.adresse}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {r.prestataire ? (
                                            <div>
                                                <div className="text-sm font-medium text-white flex items-center gap-1.5">
                                                    <Briefcase size={12} className="text-blue-400"/>
                                                    {r.prestataire.nomEntreprise}
                                                </div>
                                                <div className="text-[10px] text-slate-500">ID Presta : #{r.prestataire.id}</div>
                                            </div>
                                        ) : r.refusePar ? (
                                            <div className="text-[11px] text-rose-400 bg-rose-500/5 px-2 py-1 rounded-lg border border-rose-500/10 inline-block">
                                                ❌ Refusé par Presta #{r.refusePar}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-600 italic">Aucun prestataire</span>
                                        )}
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
            </div>

            {/* Modal Détails & Process de Décision */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
                    <div className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl max-w-lg w-full shadow-2xl relative my-8">
                        <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm bg-white/5 p-2 rounded-xl">✕</button>
                        
                        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                            📂 Traitement du dossier #{selected.id}
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <DetailItem icon={<User size={13}/>} label="Client" value={selected.clientNom || 'Non renseigné'} />
                                <DetailItem icon={<Phone size={13}/>} label="Téléphone" value={selected.telephone} />
                            </div>
                            
                            <DetailItem icon={<MapPin size={13}/>} label="Lieu exact d'intervention" value={selected.adresse} />
                            <DetailItem icon={<Home size={13}/>} label="Description du besoin client" value={selected.besoin} isLong />

                            {selected.motifRefus && (
                                <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 text-xs text-rose-300">
                                    <strong>Dernier motif de refus prestataire :</strong> {selected.motifRefus}
                                </div>
                            )}

                            {/* ── ZONE DE DÉCISION INTELLIGENTE ET ADAPTATIVE ── */}
                            <div className="pt-4 border-t border-white/5 space-y-4">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Actions d'administration requises :</div>
                                
                                {/* Étape 1 : La mission est libre, il faut assigner */}
                                {selected.statut === 'en_attente' && (
                                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-3">
                                        <div className="text-xs text-amber-300 font-medium">Cette mission n'a aucun prestataire actif. Assignez-en un :</div>
                                        <div className="flex gap-2">
                                            <input 
                                                type="number" 
                                                placeholder="ID du prestataire..." 
                                                value={fournisseurInputId}
                                                onChange={(e) => setFournisseurInputId(e.target.value)}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-amber-500/50"
                                            />
                                            <button 
                                                onClick={() => handleAssigner(selected.id, fournisseurInputId)}
                                                disabled={processing}
                                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1"
                                            >
                                                {processing === selected.id ? <Loader2 className="animate-spin" size={14}/> : 'Assigner'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Étape 2 : Double validation (Le presta attend ton feu vert) */}
                                {selected.statut === 'en_validation_admin' && (
                                    <div className="p-4 bg-purple-500/5 border border-purple-500/15 rounded-2xl space-y-3">
                                        <div className="text-xs text-purple-300 flex items-center gap-1">
                                            <ShieldCheck size={14}/> Le prestataire a accepté la mission ! Donne ton autorisation finale pour lancer l'intervention.
                                        </div>
                                        <button 
                                            onClick={() => handleAutoriser(selected.id)}
                                            disabled={processing}
                                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-extrabold transition flex items-center justify-center gap-2"
                                        >
                                            {processing === selected.id ? <Loader2 className="animate-spin" size={16}/> : '🟢 ACCORDER LE FEU VERT (Autoriser démarrage)'}
                                        </button>
                                    </div>
                                )}

                                {/* Actions générales */}
                                <div className="flex gap-3">
                                    {selected.statut !== 'annule' && selected.statut !== 'valide' && (
                                        <button 
                                            onClick={() => handleCancel(selected.id)}
                                            disabled={processing}
                                            className="flex-1 py-2.5 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-bold transition border border-white/5"
                                        >
                                            Annuler / Rejeter la mission
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setSelected(null)}
                                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition"
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Création Complète d'une Mission */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
                    <form onSubmit={handleCreateMission} className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl max-w-xl w-full shadow-2xl relative my-8 space-y-4">
                        <h3 className="text-xl font-black text-white flex items-center gap-2">
                            🛠️ Forcer la création d'une nouvelle mission
                        </h3>
                        <p className="text-xs text-slate-400">Permet d'ajouter manuellement une commande client par téléphone ou contrat.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input 
                                type="text" placeholder="Nom du Client" required
                                value={newMission.clientNom} onChange={e => setNewMission({...newMission, clientNom: e.target.value})}
                                className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500"
                            />
                            <input 
                                type="text" placeholder="Téléphone Client" required
                                value={newMission.telephone} onChange={e => setNewMission({...newMission, telephone: e.target.value})}
                                className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        <input 
                            type="text" placeholder="Adresse complète de l'intervention" required
                            value={newMission.adresse} onChange={e => setNewMission({...newMission, adresse: e.target.value})}
                            className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input 
                                type="number" placeholder="ID Service Kanari (Ex: 1, 2)" required
                                value={newMission.serviceId} onChange={e => setNewMission({...newMission, serviceId: e.target.value})}
                                className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500"
                            />
                            <input 
                                type="text" placeholder="Nom complet du service (Ex: Plomberie)" required
                                value={newMission.serviceNom} onChange={e => setNewMission({...newMission, serviceNom: e.target.value})}
                                className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <select 
                                value={newMission.type} onChange={e => setNewMission({...newMission, type: e.target.value})}
                                className="w-full bg-slate-800 border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500 text-white"
                            >
                                <option value="classique">Classique (Urgence)</option>
                                <option value="planifie">Planifié</option>
                                <option value="contrat">Contrat d'abonnement</option>
                            </select>
                            <input 
                                type="datetime-local" 
                                value={newMission.dateIntervention} onChange={e => setNewMission({...newMission, dateIntervention: e.target.value})}
                                className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500 text-slate-300"
                            />
                        </div>

                        <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-2">
                            <label className="text-[11px] font-bold text-blue-300 block">Optionnel : Assigner immédiatement un prestataire au dépôt de la mission</label>
                            <input 
                                type="number" placeholder="ID du fournisseur (Laisser vide si assignation libre)"
                                value={fournisseurInputId} onChange={e => setFournisseurInputId(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500 text-white"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                type="submit"
                                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition"
                            >
                                Valider et Enregistrer la mission
                            </button>
                            <button 
                                type="button" onClick={() => setShowCreateModal(false)}
                                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm transition"
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

const StatusBadge = ({ statut }) => {
    const config = STATUT_CONFIG[statut] || { label: statut || 'Inconnu', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border tracking-wider ${config.color}`}>
            {config.label}
        </span>
    );
};

const DetailItem = ({ icon, label, value, isLong }) => (
    <div className={isLong ? "col-span-2" : ""}>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 flex items-center gap-1">{icon} {label}</div>
        <div className="text-white text-sm p-3 bg-white/5 rounded-xl border border-white/5 break-words whitespace-pre-line">{value || '—'}</div>
    </div>
);