import React, { useEffect, useState } from 'react';
import { getAdminPaiements, validerPaiement, rejeterPaiement } from '../../util/api';

export default function PaiementAdmin() {
    const [paiements, setPaiements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filtreStatut, setFiltreStatut] = useState("tous");
    const [actionLoadingId, setActionLoadingId] = useState(null);

    useEffect(() => {
        chargerPaiements();
    }, []);

    const chargerPaiements = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getAdminPaiements();
            // Gère si l'API renvoie directement le tableau ou un objet enveloppé { data: [...] }
            const dataList = Array.isArray(res) ? res : (res?.data || res?.paiements || []);
            setPaiements(dataList);
        } catch (err) {
            console.error("Erreur lors du chargement des paiements:", err);
            setError("Impossible de récupérer les transactions depuis le serveur.");
        } finally {
            setLoading(false);
        }
    };

    // Confirmer qu'un transfert a bien été reçu sur vos comptes
    const handleValider = async (id, ref) => {
        if (!window.confirm(`✅ Confirmer la validation du paiement pour la référence ${ref} ?`)) return;

        setActionLoadingId(id);
        try {
            await validerPaiement(id);
            // Mise à jour optimiste de l'état local
            setPaiements(prev => prev.map(p => p.id === id ? { ...p, statut: 'valide' } : p));
        } catch (err) {
            console.error(err);
            alert(err.message || "Erreur lors de la validation du paiement.");
        } finally {
            setActionLoadingId(null);
        }
    };

    // Rejeter si la référence est introuvable ou incorrecte
    const handleRejeter = async (id, ref) => {
        if (!window.confirm(`❌ Rejeter la transaction ${ref} ?`)) return;

        setActionLoadingId(id);
        try {
            await rejeterPaiement(id);
            // Mise à jour optimiste de l'état local
            setPaiements(prev => prev.map(p => p.id === id ? { ...p, statut: 'rejete' } : p));
        } catch (err) {
            console.error(err);
            alert(err.message || "Erreur lors du rejet de la transaction.");
        } finally {
            setActionLoadingId(null);
        }
    };

    // Filtrage dynamique par nom, référence, téléphone ou ID commande
    const filteredPaiements = paiements.filter(p => {
        const matchesSearch =
            p.clientNom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.referenceTransaction?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.telephoneClient?.includes(searchTerm) ||
            p.commandeId?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatut = filtreStatut === "tous" || p.statut === filtreStatut;

        return matchesSearch && matchesStatut;
    });

    if (loading && paiements.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm font-mono animate-pulse">Vérification des flux financiers...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans">
            {/* Header + Actions Globales + Recherche */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>💳</span> Validation des Transactions
                        <span className="text-xs font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                            {paiements.filter(p => p.statut === 'en_attente').length} en attente
                        </span>
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Bouton de rafraîchissement manuel */}
                    <button
                        onClick={chargerPaiements}
                        disabled={loading}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl transition flex items-center gap-1.5 border border-slate-700/60 disabled:opacity-50"
                        title="Actualiser les flux"
                    >
                        <span className={loading ? "animate-spin" : ""}>🔄</span> Actualiser
                    </button>

                    {/* Sélecteur de statut */}
                    <select
                        value={filtreStatut}
                        onChange={(e) => setFiltreStatut(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="tous">Tous les statuts</option>
                        <option value="en_attente">⏳ En attente</option>
                        <option value="valide">✅ Validés</option>
                        <option value="rejete">❌ Rejetés</option>
                    </select>

                    {/* Champ de recherche */}
                    <div className="w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Rechercher réf, client, tel..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                        />
                    </div>
                </div>
            </div>

            {/* Message d'erreur éventuel */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm flex justify-between items-center">
                    <span>{error}</span>
                    <button onClick={chargerPaiements} className="underline text-xs font-bold hover:text-rose-300">Réessayer</button>
                </div>
            )}

            {/* Grille des transactions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPaiements.map(p => (
                    <div
                        key={p.id}
                        className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/5 relative"
                    >
                        <div>
                            {/* En-tête de la carte */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-bold text-emerald-400 uppercase">
                                        {p.modePaiement ? p.modePaiement.charAt(0) : 'M'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white group-hover:text-emerald-300 transition-colors">
                                            {p.clientNom || 'Client Anonyme'}
                                        </h3>
                                        <p className="text-xs text-slate-400">{p.telephoneClient || 'Numéro non spécifié'}</p>
                                    </div>
                                </div>

                                <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded-md tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                                    {p.modePaiement || 'Mobile Money'}
                                </span>
                            </div>

                            {/* Détails du transfert */}
                            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2 mb-4">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Réf. SMS :</span>
                                    <span className="font-mono font-bold text-emerald-400 uppercase">{p.referenceTransaction || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Commande :</span>
                                    <span className="font-mono text-slate-300">{p.commandeId || `#${p.id}`}</span>
                                </div>
                                <div className="flex justify-between items-baseline pt-2 border-t border-slate-800/60">
                                    <span className="text-xs text-slate-400">Montant reçu (TTC) :</span>
                                    <span className="text-base font-black font-mono text-white">
                                        {Number(p.montantTTC || 0).toLocaleString()} FCFA
                                    </span>
                                </div>
                            </div>

                            {/* Date et Badge Statut */}
                            <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                                <span>{p.date || (p.createdAt ? new Date(p.createdAt).toLocaleString() : 'Récemment')}</span>
                                <span className={`font-bold px-2 py-0.5 rounded ${p.statut === 'valide'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : p.statut === 'rejete'
                                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    }`}>
                                    {p.statut === 'valide' ? '✅ Validé' : p.statut === 'rejete' ? '❌ Rejeté' : '⏳ En attente'}
                                </span>
                            </div>
                        </div>

                        {/* Actions d'approbation / rejet */}
                        {p.statut === 'en_attente' ? (
                            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800">
                                <button
                                    onClick={() => handleRejeter(p.id, p.referenceTransaction)}
                                    disabled={actionLoadingId === p.id}
                                    className="py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl border border-rose-500/20 transition text-xs font-bold disabled:opacity-50"
                                >
                                    {actionLoadingId === p.id ? '...' : 'Rejeter'}
                                </button>
                                <button
                                    onClick={() => handleValider(p.id, p.referenceTransaction)}
                                    disabled={actionLoadingId === p.id}
                                    className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition text-xs font-bold shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                                >
                                    {actionLoadingId === p.id ? '...' : 'Valider'}
                                </button>
                            </div>
                        ) : (
                            <div className="mt-4 pt-3 border-t border-slate-800 text-center">
                                <span className="text-xs text-slate-500 italic">Traité par l'administration</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Message si aucun paiement trouvé */}
            {filteredPaiements.length === 0 && !loading && (
                <div className="text-center py-12 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                    <p className="text-slate-500 text-sm">Aucune transaction trouvée{searchTerm ? ` pour "${searchTerm}"` : ""}.</p>
                </div>
            )}
        </div>
    );
}