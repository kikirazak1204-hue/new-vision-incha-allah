// Finances Kanari : résultat réel, retraits à traiter, corrections, fonds de soutien
import React, { useEffect, useState, useCallback } from 'react';
import { api, fcfa } from '../../util/paiementsApi';

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

export default function FinancesAdmin() {
    const [f, setF] = useState(null);
    const [retraits, setRetraits] = useState([]);
    const [statutListe, setStatutListe] = useState('EN_ATTENTE');
    const [msg, setMsg] = useState(null);
    const [saisie, setSaisie] = useState({});            // par retrait : référence / motif
    const [mois, setMois] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); });
    const [cloture, setCloture] = useState(null);
    const simuler = async () => {
        try { setCloture((await api('GET', `/api/soldes/admin/cloture/${mois}`)).data); } catch (e) { dire(false, e.message); }
    };
    const cloturer = async () => {
        if (!window.confirm(`Créditer les ristournes clients du mois ${mois} ? Cette opération ne peut pas être refaite pour les mêmes achats.`)) return;
        try { const r = await api('POST', `/api/soldes/admin/cloture/${mois}`); setCloture(r.data); dire(true, `Mois ${mois} clôturé : ${fcfa(r.data.total)} crédités à ${r.data.nbClients} client(s).`); charger(); }
        catch (e) { dire(false, e.message); }
    };
    const [corr, setCorr] = useState({ fournisseurId: '', montant: '', motif: '' });

    const dire = (ok, texte) => setMsg({ ok, texte });
    const charger = useCallback(async () => {
        try {
            const [a, b] = await Promise.all([api('GET', '/api/soldes/admin/finances'), api('GET', `/api/soldes/retraits?statut=${statutListe}`)]);
            setF(a.data); setRetraits(b.data || []);
        } catch (e) { dire(false, e.message); }
    }, [statutListe]);
    useEffect(() => { charger(); }, [charger]);

    const traiter = async (r, statut) => {
        const s = saisie[r.id] || {};
        if (statut === 'REFUSE' && !(s.motif || '').trim()) return dire(false, 'Indiquez le motif du refus.');
        if (statut === 'TRAITE' && !window.confirm(`Confirmer : ${fcfa(r.montant)} ont bien été envoyés vers ${r.operateur} ${r.telephone} ?`)) return;
        try {
            await api('PUT', `/api/soldes/retraits/${r.id}`, { statut, reference: s.reference, motif: s.motif });
            dire(true, statut === 'TRAITE' ? 'Retrait marqué comme effectué.' : 'Retrait refusé, montant restitué.');
            charger();
        } catch (e) { dire(false, e.message); }
    };

    const corriger = async (e) => {
        e.preventDefault();
        try {
            await api('POST', '/api/soldes/admin/correction', { ...corr, fournisseurId: Number(corr.fournisseurId), montant: Number(corr.montant) });
            dire(true, 'Correction enregistrée et tracée.'); setCorr({ fournisseurId: '', montant: '', motif: '' }); charger();
        } catch (er) { dire(false, er.message); }
    };

    const basculerSoutien = async (p) => {
        const activer = !p.soutienActif;
        if (activer && !window.confirm(`Confirmez-vous que ${p.nom} a reçu l'explication du fonds de soutien (5 %) et a donné son accord ?`)) return;
        try {
            await api('PUT', `/api/soldes/admin/fonds-soutien/${p.id}`, { actif: activer, accordRecueilli: activer });
            charger();
        } catch (e) { dire(false, e.message); }
    };

    if (!f) return <p className="p-6 text-sm text-slate-500 animate-pulse">{msg ? msg.texte : 'Chargement des finances…'}</p>;

    return (
        <div className="p-5 space-y-8 text-left">
            {msg && <div className={`p-3 rounded-xl text-xs font-bold border ${msg.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{msg.texte}</div>}

            <section className="space-y-3">
                <h3 className="font-extrabold text-lg text-[#061a3a]">Résultat de Kanari</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Carte label="Volume encaissé" value={fcfa(f.volumeEncaisse)} note="Paiements confirmés (commandes + missions)" />
                    <Carte label="Commissions encaissées" value={fcfa(f.commissionsEncaissees)} accent="text-emerald-600" />
                    <Carte label="Ristournes accordées" value={fcfa(f.ristournesAccordees)} accent="text-rose-600" note={`Coût réel, plafonné à ${f.plafondRistournePct} % de la commission`} />
                    <Carte label="Résultat réel Kanari" value={fcfa(f.resultatKanari)} accent="text-emerald-700" note="Commissions − ristournes" />
                    <Carte label="À reverser aux partenaires" value={fcfa(f.aReverserPartenaires)} accent="text-amber-600" note="Dette : cet argent n'est pas à Kanari" />
                    <Carte label="Retraits en attente" value={fcfa(f.retraitsEnAttente)} accent="text-amber-600" />
                    <Carte label="Récompenses à honorer" value={fcfa(f.ristournesAHonorer)} accent="text-amber-600" note="Dette : pas encore retirées ni dépensées" />
                    <Carte label="Dépôts des utilisateurs" value={fcfa(f.depotsClients)} accent="text-amber-600" note="Dette : cet argent n'est pas à Kanari" />
                    <Carte label="Fonds de soutien détenu" value={fcfa(f.fondsSoutienDetenu)} accent="text-indigo-600" note="Ce n'est pas un revenu de Kanari" />
                </div>
            </section>

            <section className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-extrabold text-lg text-[#061a3a]">Retraits des partenaires</h3>
                    <select value={statutListe} onChange={(e) => setStatutListe(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
                        <option value="EN_ATTENTE">À traiter</option><option value="TRAITE">Effectués</option><option value="REFUSE">Refusés</option>
                    </select>
                </div>
                {retraits.length === 0 ? <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-5">Aucun retrait dans cette liste.</p>
                    : retraits.map((r) => (
                        <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="font-bold text-sm text-[#061a3a]">RET-{String(r.id).padStart(5, '0')} · {r.fournisseurRetrait?.nomEntreprise || r.demandeur || `Utilisateur #${r.userId || r.fournisseurId}`}</p>
                                    <p className="text-xs text-slate-500">Envoyer vers <b>{r.operateur} {r.telephone}</b> · demandé le {jour(r.createdAt)} · depuis {({ GAINS: 'gains', RISTOURNE: 'récompenses', DEPOT: 'dépôt' })[r.source] || 'gains'}{r.reference ? ` · réf. ${r.reference}` : ''}{r.motif ? ` · ${r.motif}` : ''}</p>
                                </div>
                                <span className="font-mono font-extrabold text-lg text-[#061a3a]">{fcfa(r.montant)}</span>
                            </div>
                            {r.statut === 'EN_ATTENTE' && (
                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                                    <input placeholder="Référence du transfert" className="sm:col-span-2 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                                        value={saisie[r.id]?.reference || ''} onChange={(e) => setSaisie({ ...saisie, [r.id]: { ...saisie[r.id], reference: e.target.value } })} />
                                    <input placeholder="Motif (si refus)" className="sm:col-span-1 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                                        value={saisie[r.id]?.motif || ''} onChange={(e) => setSaisie({ ...saisie, [r.id]: { ...saisie[r.id], motif: e.target.value } })} />
                                    <button onClick={() => traiter(r, 'TRAITE')} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black">Envoyé ✓</button>
                                    <button onClick={() => traiter(r, 'REFUSE')} className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-black">Refuser</button>
                                </div>
                            )}
                        </div>
                    ))}
            </section>

            <section className="space-y-3">
                <h3 className="font-extrabold text-lg text-[#061a3a]">Partenaires : fonds de soutien (5 %)</h3>
                <p className="text-[11px] text-slate-500">À activer uniquement après avoir expliqué la retenue au partenaire et obtenu son accord.</p>
                <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {f.partenaires.map((p) => (
                        <div key={p.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                            <span className="font-semibold text-[#061a3a]">#{p.id} · {p.nom}</span>
                            <span className="font-mono text-slate-500">solde {fcfa(p.solde)}</span>
                            <button onClick={() => basculerSoutien(p)} className={`px-3 py-1.5 rounded-full font-bold border ${p.soutienActif ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                {p.soutienActif ? 'Actif' : 'Inactif'}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-3">
                <h3 className="font-extrabold text-lg text-[#061a3a]">Clôture mensuelle des ristournes clients</h3>
                <p className="text-[11px] text-slate-500">
                    Chaque client reçoit {f.tauxRistourne} % de ses achats livrés et non remboursés (hors livraison), sans jamais dépasser {f.plafondRistournePct} % de la commission de Kanari sur ces achats.
                    Les achats pas encore livrés sont reportés au mois suivant.
                </p>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap items-end gap-3">
                        <label className="text-xs font-bold text-slate-500">Mois à clôturer
                            <input type="month" value={mois} onChange={(e) => { setMois(e.target.value); setCloture(null); }} className="mt-1 block border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold" />
                        </label>
                        <button onClick={simuler} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-black text-[#061a3a]">Voir le calcul</button>
                        {cloture?.simulation && cloture.total > 0 && (
                            <button onClick={cloturer} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black">Clôturer et créditer {fcfa(cloture.total)}</button>
                        )}
                    </div>
                    {cloture && (cloture.lignes.length === 0
                        ? <p className="text-xs text-slate-500">Aucune ristourne à créditer pour {cloture.mois}.</p>
                        : (
                            <table className="w-full text-xs">
                                <thead className="text-slate-500 uppercase text-[10px] border-b border-slate-200"><tr><th className="text-left p-2">Client</th><th className="text-right p-2">Achats</th><th className="text-right p-2">Base</th><th className="text-right p-2">Ristourne</th></tr></thead>
                                <tbody>{cloture.lignes.map((l) => (
                                    <tr key={l.clientId} className="border-b border-slate-100 last:border-0">
                                        <td className="p-2">Client #{l.clientId}</td><td className="p-2 text-right">{l.achats}</td>
                                        <td className="p-2 text-right font-mono">{fcfa(l.base)}</td><td className="p-2 text-right font-mono font-bold text-emerald-600">{fcfa(l.ristourne)}</td>
                                    </tr>))}
                                </tbody>
                            </table>
                        ))}
                    {cloture && !cloture.simulation && <p className="text-xs font-bold text-emerald-600">Clôture effectuée.</p>}
                </div>
            </section>

            <section className="space-y-3">
                <h3 className="font-extrabold text-lg text-[#061a3a]">Corriger une erreur</h3>
                <form onSubmit={corriger} className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <input required type="number" placeholder="ID partenaire" value={corr.fournisseurId} onChange={(e) => setCorr({ ...corr, fournisseurId: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                    <input required type="number" placeholder="Montant (+ ou −)" value={corr.montant} onChange={(e) => setCorr({ ...corr, montant: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                    <input required minLength={5} placeholder="Motif obligatoire" value={corr.motif} onChange={(e) => setCorr({ ...corr, motif: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2 text-xs" />
                    <button className="px-3 py-2 bg-[#061a3a] text-white rounded-xl text-xs font-black">Enregistrer</button>
                </form>
                <p className="text-[11px] text-slate-500">Chaque correction apparaît dans le journal du partenaire avec votre motif. Rien n'est effacé.</p>
            </section>
        </div>
    );
}