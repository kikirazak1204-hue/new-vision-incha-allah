import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMesAbonnements, accepterAbonnement, refuserAbonnement, pauseAbonnement, reprendreAbonnement, resilierAbonnement } from '../util/api';

const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
const LIBELLES = {
  EN_ETUDE: ['En étude', 'bg-amber-50 text-amber-700 border-amber-200'],
  PROPOSE: ['Offre à accepter', 'bg-indigo-50 text-indigo-700 border-indigo-200'],
  ACTIF: ['Actif', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
  EN_PAUSE: ['En pause', 'bg-slate-100 text-slate-600 border-slate-200'],
  RESILIE: ['Résilié', 'bg-red-50 text-red-700 border-red-200'],
  REFUSE: ['Refusé', 'bg-red-50 text-red-700 border-red-200'],
};
const FREQ = { hebdomadaire: 'chaque semaine', quinzaine: 'tous les 15 jours', mensuel: 'chaque mois' };
const FACT = { mois: 'par mois', semaine: 'par semaine', visite: 'par visite' };

export default function MesAbonnements() {
  const navigate = useNavigate();
  const [abos, setAbos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const charger = useCallback(async () => {
    try { const d = await getMesAbonnements(); setAbos(d?.data || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);
  useEffect(() => { charger(); }, [charger]);

  const agir = async (fn, id, confirmation) => {
    if (confirmation && !window.confirm(confirmation)) return;
    setBusy(id);
    try { const d = await fn(id); alert(d?.message || 'Fait.'); await charger(); }
    catch (e) { alert(e.message); } finally { setBusy(null); }
  };

  const Btn = ({ onClick, children, style }) => (
    <button onClick={onClick} disabled={busy !== null} className={`px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 ${style}`}>{children}</button>
  );

  if (loading) return <p className="text-sm text-slate-500 animate-pulse text-left">Chargement de vos abonnements…</p>;

  return (
    <div className="space-y-5 text-left">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed">
        <b>Comment ça marche ?</b> Le même prestataire revient chez vous à date fixe, sans que vous ayez à réserver chaque fois.
        Chaque visite apparaît dans <b>Mes Réservations</b> : vous la validez comme d'habitude. Prix fixe, sans surprise, résiliation libre.
      </div>

      {abos.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3">
          <p className="text-slate-500 text-sm">Vous n'avez pas encore d'abonnement.</p>
          <p className="text-xs text-slate-500">Choisissez un service, puis « Abonnement » à l'étape de réservation.</p>
          <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-[#061a3a] rounded-xl text-xs font-bold">Choisir un service</button>
        </div>
      ) : abos.map((a) => {
        const [lib, cls] = LIBELLES[a.statut] || [a.statut, ''];
        const f = a.finance || {};
        return (
          <div key={a.id} className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-start gap-3">
              <div>
                <span className="text-xs font-bold text-purple-400">Abonnement #{a.id}</span>
                <h4 className="font-extrabold text-[#061a3a] text-lg">{a.serviceNom || 'Service'}</h4>
                <p className="text-xs text-slate-500">{a.adresse} · {FREQ[a.frequence] || a.frequence}{a.jourPrefere ? ` · ${a.jourPrefere}` : ''}{a.heure ? ` à ${a.heure}` : ''}</p>
              </div>
              <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold border ${cls}`}>{lib}</span>
            </div>

            {a.statut === 'EN_ETUDE' && (
              <p className="text-sm text-slate-600">Demande reçue. Notre équipe étudie votre besoin et vous envoie un prix adapté. <b>Rien n'est facturé avant votre accord.</b></p>
            )}

            {a.statut === 'PROPOSE' && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-sm space-y-1">
                <p className="font-bold text-[#061a3a]">Voici notre offre pour votre abonnement</p>
                <p>{fcfa(a.montant)} {FACT[a.modeFacturation] || ''}{a.montantTotalDu ? ` · total ${fcfa(a.montantTotalDu)}` : ''}</p>
                <p className="text-xs text-slate-600">Acompte demandé : {fcfa(f.acompteDemande)}. Vous pouvez refuser, mettre en pause ou résilier à tout moment.</p>
              </div>
            )}

            {['ACTIF', 'EN_PAUSE'].includes(a.statut) && (
              <div className="grid sm:grid-cols-4 gap-3 text-center">
                {[['Prochaine visite', a.prochaineVisite || '—'], ['Total', fcfa(f.total)], ['Déjà payé', fcfa(f.paye)], ['Reste à payer', fcfa(f.reste)]].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 rounded-2xl p-3">
                    <p className="text-[10px] uppercase font-bold text-slate-500">{l}</p>
                    <p className="text-sm font-black text-[#061a3a]">{v}</p>
                  </div>
                ))}
                {!f.acompteRegle && f.acompteDemande > 0 && (
                  <p className="sm:col-span-4 text-xs text-amber-700">Acompte de {fcfa(f.acompteDemande)} à régler à la première visite (ou selon ce que vous convenez avec Kanari).</p>
                )}
              </div>
            )}

            {(a.versements || []).length > 0 && (
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold">Vos paiements</p>
                {a.versements.map((v) => <p key={v.id}>{new Date(v.createdAt).toLocaleDateString('fr-FR')} — {fcfa(v.montant)} ({v.mode})</p>)}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {a.statut === 'PROPOSE' && <>
                <Btn style="bg-emerald-500 text-white" onClick={() => agir(accepterAbonnement, a.id, 'Accepter cette offre et activer l\'abonnement ?')}>Accepter l'offre</Btn>
                <Btn style="bg-slate-100 text-slate-700" onClick={() => agir(refuserAbonnement, a.id, 'Refuser cette offre ?')}>Refuser</Btn>
              </>}
              {a.statut === 'ACTIF' && <Btn style="bg-slate-100 text-slate-700" onClick={() => agir(pauseAbonnement, a.id)}>Mettre en pause</Btn>}
              {a.statut === 'EN_PAUSE' && <Btn style="bg-emerald-500 text-white" onClick={() => agir(reprendreAbonnement, a.id)}>Reprendre</Btn>}
              {['EN_ETUDE', 'PROPOSE', 'ACTIF', 'EN_PAUSE'].includes(a.statut) && (
                <Btn style="bg-red-50 text-red-700" onClick={() => agir(resilierAbonnement, a.id, 'Résilier cet abonnement ? Les visites déjà créées restent à traiter normalement.')}>Résilier</Btn>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}