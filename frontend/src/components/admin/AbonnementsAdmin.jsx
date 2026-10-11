import React, { useState, useEffect, useCallback } from 'react';
import {
  getAdminAbonnements, getAdminAbonnement, adminCreerAbonnement, adminModifierAbonnement,
  adminAjouterPrestataireAbonnement, adminRetirerPrestataireAbonnement, adminEnregistrerVersement,
  adminMarquerAbsence, adminCalculerReglement, adminEnregistrerReglement, adminPayerReglement,
  validerBonInterventionAdmin, getBonInterventionParReservation, getAdminFournisseurs, getServices,
} from '../../util/api';

const MODES = [['mobile_money', 'Mobile Money'], ['nita', 'Nita'], ['amanata', 'Amanata'], ['especes', 'Espèces'], ['autre', 'Autre']];
const FREQ = [['hebdomadaire', 'Chaque semaine'], ['quinzaine', 'Tous les 15 jours'], ['mensuel', 'Chaque mois']];
const FACT = [['mois', 'Par mois'], ['semaine', 'Par semaine'], ['visite', 'Par visite']];
const STATUTS = ['EN_ETUDE', 'PROPOSE', 'ACTIF', 'EN_PAUSE', 'RESILIE', 'REFUSE'];
const COULEURS = {
  EN_ETUDE: 'bg-amber-50 text-amber-700 border-amber-200', PROPOSE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ACTIF: 'bg-emerald-50 text-emerald-700 border-emerald-200', EN_PAUSE: 'bg-slate-100 text-slate-600 border-slate-200',
  RESILIE: 'bg-red-50 text-red-700 border-red-200', REFUSE: 'bg-red-50 text-red-700 border-red-200',
};
const liste = (r) => (Array.isArray(r) ? r : r?.data || []);
const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
const inp = 'w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:border-blue-500';
const btn = 'px-3 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50';

