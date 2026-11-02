// Onglet « Commandes » du prestataire : commandes PAYÉES à préparer, avec suivi de livraison
import React, { useEffect, useState, useCallback } from 'react';
import { getCommandesFournisseur, majLivraisonCommande, fcfa, ETAPES_LIVRAISON } from '../../util/paiementsApi';

const SUIVANT = {
    a_preparer: ['en_preparation', 'Commencer la préparation'],
    en_preparation: ['expediee', 'Marquer expédiée'],
    expediee: ['livree', 'Marquer livrée'],
};

export default function OngletCommandesFournisseur() {
    const [commandes, setCommandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur] = useState('');
    const [action, setAction] = useState(null);

    const charger = useCallback(async () => {
        try { const d = await getCommandesFournisseur(); setCommandes(d.data || []); setErreur(''); }
        catch (e) { setErreur(e.message || 'Impossible de charger les commandes.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { charger(); const i = setInterval(charger, 15000); return () => clearInterval(i); }, [charger]);

    const avancer = async (id, statut) => {
        setAction(id);
        try { await majLivraisonCommande(id, statut); await charger(); }
        catch (e) { alert(e.message); }
        finally { setAction(null); }
    };

    if (loading) return <p className="text-sm text-slate-500 animate-pulse">Chargement des commandes…</p>;

    return (
        <div className="space-y-4 text-left">
            <h3 className="font-extrabold text-xl text-[#061a3a]">Commandes à préparer</h3>
            <p className="text-xs text-slate-500">Seules les commandes déjà payées apparaissent ici.</p>
            {erreur && <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">{erreur}</div>}
            {!erreur && commandes.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 text-sm">Aucune commande payée pour le moment.</div>
            )}

            {commandes.map((c) => {
                const suivant = SUIVANT[c.statutLivraison];
                return (
                    <div key={c.commandeId} className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
                        <div className="flex flex-wrap justify-between gap-3">
                            <div>
                                <span className="text-xs font-bold text-indigo-500">Commande #{c.commandeId}</span>
                                <p className="text-[11px] text-slate-500">{new Date(c.date).toLocaleDateString('fr-FR')}</p>
                                {c.client && <p className="text-sm font-semibold text-[#061a3a] mt-1">{c.client.nom} {c.client.telephone && `· ${c.client.telephone}`}</p>}
                                {(c.adresseLivraison || c.telephoneLivraison) && (
                                    <p className="text-xs text-slate-600">Livrer à : {c.adresseLivraison || '—'}{c.telephoneLivraison && ` · ${c.telephoneLivraison}`}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="font-mono font-extrabold text-lg text-[#061a3a]">{fcfa(c.total)}</p>
                                <span className="text-[11px] font-bold text-emerald-700">{ETAPES_LIVRAISON.find((e) => e.id === c.statutLivraison)?.label}</span>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl">
                            {c.articles.map((a) => (
                                <div key={a.itemId} className="flex justify-between p-3 text-sm">
                                    <span className="font-semibold text-[#061a3a]">{a.nom} <span className="text-slate-500 font-normal">×{a.quantite}</span></span>
                                    <span className="font-mono text-xs font-bold">{fcfa(a.sousTotal)}</span>
                                </div>
                            ))}
                        </div>
                        {suivant && (
                            <button onClick={() => avancer(c.commandeId, suivant[0])} disabled={action === c.commandeId}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black rounded-xl text-xs shadow-lg disabled:opacity-50">
                                {action === c.commandeId ? 'Mise à jour…' : suivant[1]}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}