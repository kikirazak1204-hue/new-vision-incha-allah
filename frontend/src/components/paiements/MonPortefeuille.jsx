// Portefeuille commun (client ou partenaire) : dépôt, retrait, récompenses, journal
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPortefeuille, demanderRetraitPortefeuille, fcfa } from '../../util/paiementsApi';

const jour = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const COMPTE = { GAINS: 'Gains', RISTOURNE: 'Récompenses', DEPOT: 'Dépôt', SOUTIEN: 'Fonds de soutien' };
const OPERATION = {
    VENTE: 'Vente boutique', MISSION: 'Mission', RETRAIT: 'Retrait', ANNULATION: 'Annulation', CORRECTION: 'Correction',
    DEPOT: 'Dépôt', PAIEMENT: 'Paiement avec le portefeuille', RISTOURNE_CLIENT: 'Récompense achat',
    RISTOURNE_PARTENAIRE: 'Récompense partenaire', SOUTIEN: 'Fonds de soutien', UTILISATION: 'Utilisation du fonds'
};
const STATUT_RETRAIT = {
    EN_ATTENTE: ['En attente', 'text-amber-700 bg-amber-50 border-amber-200'],
    TRAITE: ['Effectué', 'text-emerald-700 bg-emerald-50 border-emerald-200'],
    REFUSE: ['Refusé', 'text-red-700 bg-red-50 border-red-200']
};

function Carte({ label, value, accent, note }) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 block mb-1.5">{label}</span>
            <p className={`text-xl font-extrabold tracking-tight ${accent || 'text-[#061a3a]'}`}>{value}</p>
            {note && <p className="text-[11px] text-slate-500 mt-1">{note}</p>}
        </div>
    );
}