const Badge = ({ s }) => (
  <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${COULEURS[s] || ''}`}>{s}</span>
);
const Champ = ({ label, children }) => (
  <label className="block"><span className="text-[11px] font-bold text-slate-600 block mb-1">{label}</span>{children}</label>
);

// ───────────────────────── Création ─────────────────────────
function CreerModal({ services, fournisseurs, onClose, onCree }) {
  const [f, setF] = useState({
    telephone: '', clientNom: '', adresse: '', serviceId: '', frequence: 'hebdomadaire', jourPrefere: '', heure: '',
    dateDebut: '', modeFacturation: 'mois', montant: '', montantTotalDu: '', acompteDemande: '', remarques: '', statut: 'ACTIF',
  });
  const [ids, setIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const envoyer = async () => {
    const svc = services.find((s) => String(s.id) === String(f.serviceId));
    setLoading(true);
    try {
      const d = await adminCreerAbonnement({
        ...f, serviceId: Number(f.serviceId), serviceNom: svc?.nom || null, fournisseurIds: ids,
        montant: f.montant === '' ? null : Number(f.montant),
        montantTotalDu: f.montantTotalDu === '' ? null : Number(f.montantTotalDu),
        acompteDemande: f.acompteDemande === '' ? null : Number(f.acompteDemande),
      });
      alert(d.message || 'Abonnement créé.');
      onCree();
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-4 text-left">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-lg text-[#061a3a]">Nouvel abonnement</h3>
          <button onClick={onClose} className="text-slate-500 text-xl">×</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Champ label="Téléphone du client *"><input className={inp} value={f.telephone} onChange={set('telephone')} /></Champ>
          <Champ label="Nom du client"><input className={inp} value={f.clientNom} onChange={set('clientNom')} /></Champ>
          <Champ label="Adresse / quartier *"><input className={inp} value={f.adresse} onChange={set('adresse')} /></Champ>
          <Champ label="Service *">
            <select className={inp} value={f.serviceId} onChange={set('serviceId')}>
              <option value="">— choisir —</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          </Champ>
          <Champ label="Fréquence"><select className={inp} value={f.frequence} onChange={set('frequence')}>{FREQ.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Champ>
          <Champ label="Jour souhaité"><input className={inp} placeholder="ex. lundi" value={f.jourPrefere} onChange={set('jourPrefere')} /></Champ>
          <Champ label="Heure"><input className={inp} placeholder="ex. 09:00" value={f.heure} onChange={set('heure')} /></Champ>
          <Champ label="Date de la 1re visite *"><input type="date" className={inp} value={f.dateDebut} onChange={set('dateDebut')} /></Champ>
          <Champ label="Facturation"><select className={inp} value={f.modeFacturation} onChange={set('modeFacturation')}>{FACT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Champ>
          <Champ label="Prix (selon facturation)"><input type="number" className={inp} value={f.montant} onChange={set('montant')} /></Champ>
          <Champ label="Total dû par le client"><input type="number" className={inp} value={f.montantTotalDu} onChange={set('montantTotalDu')} /></Champ>
          <Champ label="Acompte demandé (vide = 50 %)"><input type="number" className={inp} value={f.acompteDemande} onChange={set('acompteDemande')} /></Champ>
        </div>
        <Champ label="Remarques"><textarea rows={2} className={inp} value={f.remarques} onChange={set('remarques')} /></Champ>
        <div>
          <span className="text-[11px] font-bold text-slate-600 block mb-1">Prestataires prévus</span>
          <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-2 grid sm:grid-cols-2 gap-1">
            {fournisseurs.map((p) => (
              <label key={p.id} className="text-xs flex items-center gap-2">
                <input type="checkbox" checked={ids.includes(p.id)} onChange={() => setIds((a) => (a.includes(p.id) ? a.filter((x) => x !== p.id) : [...a, p.id]))} />
                {p.nomEntreprise}
              </label>
            ))}
          </div>
        </div>
        <Champ label="Statut au départ">
          <select className={inp} value={f.statut} onChange={set('statut')}>
            <option value="ACTIF">ACTIF (client déjà convaincu par téléphone)</option>
            <option value="PROPOSE">PROPOSÉ (le client doit accepter)</option>
          </select>
        </Champ>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className={`${btn} flex-1 bg-slate-100 text-slate-700`}>Annuler</button>
          <button onClick={envoyer} disabled={loading} className={`${btn} flex-1 bg-blue-600 text-white`}>{loading ? 'Création…' : 'Créer'}</button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Détail ─────────────────────────
function DetailModal({ id, fournisseurs, onClose, onChange }) {
  const [abo, setAbo] = useState(null);
  const [prix, setPrix] = useState({});
  const [vers, setVers] = useState({ montant: '', mode: 'especes', type: 'ACOMPTE', reference: '' });
  const [nouveauP, setNouveauP] = useState('');
  const [remp, setRemp] = useState({});
  const [per, setPer] = useState({ debut: '', fin: '' });
  const [calc, setCalc] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [modePay, setModePay] = useState({});

  const charger = useCallback(async () => {
    try {
      const d = await getAdminAbonnement(id);
      setAbo(d.data);
      setPrix({ modeFacturation: d.data.modeFacturation || 'mois', montant: d.data.montant ?? '', montantTotalDu: d.data.montantTotalDu ?? '', acompteDemande: d.data.acompteDemande ?? '' });
    } catch (e) { alert(e.message); }
  }, [id]);
  useEffect(() => { charger(); }, [charger]);

  const run = async (fn, ok) => {
    try { await fn(); if (ok) alert(ok); await charger(); onChange(); } catch (e) { alert(e.message); }
  };

  if (!abo) return <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center text-white">Chargement…</div>;
  const fin = abo.finance || {};

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl p-6 space-y-6 text-left my-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-black text-lg text-[#061a3a]">Abonnement #{abo.id} — {abo.serviceNom || 'Service'}</h3>
            <p className="text-xs text-slate-500">{abo.clientNom || 'Client'} · {abo.telephone} · {abo.adresse}</p>
            <p className="text-xs text-slate-500">{abo.frequence} · {abo.jourPrefere || '—'} {abo.heure || ''} · prochaine visite : {abo.prochaineVisite || '—'}</p>
            {!abo.clientId && <p className="text-xs text-red-600 font-bold mt-1">Aucun compte client lié : le client ne le voit pas dans son espace.</p>}
          </div>
          <div className="flex items-center gap-3"><Badge s={abo.statut} /><button onClick={onClose} className="text-xl text-slate-500">×</button></div>
        </div>

        {/* Statut */}
        <div className="flex flex-wrap gap-2">
          {STATUTS.map((s) => (
            <button key={s} disabled={s === abo.statut} onClick={() => run(() => adminModifierAbonnement(abo.id, { statut: s }))}
              className={`${btn} border ${s === abo.statut ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>{s}</button>
          ))}
        </div>

        {/* Prix */}
        <section className="border border-slate-200 rounded-2xl p-4 space-y-3">
          <h4 className="font-black text-sm">Prix et acompte</h4>
          <div className="grid sm:grid-cols-4 gap-3">
            <Champ label="Facturation"><select className={inp} value={prix.modeFacturation} onChange={(e) => setPrix((p) => ({ ...p, modeFacturation: e.target.value }))}>{FACT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Champ>
            <Champ label="Prix"><input type="number" className={inp} value={prix.montant} onChange={(e) => setPrix((p) => ({ ...p, montant: e.target.value }))} /></Champ>
            <Champ label="Total dû"><input type="number" className={inp} value={prix.montantTotalDu} onChange={(e) => setPrix((p) => ({ ...p, montantTotalDu: e.target.value }))} /></Champ>
            <Champ label="Acompte"><input type="number" className={inp} value={prix.acompteDemande} onChange={(e) => setPrix((p) => ({ ...p, acompteDemande: e.target.value }))} /></Champ>
          </div>
          <button className={`${btn} bg-blue-600 text-white`} onClick={() => run(() => adminModifierAbonnement(abo.id, {
            modeFacturation: prix.modeFacturation,
            montant: prix.montant === '' ? null : Number(prix.montant),
            montantTotalDu: prix.montantTotalDu === '' ? null : Number(prix.montantTotalDu),
            acompteDemande: prix.acompteDemande === '' ? null : Number(prix.acompteDemande),
          }), 'Prix enregistré.')}>Enregistrer le prix</button>
          <p className="text-xs text-slate-500">Commission Kanari fixe : 5 %. Le reste est réparti entre les prestataires prévus.</p>
        </section>

        {/* Paiements client */}
        <section className="border border-slate-200 rounded-2xl p-4 space-y-3">
          <h4 className="font-black text-sm">Paiements du client</h4>
          <p className="text-sm">Total : <b>{fcfa(fin.total)}</b> · Payé : <b className="text-emerald-600">{fcfa(fin.paye)}</b> · Reste : <b className="text-red-600">{fcfa(fin.reste)}</b> · Acompte {fcfa(fin.acompteDemande)} {fin.acompteRegle ? '✓ réglé' : '(non réglé)'}</p>
          {(abo.versements || []).map((v) => (
            <p key={v.id} className="text-xs text-slate-600">{new Date(v.createdAt).toLocaleDateString('fr-FR')} — {fcfa(v.montant)} — {v.mode} — {v.type}{v.reference ? ` — réf. ${v.reference}` : ''}</p>
          ))}
          <div className="grid sm:grid-cols-5 gap-2 items-end">
            <Champ label="Montant"><input type="number" className={inp} value={vers.montant} onChange={(e) => setVers((p) => ({ ...p, montant: e.target.value }))} /></Champ>
            <Champ label="Mode"><select className={inp} value={vers.mode} onChange={(e) => setVers((p) => ({ ...p, mode: e.target.value }))}>{MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Champ>
            <Champ label="Type"><select className={inp} value={vers.type} onChange={(e) => setVers((p) => ({ ...p, type: e.target.value }))}><option value="ACOMPTE">Acompte</option><option value="SOLDE">Solde</option><option value="AUTRE">Autre</option></select></Champ>
            <Champ label="Référence"><input className={inp} value={vers.reference} onChange={(e) => setVers((p) => ({ ...p, reference: e.target.value }))} /></Champ>
            <button className={`${btn} bg-emerald-600 text-white`} onClick={() => run(() => adminEnregistrerVersement(abo.id, { ...vers, montant: Number(vers.montant) }).then(() => setVers((p) => ({ ...p, montant: '', reference: '' }))), 'Paiement enregistré (le client est notifié).')}>Enregistrer</button>
          </div>
        </section>

        {/* Prestataires */}
        <section className="border border-slate-200 rounded-2xl p-4 space-y-3">
          <h4 className="font-black text-sm">Prestataires prévus</h4>
          {(abo.prestataires || []).map((p) => (
            <div key={p.id} className="flex justify-between items-center text-sm">
              <span>{p.fournisseur?.nomEntreprise || `#${p.fournisseurId}`} {p.actif ? '' : <em className="text-slate-400">(retiré le {p.dateFin})</em>}</span>
              {p.actif && <button className={`${btn} bg-red-50 text-red-700`} onClick={() => run(() => adminRetirerPrestataireAbonnement(abo.id, p.fournisseurId))}>Retirer</button>}
            </div>
          ))}
          <div className="flex gap-2">
            <select className={inp} value={nouveauP} onChange={(e) => setNouveauP(e.target.value)}>
              <option value="">— ajouter un prestataire —</option>
              {fournisseurs.map((p) => <option key={p.id} value={p.id}>{p.nomEntreprise}</option>)}
            </select>
            <button disabled={!nouveauP} className={`${btn} bg-blue-600 text-white`} onClick={() => run(() => adminAjouterPrestataireAbonnement(abo.id, Number(nouveauP)).then(() => setNouveauP('')))}>Ajouter</button>
          </div>
        </section>

        {/* Visites */}
        <section className="border border-slate-200 rounded-2xl p-4 space-y-3">
          <h4 className="font-black text-sm">Visites ({(abo.visites || []).length})</h4>
          {(abo.visites || []).length === 0 && <p className="text-xs text-slate-500">Aucune visite pour le moment (créées 3 jours avant la date).</p>}
          {(abo.visites || []).map((v) => (
            <div key={v.id} className="border border-slate-100 rounded-xl p-3 text-xs space-y-2">
              <div className="flex flex-wrap justify-between gap-2">
                <span><b>#{v.id}</b> · {v.dateIntervention} {v.heureIntervention || ''} · <b>{v.statut}</b> · {v.prestataire?.nomEntreprise || 'non assignée'}
                  {v.absent && <span className="text-red-600 font-bold"> · ABSENT{v.motifAbsence ? ` (${v.motifAbsence})` : ''}</span>}
                  {v.fournisseurPrevuId && v.fournisseurPrevuId !== v.fournisseurId && <span className="text-slate-500"> · prévu : #{v.fournisseurPrevuId}</span>}
                  {v.demarreLe && <span className="text-slate-500"> · démarrée {new Date(v.demarreLe).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {!['VALIDEE', 'ANNULEE'].includes(v.statut) && (
                  <>
                    <select className="border border-slate-200 rounded-lg p-1.5" value={remp[v.id] || ''} onChange={(e) => setRemp((p) => ({ ...p, [v.id]: e.target.value }))}>
                      <option value="">Remplaçant (facultatif)</option>
                      {fournisseurs.map((p) => <option key={p.id} value={p.id}>{p.nomEntreprise}</option>)}
                    </select>
                    <button className={`${btn} bg-amber-50 text-amber-800`} onClick={() => {
                      const motif = window.prompt("Motif de l'absence ?") || '';
                      run(() => adminMarquerAbsence(v.id, { absent: true, remplacantId: remp[v.id] || undefined, motif }), 'Absence enregistrée.');
                    }}>Marquer absent</button>
                  </>
                )}
                {v.absent && <button className={`${btn} bg-slate-100`} onClick={() => run(() => adminMarquerAbsence(v.id, { absent: false }))}>Annuler l'absence</button>}
                {v.statut === 'TERMINEE' && (
                  <button className={`${btn} bg-emerald-600 text-white`} onClick={() => run(async () => {
                    const b = await getBonInterventionParReservation(v.id);
                    if (!window.confirm('Valider cette visite à la place du client ?')) return;
                    await validerBonInterventionAdmin(b.data.id, {});
                  }, 'Visite validée.')}>Valider pour le client</button>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Règlement mensuel */}
        <section className="border border-slate-200 rounded-2xl p-4 space-y-3">
          <h4 className="font-black text-sm">Règlement des prestataires</h4>
          <div className="flex flex-wrap gap-2 items-end">
            <Champ label="Du"><input type="date" className={inp} value={per.debut} onChange={(e) => setPer((p) => ({ ...p, debut: e.target.value }))} /></Champ>
            <Champ label="Au"><input type="date" className={inp} value={per.fin} onChange={(e) => setPer((p) => ({ ...p, fin: e.target.value }))} /></Champ>
            <button disabled={!per.debut || !per.fin} className={`${btn} bg-blue-600 text-white`} onClick={() => run(async () => {
              const d = await adminCalculerReglement(abo.id, per.debut, per.fin);
              setCalc(d.data);
              setLignes(d.data.lignes.map((l) => ({ fournisseurId: l.fournisseurId, deduction: l.deductionProposee, modePaiement: 'especes', paye: false, note: '' })));
            })}>Calculer</button>
          </div>
          {calc && (
            <div className="space-y-2 text-xs">
              <p>Brut {fcfa(calc.brut)} · Commission Kanari 5 % : {fcfa(calc.commission)} · À répartir : {fcfa(calc.reparti)} entre {calc.nbPrestataires} prestataire(s)</p>
              {calc.lignes.map((l, i) => (
                <div key={l.fournisseurId} className="border border-slate-100 rounded-xl p-3 grid sm:grid-cols-6 gap-2 items-end">
                  <div className="sm:col-span-2"><b>{l.nomEntreprise || `#${l.fournisseurId}`}</b><br />Part prévue {fcfa(l.partPrevue)} · visites {l.visitesFaites}/{l.visitesPrevues} · absences {l.absences} · remplacements {l.remplacements}</div>
                  <Champ label="Déduction"><input type="number" className={inp} value={lignes[i]?.deduction ?? 0} onChange={(e) => setLignes((a) => a.map((x, j) => (j === i ? { ...x, deduction: e.target.value } : x)))} /></Champ>
                  <Champ label="Mode"><select className={inp} value={lignes[i]?.modePaiement} onChange={(e) => setLignes((a) => a.map((x, j) => (j === i ? { ...x, modePaiement: e.target.value } : x)))}>{MODES.map(([v, lb]) => <option key={v} value={v}>{lb}</option>)}</select></Champ>
                  <label className="flex items-center gap-1"><input type="checkbox" checked={!!lignes[i]?.paye} onChange={(e) => setLignes((a) => a.map((x, j) => (j === i ? { ...x, paye: e.target.checked } : x)))} />Payé</label>
                  <b>Net : {fcfa(Math.max(Number(l.partPrevue) - Number(lignes[i]?.deduction || 0), 0))}</b>
                </div>
              ))}
              <button className={`${btn} bg-emerald-600 text-white`} onClick={() => run(() => adminEnregistrerReglement(abo.id, { debut: per.debut, fin: per.fin, lignes: lignes.map((x) => ({ ...x, deduction: Number(x.deduction || 0) })) }).then(() => setCalc(null)), 'Règlement enregistré.')}>Enregistrer ce règlement</button>
            </div>
          )}
          {(abo.reglements || []).map((r) => (
            <div key={r.id} className="flex flex-wrap justify-between items-center text-xs border-t border-slate-100 pt-2 gap-2">
              <span>{r.periodeDebut} → {r.periodeFin} · {r.fournisseur?.nomEntreprise || `#${r.fournisseurId}`} · net {fcfa(r.netAPayer)} · <b>{r.statut}</b>{r.modePaiement ? ` (${r.modePaiement})` : ''}</span>
              {r.statut !== 'PAYE' && (
                <span className="flex gap-1">
                  <select className="border border-slate-200 rounded-lg p-1" value={modePay[r.id] || 'especes'} onChange={(e) => setModePay((p) => ({ ...p, [r.id]: e.target.value }))}>{MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                  <button className={`${btn} bg-emerald-600 text-white`} onClick={() => run(() => adminPayerReglement(r.id, modePay[r.id] || 'especes'), 'Marqué payé.')}>Marquer payé</button>
                </span>
              )}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

// ───────────────────────── Liste ─────────────────────────
export default function AbonnementsAdmin() {
  const [abos, setAbos] = useState([]);
  const [filtre, setFiltre] = useState('');
  const [loading, setLoading] = useState(true);
  const [creer, setCreer] = useState(false);
  const [detail, setDetail] = useState(null);
  const [services, setServices] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);

  const charger = useCallback(async () => {
    try { setAbos(liste(await getAdminAbonnements(filtre))); } catch (e) { alert(e.message); } finally { setLoading(false); }
  }, [filtre]);

  useEffect(() => { charger(); }, [charger]);
  useEffect(() => {
    getServices().then((r) => setServices(liste(r))).catch(() => {});
    getAdminFournisseurs().then((r) => setFournisseurs(liste(r).filter((p) => p.statut === 'CONFORME'))).catch(() => {});
  }, []);

  return (
    <div className="p-5 space-y-4 text-left">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <select className="border border-slate-200 rounded-xl p-2 text-sm" value={filtre} onChange={(e) => setFiltre(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className={`${btn} bg-blue-600 text-white`} onClick={() => setCreer(true)}>+ Nouvel abonnement</button>
      </div>

      {loading ? <p className="text-sm text-slate-500">Chargement…</p> : abos.length === 0 ? (
        <p className="text-sm text-slate-500 p-8 text-center">Aucun abonnement.</p>
      ) : (
        <div className="space-y-3">
          {abos.map((a) => (
            <button key={a.id} onClick={() => setDetail(a.id)} className="w-full text-left border border-slate-200 rounded-2xl p-4 hover:bg-slate-50 flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-bold text-sm text-[#061a3a]">#{a.id} · {a.serviceNom || 'Service'} · {a.clientNom || a.telephone}</p>
                <p className="text-xs text-slate-500">{a.adresse} · {a.frequence} · prochaine : {a.prochaineVisite || '—'} · {(a.prestataires || []).filter((p) => p.actif).length} prestataire(s)</p>
              </div>
              <div className="text-right text-xs">
                <Badge s={a.statut} />
                <p className="mt-1">Total {fcfa(a.finance?.total)} · reste <b className="text-red-600">{fcfa(a.finance?.reste)}</b></p>
              </div>
            </button>
          ))}
        </div>
      )}

      {creer && <CreerModal services={services} fournisseurs={fournisseurs} onClose={() => setCreer(false)} onCree={() => { setCreer(false); charger(); }} />}
      {detail && <DetailModal id={detail} fournisseurs={fournisseurs} onClose={() => setDetail(null)} onChange={charger} />}
    </div>
  );
}