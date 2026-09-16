import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://newvision-backend.onrender.com';
const API_LOGIN = `${API_BASE}/api/auth/login`;

function Icon({ type }) {
  if (type === 'user') return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.2"/><path strokeLinecap="round" d="M5.5 20c.7-3.2 2.8-5 6.5-5s5.8 1.8 6.5 5"/></svg>;
  if (type === 'lock') return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4.5" y="10" width="15" height="10" rx="2"/><path strokeLinecap="round" d="M8 10V7a4 4 0 018 0v3"/></svg>;
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.8 4.2A11 11 0 0112 4c5 0 8.6 3.5 10 8a11.7 11.7 0 01-3 5M6.6 6.6C4.9 7.7 3.7 9.4 2 12c1.4 4.5 5 8 10 8 1.2 0 2.4-.2 3.4-.6"/></svg>;
}

export default function Login({ setCurrentView }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const navigate = (view) => setCurrentView?.(view);

  const dashboardFor = (user = {}) => {
    const role = String(user.role || user.typeProfil || user.type || user.roleName || '').toLowerCase();
    if (role.includes('admin')) return 'dashboardAdmin';
    if (role.includes('prestataire') || role.includes('fournisseur') || role.includes('partenaire') || role.includes('merchant') || role.includes('commerc')) return 'dashboardPrestataire';
    return 'home';
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    const value = identifier.trim();
    if (!value || !password) {
      setMessage({ type: 'error', text: 'Renseignez votre téléphone ou votre email, puis votre mot de passe.' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: value.includes('@') ? value : undefined,
          telephone: value.includes('@') ? undefined : value,
          identifier: value,
          password,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) throw new Error(data.message || data.error || 'Identifiants incorrects ou connexion impossible.');
      const token = data.token || data.accessToken || data.data?.token;
      const user = data.user || data.data?.user || data.data || {};
      if (!token) throw new Error('Connexion reçue sans jeton de session. Vérifiez la réponse du serveur.');
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('token', token);
      storage.setItem('user', JSON.stringify(user));
      setMessage({ type: 'success', text: 'Connexion réussie. Ouverture de votre espace…' });
      window.setTimeout(() => navigate(dashboardFor(user)), 450);
    } catch (error) {
      console.error('Kanari login:', error);
      setMessage({ type: 'error', text: error?.message || 'Impossible de vous connecter. Vérifiez votre connexion internet.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-[#061a3a]">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(6,26,58,0.12)] lg:grid-cols-[1.05fr_.95fr]">
          <section className="relative hidden min-h-[700px] overflow-hidden bg-[#061a3a] lg:flex">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(245,158,11,.24),transparent_30%),radial-gradient(circle_at_5%_90%,rgba(255,255,255,.09),transparent_35%)]" />
            <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
              <div>
                <button type="button" onClick={() => navigate('home')} className="group flex items-center gap-3 text-left">
                  <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-amber-400 shadow-lg">
                    <img src="/logo.png" alt="Kanari Service" className="h-full w-full object-contain p-1" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    <span className="text-2xl font-black text-[#061a3a]">K</span>
                  </div>
                  <div><div className="text-xl font-black tracking-tight text-white">KANARI <span className="text-amber-400">SERVICE</span></div><div className="text-[10px] font-bold uppercase tracking-[.28em] text-slate-400">Un réseau pour tous</div></div>
                </button>
                <div className="mt-20 max-w-xl">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200"><span className="h-2 w-2 rounded-full bg-amber-400" />Votre espace Kanari</div>
                  <h1 className="text-4xl font-black leading-[1.04] tracking-tight text-white xl:text-6xl">Vos services,<span className="block text-amber-400">simplement coordonnés.</span></h1>
                  <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">Retrouvez vos demandes, missions, commandes et échanges depuis un seul espace Kanari.</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[['01','Réserver','Un service'],['02','Suivre','Une mission'],['03','Gérer','Votre espace']].map(([n,t,d]) => <div key={n} className="rounded-2xl border border-white/10 bg-white/[.06] p-4"><div className="text-[10px] font-black tracking-widest text-amber-400">{n}</div><div className="mt-2 text-sm font-black text-white">{t}</div><div className="mt-1 text-xs text-slate-400">{d}</div></div>)}
              </div>
            </div>
          </section>

          <section className="flex min-h-[680px] items-center justify-center p-6 sm:p-10 lg:p-14">
            <div className="w-full max-w-md">
              <div className="mb-10 flex items-center gap-3 lg:hidden"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#061a3a] text-xl font-black text-amber-400">K</div><div><div className="font-black">KANARI SERVICE</div><div className="text-[9px] font-bold uppercase tracking-[.24em] text-slate-400">Un réseau pour tous</div></div></div>
              <div className="mb-8"><div className="mb-3 text-xs font-black uppercase tracking-[.2em] text-amber-600">Connexion</div><h2 className="text-3xl font-black tracking-tight sm:text-4xl">Bienvenue sur Kanari</h2><p className="mt-3 text-sm leading-6 text-slate-500">Connectez-vous pour accéder à votre espace personnel ou professionnel.</p></div>
              {message.text && <div role="alert" className={`mb-5 rounded-2xl border p-4 text-sm font-semibold ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{message.text}</div>}
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label htmlFor="kanari-identifier" className="mb-2 block text-sm font-bold text-[#061a3a]">Téléphone ou adresse email</label>
                  <div className="relative"><div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Icon type="user" /></div><input id="kanari-identifier" type="text" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Ex. 90 XX XX XX ou vous@email.com" className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 !text-[#061a3a] caret-[#061a3a] outline-none placeholder:!text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10" /></div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between"><label htmlFor="kanari-password" className="block text-sm font-bold text-[#061a3a]">Mot de passe</label><button type="button" onClick={() => setMessage({ type:'error', text:'La récupération du mot de passe doit être reliée à la procédure prévue par votre backend Kanari.' })} className="text-xs font-bold text-amber-600 hover:text-amber-700">Mot de passe oublié ?</button></div>
                  <div className="relative"><div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Icon type="lock" /></div><input id="kanari-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Votre mot de passe" className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-12 !text-[#061a3a] caret-[#061a3a] outline-none placeholder:!text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10" /><button type="button" aria-label="Afficher ou masquer le mot de passe" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-[#061a3a]"><Icon type={showPassword ? 'hide' : 'eye'} /></button></div>
                </div>
                <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-500"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded accent-amber-400" />Rester connecté sur cet appareil</label>
                <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#061a3a] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#061a3a]/15 transition hover:bg-[#0b2855] active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Connexion…</> : 'Se connecter'}</button>
              </form>
              <div className="my-7 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200"/><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nouveau sur Kanari ?</span><div className="h-px flex-1 bg-slate-200"/></div>
              <button type="button" onClick={() => navigate('register')} className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-[#061a3a] transition hover:border-amber-300 hover:bg-amber-50/50">Créer un compte</button>
              <div className="mt-8 rounded-2xl border border-amber-100 bg-amber-50 p-4"><div className="text-xs font-black text-[#061a3a]">Une plateforme, plusieurs services</div><p className="mt-1 text-xs leading-5 text-slate-600">Clients, prestataires, partenaires et fournisseurs disposent d’un espace adapté à leur rôle.</p></div>
              <p className="mt-8 text-center text-[11px] text-slate-400">KANARI SERVICE — Un réseau pour tous</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}