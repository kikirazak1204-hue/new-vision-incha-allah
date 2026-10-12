import React, { useState, useEffect, useCallback } from 'react';
import { getAdminBranches, adminCreerService, adminModifierService, adminCreerBranche, adminModifierBranche } from '../../util/api';

const inp = 'border border-slate-200 rounded-xl p-2 text-sm outline-none focus:border-blue-500';
const btn = 'px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50';

export default function ServicesAdmin() {
  const [services, setServices] = useState([]);
  const [ouvert, setOuvert] = useState(null);
  const [nouv, setNouv] = useState({ nom: '', emoji: '', description: '', categorie: 'default' });
  const [nb, setNb] = useState({});
  const [q, setQ] = useState('');

  const charger = useCallback(async () => {
    try { const d = await getAdminBranches(); setServices(d.data || []); } catch (e) { alert(e.message); }
  }, []);
  useEffect(() => { charger(); }, [charger]);

  const run = async (fn) => { try { await fn(); await charger(); } catch (e) { alert(e.message); } };
  const visibles = services.filter((s) => s.nom.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-5 space-y-5 text-left text-[#061a3a]">
      <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
        <h4 className="font-black text-sm">Ajouter un service</h4>
        <div className="grid sm:grid-cols-5 gap-2">
          <input className={inp} placeholder="Nom *" value={nouv.nom} onChange={(e) => setNouv({ ...nouv, nom: e.target.value })} />
          <input className={inp} placeholder="Emoji" value={nouv.emoji} onChange={(e) => setNouv({ ...nouv, emoji: e.target.value })} />
          <input className={`${inp} sm:col-span-2`} placeholder="Description" value={nouv.description} onChange={(e) => setNouv({ ...nouv, description: e.target.value })} />
          <button className={`${btn} bg-blue-600 text-white`} onClick={() => run(async () => { await adminCreerService(nouv); setNouv({ nom: '', emoji: '', description: '', categorie: 'default' }); })}>Ajouter</button>
        </div>
      </div>

      <input className={`${inp} w-full`} placeholder="Rechercher un service…" value={q} onChange={(e) => setQ(e.target.value)} />

      {visibles.map((s) => (
        <div key={s.id} className="border border-slate-200 rounded-2xl p-4">
          <button className="w-full flex justify-between items-center text-left" onClick={() => setOuvert(ouvert === s.id ? null : s.id)}>
            <span className="font-bold text-sm">{s.emoji} {s.nom} <em className="text-slate-400 font-normal">({(s.branches || []).filter((b) => b.actif).length} branches · {s.categorie})</em></span>
            <span>{ouvert === s.id ? '−' : '+'}</span>
          </button>
          {ouvert === s.id && (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-slate-500">Catégorie :</span>
                <select className={inp} value={s.categorie || 'default'} onChange={(e) => run(() => adminModifierService(s.id, { categorie: e.target.value }))}>
                  <option value="default">default</option>
                  <option value="boutique">boutique</option>
                </select>
                <span className="text-[11px] text-amber-700">Testez un formulaire de réservation après tout changement de catégorie.</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(s.branches || []).map((b) => (
                  <span key={b.id} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${b.actif ? 'border-slate-300' : 'border-red-200 text-slate-400 line-through'}`}>
                    {b.nom}
                    <button className="font-black" title={b.actif ? 'Désactiver' : 'Réactiver'} onClick={() => run(() => adminModifierBranche(b.id, { actif: !b.actif }))}>{b.actif ? '×' : '↺'}</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input className={`${inp} flex-1`} placeholder="Nouvelle branche (ex. Désinfection)" value={nb[s.id] || ''} onChange={(e) => setNb({ ...nb, [s.id]: e.target.value })} />
                <button className={`${btn} bg-emerald-600 text-white`} onClick={() => run(async () => { await adminCreerBranche({ serviceId: s.id, nom: nb[s.id] }); setNb({ ...nb, [s.id]: '' }); })}>Ajouter</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}