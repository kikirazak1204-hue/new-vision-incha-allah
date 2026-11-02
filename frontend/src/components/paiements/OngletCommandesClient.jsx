// Onglet « Mes commandes » : suivi des achats boutique, du paiement à la livraison
import React, { useEffect, useState, useCallback } from 'react';
import EtatPaiementBadge from './EtatPaiementBadge';
import { getMesCommandes, fcfa, ETAPES_LIVRAISON } from '../../util/paiementsApi';

const ETAT_PAIEMENT = { non_paye: 'a_payer', en_attente: 'en_attente', paye: 'paye', echoue: 'rejete', rembourse: 'rembourse' };

function Etapes({ index }) {
    return (
        <div className="flex items-start gap-1.5 mt-3">
            {ETAPES_LIVRAISON.map((e, i) => (
                <React.Fragment key={e.id}>
                    <div className="flex flex-col items-center min-w-[56px]">
                        <span className={`w-3 h-3 rounded-full ${i <= index ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        <span className={`text-[10px] mt-1 text-center ${i <= index ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>{e.label}</span>
                    </div>
                    {i < ETAPES_LIVRAISON.length - 1 && <span className={`flex-1 h-0.5 mt-1.5 ${i < index ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                </React.Fragment>
            ))}
        </div>
    );
}

export default function OngletCommandesClient({ navigate }) {
    const [commandes, setCommandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur] = useState('');

    const charger = useCallback(async () => {
        try { const d = await getMesCommandes(); setCommandes(d.data || []); setErreur(''); }
        catch (e) { setErreur(e.message || 'Impossible de charger vos commandes.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { charger(); const i = setInterval(charger, 15000); return () => clearInterval(i); }, [charger]);

    if (loading) return <p className="text-sm text-slate-500 animate-pulse">Chargement de vos commandes…</p>;

    return (
        <div className="space-y-4 text-left">
            <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-xl text-[#061a3a]">Mes commandes</h3>
                <button onClick={() => navigate('/produits')} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-[#061a3a] rounded-xl text-xs font-bold">Continuer mes achats</button>
            </div>
            {erreur && <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">{erreur}</div>}
            {!erreur && commandes.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 text-sm">Vous n'avez pas encore passé de commande.</div>
            )}

            {commandes.map((c) => {
                const etat = c.statut === 'annulée' && c.statutPaiement !== 'rembourse' ? 'annulee' : (ETAT_PAIEMENT[c.statutPaiement] || 'a_payer');
                const items = c.itemsCommande || [];
                const index = Math.min(...items.map((i) => Math.max(0, ETAPES_LIVRAISON.findIndex((e) => e.id === i.statutLivraison))), 3);
                const payee = c.statutPaiement === 'paye';
                return (
                    <div key={c.id} className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
                        <div className="flex flex-wrap justify-between items-start gap-3">
                            <div>
                                <span className="text-xs font-bold text-indigo-500">Commande #{c.id}</span>
                                <p className="text-[11px] text-slate-500">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-mono font-extrabold text-lg text-[#061a3a]">{fcfa(c.montantTotal)}</p>
                                <EtatPaiementBadge etat={etat} />
                            </div>
                        </div>

                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl">
                            {items.map((i) => {
                                const p = i.produitCommandeProduit;
                                const prix = Number(i.prixUnitaire ?? p?.prix ?? 0);
                                return (
                                    <div key={i.id} className="flex justify-between items-center gap-3 p-3 text-sm">
                                        <div>
                                            <p className="font-semibold text-[#061a3a]">{i.nomProduit || p?.nom || 'Produit'} <span className="text-slate-500 font-normal">×{i.quantite}</span></p>
                                            <p className="text-[11px] text-slate-500">{p?.fournisseur?.nomEntreprise || 'Fournisseur'}{payee && ` · ${ETAPES_LIVRAISON.find((e) => e.id === i.statutLivraison)?.label || ''}`}</p>
                                        </div>
                                        <span className="font-mono text-xs font-bold text-slate-700 whitespace-nowrap">{fcfa(prix * i.quantite)}</span>
                                    </div>
                                );
                            })}
                            {Number(c.fraisLivraison) > 0 && (
                                <div className="flex justify-between p-3 text-xs text-slate-600"><span>Livraison</span><span className="font-mono font-bold">{fcfa(c.fraisLivraison)}</span></div>
                            )}
                        </div>

                        {payee && <Etapes index={index} />}
                        {(etat === 'a_payer' || etat === 'rejete') && (
                            <button onClick={() => navigate('/paiement', { state: { commandeId: c.id } })} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-xl text-xs shadow-lg">
                                {etat === 'rejete' ? 'Réessayer le paiement' : `Payer ${fcfa(c.montantTotal)}`}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}