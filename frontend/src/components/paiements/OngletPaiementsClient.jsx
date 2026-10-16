// Onglet « Paiements » du dashboard client : 1 mission = 1 bon = 1 paiement
import React from 'react';
import EtatPaiementBadge from './EtatPaiementBadge';
import { fcfa } from '../../util/paiementsApi';

const ORDRE = { a_payer: 0, rejete: 1, bon_a_valider: 2, en_attente: 3, direct: 4, paye: 5, rembourse: 6 };

function Stat({ label, value, accent }) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500 block mb-2">{label}</span>
            <p className={`text-2xl font-extrabold tracking-tight ${accent || 'text-[#061a3a]'}`}>{value}</p>
        </div>
    );
}

export default function OngletPaiementsClient({ missions = [], finance, navigate, onValiderBon, onRefresh }) {
    const t = finance?.totaux || {};
    const payer = (id) => navigate('/paiement', { state: { reservationId: id } });
    const lignes = missions
        .map((m) => ({ m, f: finance?.missions?.[m.id] }))
        .filter(({ f }) => f && ORDRE[f.etat] !== undefined)
        .sort((a, b) => ORDRE[a.f.etat] - ORDRE[b.f.etat]);

    return (
        <div className="space-y-6 text-left">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-extrabold text-xl text-[#061a3a]">Paiements & Transactions</h3>
                    <p className="text-xs text-slate-500 mt-1">Chaque mission est rattachée à son bon d'intervention et à son paiement.</p>
                </div>
                <button onClick={() => navigate('/historique-paiements')} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-[#061a3a] rounded-xl text-xs font-bold transition">
                    Historique complet
                </button>
            </div>

            {finance?.erreur && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex justify-between items-center">
                    <span>{finance.erreur}</span>
                    <button onClick={onRefresh} className="font-bold underline">Réessayer</button>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Stat label="Total payé" value={fcfa(t.paye)} accent="text-emerald-600" />
                <Stat label="En vérification" value={fcfa(t.enAttente)} accent="text-amber-600" />
                <Stat label="Reste à payer" value={fcfa(t.aPayer)} accent="text-blue-600" />
            </div>

            {lignes.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
                    <p className="text-slate-500 text-sm">Aucun paiement pour l'instant. Il apparaît ici dès qu'un bon d'intervention est établi.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {lignes.map(({ m, f }) => (
                        <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                                <div>
                                    <span className="text-xs font-bold text-indigo-500">Mission #{m.id}</span>
                                    <p className="text-[#061a3a] font-bold text-sm mt-0.5">{f.serviceNom || m.service?.nom || m.serviceNom || 'Prestation'}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{m.prestataire?.nomEntreprise || 'Prestataire'}</p>
                                </div>
                                <div className="sm:text-right">
                                    <p className="text-[#061a3a] font-mono font-extrabold text-lg">{fcfa(f.montant)}</p>
                                    <p className="text-[11px] text-slate-500">Main d'œuvre {fcfa(f.mainOeuvre)} · Pièces {fcfa(f.pieces)}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <EtatPaiementBadge etat={f.etat} />
                                    {f.paiement?.transactionId && <span className="text-[11px] text-slate-500 font-mono">{f.paiement.transactionId}</span>}
                                    {f.etat === 'rejete' && f.paiement?.motif && <span className="text-[11px] text-red-600">Motif : {f.paiement.motif}</span>}
                                    {f.etat === 'direct' && <span className="text-[11px] text-slate-500">À régler directement auprès du prestataire.</span>}
                                </div>
                                {(f.etat === 'a_payer' || f.etat === 'rejete') && (
                                    <button onClick={() => payer(m.id)} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-black shadow">
                                        {f.etat === 'rejete' ? 'Réessayer le paiement' : `Payer ${fcfa(f.montant)}`}
                                    </button>
                                )}
                                {f.etat === 'bon_a_valider' && (
                                    <button onClick={() => onValiderBon(m.id)} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black">
                                        Voir le bon & valider
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}