export default function MonPortefeuille() {
    const navigate = useNavigate();
    const [w, setW] = useState(null);
    const [erreur, setErreur] = useState('');
    const [depot, setDepot] = useState('');
    const [form, setForm] = useState({ montant: '', source: '', operateur: 'ORANGE', telephone: '' });
    const [envoi, setEnvoi] = useState(false);
    const [retour, setRetour] = useState(null);

    const charger = useCallback(async () => {
        try { const r = await getPortefeuille(); setW(r.data); setErreur(''); }
        catch (e) { setErreur(e.message || 'Impossible de charger le portefeuille.'); }
    }, []);
    useEffect(() => { charger(); }, [charger]);

    if (erreur) return <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex justify-between"><span>{erreur}</span><button onClick={charger} className="font-bold underline">Réessayer</button></div>;
    if (!w) return <p className="text-sm text-slate-500 animate-pulse">Chargement du portefeuille…</p>;

    const sources = [
        ...(w.estPartenaire ? [['GAINS', 'Mes gains', w.gains]] : []),
        ['RISTOURNE', 'Mes récompenses', w.ristourne],
        ['DEPOT', 'Mon dépôt', w.depot]
    ].filter(([, , m]) => m > 0);
    const source = form.source && sources.some(([id]) => id === form.source) ? form.source : sources[0]?.[0] || '';
    const dispoSource = sources.find(([id]) => id === source)?.[2] || 0;

    const deposer = (e) => {
        e.preventDefault();
        const m = Math.round(Number(depot));
        if (!m || m < w.depotMinimum) { setRetour({ ok: false, msg: `Dépôt minimum : ${w.depotMinimum} FCFA.` }); return; }
        navigate('/paiement', { state: { depot: m } });
    };

    const retirer = async (e) => {
        e.preventDefault();
        setEnvoi(true); setRetour(null);
        try {
            await demanderRetraitPortefeuille({ ...form, source, montant: Number(form.montant) });
            setRetour({ ok: true, msg: 'Demande envoyée. Kanari vérifie puis effectue le transfert.' });
            setForm((f) => ({ ...f, montant: '' }));
            await charger();
        } catch (err) { setRetour({ ok: false, msg: err.message }); }
        finally { setEnvoi(false); }
    };

    const champ = 'mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-[#061a3a] bg-white';

    return (
        <div className="space-y-8 text-left">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Carte label="Disponible au total" value={fcfa(w.disponible)} accent="text-emerald-600" note="Utilisable pour payer ou retirer" />
                {w.estPartenaire && <Carte label="Mes gains" value={fcfa(w.gains)} note="Ventes et missions payées" />}
                <Carte label="Mes récompenses" value={fcfa(w.ristourne)} accent="text-emerald-600" note={`+ ${fcfa(w.ristourneEnCours)} en cours ce mois`} />
                <Carte label="Mon dépôt" value={fcfa(w.depot)} note="Argent que vous avez rechargé" />
                {(w.soutien.actif || w.soutien.solde > 0) && (
                    <Carte label={`Fonds de soutien (${w.soutien.taux} %)`} value={fcfa(w.soutien.solde)} accent="text-indigo-600" note="Bloqué : destiné à votre développement" />
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="space-y-3">
                    <h3 className="font-extrabold text-lg text-[#061a3a]">Déposer de l'argent</h3>
                    <form onSubmit={deposer} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                        <label className="text-xs font-bold text-slate-500 block">Montant (FCFA)
                            <input type="number" min={w.depotMinimum} value={depot} onChange={(e) => setDepot(e.target.value)} className={champ} placeholder={`min. ${w.depotMinimum}`} />
                        </label>
                        <button className="w-full px-4 py-2.5 bg-[#061a3a] hover:bg-[#0b2a57] text-white rounded-xl text-xs font-black">Continuer vers le paiement</button>
                        <p className="text-[11px] text-slate-500">Vous envoyez l'argent par Orange Money, Moov, Airtel, etc. Après vérification par Kanari, il apparaît dans votre dépôt et vous pouvez payer en un clic.</p>
                    </form>
                </section>

                <section className="space-y-3">
                    <h3 className="font-extrabold text-lg text-[#061a3a]">Retirer mon argent</h3>
                    {sources.length === 0 ? (
                        <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-5">Rien à retirer pour l'instant.</p>
                    ) : (
                        <form onSubmit={retirer} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <label className="text-xs font-bold text-slate-500">Depuis
                                    <select value={source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={champ}>
                                        {sources.map(([id, nom, m]) => <option key={id} value={id}>{nom} ({fcfa(m)})</option>)}
                                    </select>
                                </label>
                                <label className="text-xs font-bold text-slate-500">Montant
                                    <input type="number" required min={w.retraitMinimum} max={dispoSource} value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} className={champ} placeholder={`min. ${w.retraitMinimum}`} />
                                </label>
                                <label className="text-xs font-bold text-slate-500">Recevoir par
                                    <select value={form.operateur} onChange={(e) => setForm({ ...form, operateur: e.target.value })} className={champ}>
                                        {w.operateurs.map((o) => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </label>
                                <label className="text-xs font-bold text-slate-500">Numéro / compte
                                    <input required value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className={champ} />
                                </label>
                            </div>
                            <button disabled={envoi} className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black">{envoi ? 'Envoi…' : 'Demander le retrait'}</button>
                            {source === 'DEPOT' && <p className="text-[11px] text-slate-500">Le retrait d'un dépôt est vérifié par l'administration avant le transfert.</p>}
                        </form>
                    )}
                </section>
            </div>

            {retour && <p className={`text-xs font-bold ${retour.ok ? 'text-emerald-600' : 'text-red-600'}`}>{retour.msg}</p>}

            {w.retraits.length > 0 && (
                <section className="space-y-3">
                    <h3 className="font-extrabold text-lg text-[#061a3a]">Mes demandes de retrait</h3>
                    <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
                        {w.retraits.map((r) => {
                            const [lib, cls] = STATUT_RETRAIT[r.statut] || [r.statut, ''];
                            return (
                                <div key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <div>
                                        <p className="font-bold text-[#061a3a]">RET-{String(r.id).padStart(5, '0')} · {r.operateur} {r.telephone}</p>
                                        <p className="text-slate-500">{jour(r.createdAt)} · depuis {COMPTE[r.source] || 'Gains'}{r.reference ? ` · réf. ${r.reference}` : ''}{r.statut === 'REFUSE' && r.motif ? ` · motif : ${r.motif}` : ''}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono font-extrabold text-[#061a3a]">{fcfa(r.montant)}</span>
                                        <span className={`font-bold border rounded-full px-3 py-1 ${cls}`}>{lib}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            <section className="space-y-3">
                <h3 className="font-extrabold text-lg text-[#061a3a]">Historique de mon portefeuille</h3>
                {w.mouvements.length === 0 ? (
                    <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6">Aucun mouvement pour l'instant.</p>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                                <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Compte</th><th className="text-left p-3">Opération</th><th className="text-right p-3">Montant</th></tr>
                            </thead>
                            <tbody>
                                {w.mouvements.map((m) => (
                                    <tr key={m.id} className="border-b border-slate-100 last:border-0">
                                        <td className="p-3 text-slate-600">{jour(m.createdAt)}</td>
                                        <td className="p-3 text-slate-600">{COMPTE[m.compte] || m.compte}</td>
                                        <td className="p-3 font-semibold text-[#061a3a]">{OPERATION[m.categorie] || m.categorie}</td>
                                        <td className={`p-3 text-right font-mono font-bold ${m.sens === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>{m.sens === 'CREDIT' ? '+' : '−'} {fcfa(m.montant)}</td>
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