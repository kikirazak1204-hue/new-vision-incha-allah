import React, { useEffect, useState } from 'react';
import {
    getAdminReservations,
    updateReservationStatut,
    deleteReservation,
} from '../../util/api';

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
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const res = await getAdminReservations();
                if (!mounted) return;
                setReservations(res.data || []);
            } catch (err) {
                console.error('Erreur chargement réservations', err);
                setError(err.message || 'Erreur chargement réservations');
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, []);

    const handleChangeStatut = async (id, statut) => {
        if (!window.confirm(`Confirmer : passer la réservation ${id} à "${statut}" ?`)) return;
        try {
            setProcessing(id);
            const res = await updateReservationStatut(id, statut);
            setReservations(prev => prev.map(r => (r.id === id ? res.data : r)));
            alert('Statut mis à jour.');
        } catch (err) {
            console.error(err);
            alert(err.message || 'Erreur lors de la mise à jour');
        } finally {
            setProcessing(null);
        }
    };

    const handleSupprimer = async (id) => {
        if (!window.confirm('Supprimer définitivement cette réservation ?')) return;
        try {
            setProcessing(id);
            const res = await deleteReservation(id);
            if (res.success) {
                setReservations(prev => prev.filter(r => r.id !== id));
                alert('Réservation supprimée.');
            } else {
                throw new Error(res.message || 'Erreur suppression');
            }
        } catch (err) {
            console.error(err);
            alert(err.message || 'Erreur lors de la suppression');
        } finally {
            setProcessing(null);
        }
    };

    if (loading) return <div className="text-center py-10 animate-pulse">Chargement des réservations...</div>;

    return (
        <div className="p-4">
            <h3 className="text-xl font-semibold mb-4">Réservations - Plomberie</h3>

            {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}

            {reservations.length === 0 ? (
                <div className="text-gray-400">Aucune réservation trouvée.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full table-auto text-left">
                        <thead>
                            <tr className="text-sm text-gray-400">
                                <th className="px-3 py-2">ID</th>
                                <th className="px-3 py-2">Client</th>
                                <th className="px-3 py-2">Téléphone</th>
                                <th className="px-3 py-2">Service</th>
                                <th className="px-3 py-2">Date</th>
                                <th className="px-3 py-2">Statut</th>
                                <th className="px-3 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map(r => (
                                <tr key={r.id} className="border-t border-white/5">
                                    <td className="px-3 py-3 text-sm text-gray-200">{r.id}</td>
                                    <td className="px-3 py-3 text-sm">{r.clientNom || r.client?.nom || '—'}</td>
                                    <td className="px-3 py-3 text-sm text-gray-400">{r.telephone || r.client?.telephone || '—'}</td>
                                    <td className="px-3 py-3 text-sm">{r.serviceNom || r.service?.nom || 'Plomberie'}</td>
                                    <td className="px-3 py-3 text-sm text-gray-300">{new Date(r.date || r.createdAt).toLocaleString()}</td>
                                    <td className="px-3 py-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs ${r.statut === 'ACCEPTEE' ? 'bg-emerald-600/20 text-emerald-300' :
                                                r.statut === 'ANNULEE' ? 'bg-red-600/10 text-red-300' :
                                                    'bg-yellow-500/10 text-yellow-300'
                                            }`}>
                                            {r.statut || 'EN_ATTENTE'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-sm flex gap-2">
                                        <button
                                            onClick={() => setSelected(r)}
                                            className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-sm"
                                        >
                                            Détails
                                        </button>
                                        <button
                                            onClick={() => handleChangeStatut(r.id, r.statut === 'ACCEPTEE' ? 'EN_ATTENTE' : 'ACCEPTEE')}
                                            disabled={processing === r.id}
                                            className="px-2 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 rounded text-sm text-emerald-300 disabled:opacity-50"
                                        >
                                            {processing === r.id ? '…' : 'Approuver'}
                                        </button>
                                        <button
                                            onClick={() => handleChangeStatut(r.id, 'ANNULEE')}
                                            disabled={processing === r.id}
                                            className="px-2 py-1 bg-red-600/10 hover:bg-red-600/20 rounded text-sm text-red-300 disabled:opacity-50"
                                        >
                                            {processing === r.id ? '…' : 'Annuler'}
                                        </button>
                                        <button
                                            onClick={() => handleSupprimer(r.id)}
                                            disabled={processing === r.id}
                                            className="px-2 py-1 bg-red-500/5 hover:bg-red-500/10 rounded text-sm text-red-400 disabled:opacity-50"
                                        >
                                            {processing === r.id ? '…' : 'Supprimer'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal détails */}
            {selected && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/60 p-4 z-50">
                    <div className="bg-gray-900 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-lg font-semibold">Détails réservation #{selected.id}</h4>
                            <button onClick={() => setSelected(null)} className="text-sm text-gray-400 hover:text-white">✕</button>
                        </div>

                        <div className="space-y-3 text-sm text-gray-200">
                            <div><span className="text-gray-400">Client :</span> {selected.clientNom || selected.client?.nom || '—'}</div>
                            <div><span className="text-gray-400">Téléphone :</span> {selected.telephone || selected.client?.telephone || '—'}</div>
                            <div><span className="text-gray-400">Service :</span> {selected.serviceNom || selected.service?.nom || '—'}</div>
                            <div><span className="text-gray-400">Date :</span> {new Date(selected.date || selected.createdAt).toLocaleString()}</div>
                            <div><span className="text-gray-400">Statut :</span> {selected.statut || 'EN_ATTENTE'}</div>
                            <div><span className="text-gray-400">Montant estimé :</span> {selected.montantTotal || '—'}</div>
                            {selected.adresseIntervention && (
                                <div><span className="text-gray-400">Adresse :</span> {selected.adresseIntervention}</div>
                            )}
                            {selected.description && (
                                <div><span className="text-gray-400">Description :</span> {selected.description}</div>
                            )}

                            {/* ✅ Photo corrigée */}
                            {selected.photo && (
                                <div className="mt-3">
                                    <p className="text-gray-400 mb-1">Photo :</p>
                                    <img
                                        src={fileUrl(selected.photo)}
                                        alt="Photo de la panne"
                                        className="max-h-48 rounded-xl border border-white/10"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                </div>
                            )}

                            {/* ✅ Audio corrigé */}
                            {selected.audio && (
                                <div className="mt-3">
                                    <p className="text-gray-400 mb-1">Message vocal :</p>
                                    <audio
                                        src={fileUrl(selected.audio)}
                                        controls
                                        className="w-full rounded-lg"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => setSelected(null)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}