import React, { useState } from 'react';
import { autoriserDemarrage, assignerFournisseur, updateReservationStatut } from '../util/api'; 
import { User, Phone, MapPin, Home, Loader2 } from 'lucide-react';

export default function MissionDetailsModal({ reservation, onClose, onRefresh }) {
    const [processing, setProcessing] = useState(false);
    const [fournisseurId, setFournisseurId] = useState('');

    if (!reservation) return null;

    const handleAction = async (actionFn, ...args) => {
        setProcessing(true);
        try {
            await actionFn(...args);
            await onRefresh();
            onClose();
        } catch (e) {
            alert("Erreur lors de l'opération : " + e.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
            <div className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl max-w-lg w-full shadow-2xl relative my-8 text-slate-100">
                
                {/* Bouton Fermer */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 p-2 rounded-xl transition"
                >
                    ✕
                </button>
                
                <h3 className="text-xl font-black text-white mb-6">📂 Dossier #{reservation.id}</h3>
                
                <div className="space-y-4">
                    {/* Section Client & Téléphone */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 flex items-center gap-1">
                                <User size={12}/> Client
                            </div>
                            <div className="text-white text-sm p-3 bg-white/5 rounded-xl border border-white/5 break-words">
                                {reservation.clientNom || '—'}
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 flex items-center gap-1">
                                <Phone size={12}/> Téléphone
                            </div>
                            <div className="text-white text-sm p-3 bg-white/5 rounded-xl border border-white/5 break-words">
                                {reservation.telephone || '—'}
                            </div>
                        </div>
                    </div>

                    {/* Section Adresse */}
                    <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 flex items-center gap-1">
                            <MapPin size={12}/> Lieu exact d'intervention
                        </div>
                        <div className="text-white text-sm p-3 bg-white/5 rounded-xl border border-white/5 break-words">
                            {reservation.adresse || '—'}
                        </div>
                    </div>

                    {/* Section Besoin */}
                    <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 flex items-center gap-1">
                            <Home size={12}/> Description du besoin client
                        </div>
                        <div className="text-white text-sm p-3 bg-white/5 rounded-xl border border-white/5 break-words whitespace-pre-line">
                            {reservation.besoin || '—'}
                        </div>
                    </div>

                    {/* Zone d'actions Administrateur */}
                    <div className="pt-4 border-t border-white/5 space-y-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                            Actions d'administration requises :
                        </span>
                        
                        {reservation.statut === 'en_attente' && (
                            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-3">
                                <label className="text-xs text-amber-300 font-medium block">Assigner un prestataire de force :</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        placeholder="ID du prestataire..." 
                                        value={fournisseurId}
                                        onChange={(e) => setFournisseurId(e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 text-sm focus:outline-none focus:border-amber-500/50 text-white"
                                    />
                                    <button 
                                        onClick={() => handleAction(assignerFournisseur, reservation.id, parseInt(fournisseurId, 10))}
                                        disabled={processing || !fournisseurId}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1"
                                    >
                                        {processing ? <Loader2 className="animate-spin" size={14}/> : 'Assigner'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {reservation.statut === 'en_validation_admin' && (
                            <button 
                                onClick={() => handleAction(autoriserDemarrage, reservation.id)}
                                disabled={processing}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-extrabold transition flex items-center justify-center gap-2"
                            >
                                {processing ? <Loader2 className="animate-spin" size={16}/> : '🟢 ACCORDER LE FEU VERT'}
                            </button>
                        )}

                        <div className="flex gap-3">
                            {['annule', 'valide'].indexOf(reservation.statut) === -1 && (
                                <button 
                                    onClick={() => window.confirm("Confirmer l'annulation ?") && handleAction(updateReservationStatut, reservation.id, 'annule')}
                                    disabled={processing}
                                    className="flex-1 py-2.5 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-bold transition border border-white/5"
                                >
                                    Annuler la mission
                                </button>
                            )}
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition text-slate-300"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}