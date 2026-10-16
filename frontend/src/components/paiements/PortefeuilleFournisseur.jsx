// Portefeuille prestataire : solde, encaissements (total / commission / net), commissions à déposer + retard
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPortefeuilleFournisseur, fcfa } from '../../util/paiementsApi';

const jour = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

function Carte({ label, value, accent, note }) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 block mb-1.5">{label}</span>
            <p className={`text-xl font-extrabold tracking-tight ${accent || 'text-[#061a3a]'}`}>{value}</p>
            {note && <p className="text-[11px] text-slate-500 mt-1">{note}</p>}
        </div>
    );
}

export default function PortefeuilleFournisseur() {
    const navigate = useNavigate();
    const [d, setD] = useState(null);
    const [erreur, setErreur] = useState('');
    const [loading, setLoading] = useState(true);

    const charger = useCallback(async () => {
        try { setD(await getPortefeuilleFournisseur()); setErreur(''); }
        catch (e) { setErreur(e.message || 'Impossible de charger le portefeuille.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { charger(); const i = setInterval(charger, 15000); return () => clearInterval(i); }, [charger]);

    if (loading) return <p className="text-sm text-slate-500 animate-pulse">Chargement du portefeuille…</p>;
    if (erreur) return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex justify-between">
            <span>{erreur}</span><button onClick={charger} className="font-bold underline">Réessayer</button>
        </div>
    );

    const t = d.totaux;
    const deposer = (id) => navigate('/paiement', { state: { reservationId: id } });

    return (
        <div className="space-y-8 text-left">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Carte label="Solde disponible" value={fcfa(t.solde)} accent="text-emerald-600" note="Net crédité, après retraits" />
                <Carte label="Total encaissé (brut)" value={fcfa(t.brut)} />
                <Carte label="Commission Kanari" value={fcfa(t.commission)} accent="text-rose-600" />
                <Carte label="Votre net" value={fcfa(t.net)} accent="text-emerald-600" />
                <Carte label="En attente de validation" value={fcfa(t.enAttenteNet)} accent="text-amber-600" note="Net à venir" />
                <Carte label="Déjà retiré" value={fcfa(t.totalRetire)} />
                <Carte label="Commissions à déposer" value={fcfa(t.commissionsDues)} accent="text-blue-600" note="Missions réglées sur place" />
                <Carte label="Dont en retard" value={fcfa(t.commissionsEnRetard)} accent={t.commissionsEnRetard > 0 ? 'text-red-600' : undefined} />
            </div>

            <section className="space-y-3">
                <h3 className="font-extrabold text-lg text-[#061a3a]">Commissions à déposer à Kanari</h3>
                {d.commissionsDues.length === 0 ? (
                    <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6">Aucune commission en attente.</p>
                ) : d.commissionsDues.map((c) => (
                    <div key={c.reservationId} className={`bg-white border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${c.retard ? 'border-red-300' : 'border-slate-200'}`}>
                        <div>
                            <span className="text-xs font-bold text-indigo-500">Mission #{c.reservationId}</span>
                            <p className="text-sm font-bold text-[#061a3a]">{c.serviceNom || 'Prestation'} · encaissé {fcfa(c.montantMission)}</p>
                            <p className={`text-xs mt-0.5 ${c.retard ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                                {c.retard ? `En retard de ${c.joursRetard} jour(s) — limite ${jour(c.dateLimite)}` : `À déposer avant le ${jour(c.dateLimite)}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-mono font-extrabold text-[#061a3a]">{fcfa(c.commission)}</span>
                            {c.depotEnVerification
                                ? <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">Dépôt en vérification</span>
                                : <button onClick={() => deposer(c.reservationId)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black">Déposer ma commission</button>}
                        </div>
                    </div>
                ))}
            </section>

            <section className="space-y-3">
                <h3 className="font-extrabold text-lg text-[#061a3a]">Mes encaissements</h3>
                {d.encaissements.length === 0 ? (
                    <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6">Aucun encaissement validé pour l'instant.</p>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                                <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Origine</th><th className="text-right p-3">Total</th><th className="text-right p-3">Commission</th><th className="text-right p-3">Votre net</th></tr>
                            </thead>
                            <tbody>
                                {d.encaissements.map((p) => (
                                    <tr key={p.id} className="border-b border-slate-100 last:border-0">
                                        <td className="p-3 text-slate-600">{jour(p.date)}</td>
                                        <td className="p-3 font-semibold text-[#061a3a]">{p.type === 'COMMANDE' ? `Commande #${p.commandeId}` : `Mission #${p.reservationId}`}</td>
                                        <td className="p-3 text-right font-mono">{fcfa(p.montant)}</td>
                                        <td className="p-3 text-right font-mono text-rose-600">− {fcfa(p.commission)} <span className="text-slate-400">({p.taux}%)</span></td>
                                        <td className="p-3 text-right font-mono font-bold text-emerald-600">{fcfa(p.net)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}