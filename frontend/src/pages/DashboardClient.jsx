import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getDashboardClient } from '../util/api';

// URL de l'API (à adapter selon ton fichier .env)
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STATUT = {
    EN_ATTENTE: { label: 'En attente', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400' },
    ACCEPTEE: { label: 'Acceptée', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-400' },
    EN_PREPARATION: { label: 'Préparation', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-400' },
    EN_COURS: { label: 'En cours', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', dot: 'bg-indigo-400' },
    TERMINEE: { label: 'Terminée', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
    VALIDEE: { label: 'Validée✅', bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
    ANNULEE: { label: 'Annulée', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-400' },
};

function StatutBadge({ statut }) {
    const s = STATUT[statut] || STATUT.EN_ATTENTE;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
}

function ChatModal({ mission, userId, onClose }) {
    const [messages, setMessages] = useState([]);
    const [texte, setTexte] = useState('');
    const [init, setInit] = useState(true);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    const token = localStorage.getItem('token');

    const charger = async () => {
        try {
            const r = await fetch(`${API}/api/messages/${mission.id}`, { headers: { Authorization: `Bearer ${token}` } });
            const d = await r.json();
            if (d.success) setMessages(d.data || []);
        } catch { } finally { setInit(false); }
    };

    useEffect(() => { charger(); const t = setInterval(charger, 5000); return () => clearInterval(t); }, [mission.id]);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const envoyer = async () => {
        if (!texte.trim() || sending) return;
        setSending(true);
        try {
            const r = await fetch(`${API}/api/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reservationId: mission.id, contenu: texte.trim() })
            });
            const d = await r.json();
            if (d.success) { setMessages(p => [...p, d.data]); setTexte(''); }
        } catch { } finally { setSending(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden h-[500px]">
                <div className="flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-purple-500/10">
                            {mission.prestataire?.nomEntreprise?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <div>
                            <p className="font-bold text-white text-sm">{mission.prestataire?.nomEntreprise || 'Prestataire'}</p>
                            <p className="text-purple-400 font-medium text-xs mt-0.5">Mission #{mission.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition text-sm bg-slate-800 w-7 h-7 flex items-center justify-center rounded-full">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-950/40">
                    {init ? <p className="text-center text-slate-500 text-sm mt-8 animate-pulse">Chargement...</p> : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600">
                            <p className="text-3xl mb-2">💬</p>
                            <p className="text-xs font-medium">Commencez la conversation</p>
                        </div>
                    ) : messages.map(msg => {
                        const moi = msg.senderId === userId;
                        return (
                            <div key={msg.id} className={`flex ${moi ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm border shadow-sm ${moi ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white border-purple-500/20 rounded-br-none' : 'bg-slate-900 text-slate-200 border-slate-800 rounded-bl-none'}`}>
                                    <p className="leading-relaxed">{msg.contenu}</p>
                                    <p className={`text-[9px] font-medium mt-1 text-right ${moi ? 'text-purple-200/70' : 'text-slate-500'}`}>{new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>
                <div className="px-4 py-3 border-t border-slate-800 flex gap-2 bg-slate-900">
                    <input value={texte} onChange={e => setTexte(e.target.value)} onKeyDown={e => e.key === 'Enter' && envoyer()} placeholder="Écrire un message..." className="flex-1 bg-slate-950 border border-slate-800 focus:border-purple-500 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition" />
                    <button onClick={envoyer} disabled={!texte.trim() || sending} className={`w-11 h-11 rounded-xl text-sm font-bold flex items-center justify-center transition ${texte.trim() ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/10' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
                        {sending ? '…' : '➤'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DevisReservation({ reservationId, token, onAccepte }) {
    const [devis, setDevis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoad, setActionLoad] = useState(null);

    useEffect(() => {
        fetch(`${API}/api/devis/reservation/${reservationId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { if (d.success) setDevis(d.data || []); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [reservationId]);

    const accepter = async (devisId) => {
        if (!window.confirm('Accepter ce devis ? Les autres seront refusés.')) return;
        setActionLoad(devisId);
        try {
            const r = await fetch(`${API}/api/devis/${devisId}/accepter`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }).then(r => r.json());
            if (r.success) { alert('✅ Devis accepté ! Le prestataire va vous contacter.'); onAccepte?.(); }
            else alert('❌ ' + r.message);
        } catch { alert('❌ Erreur serveur'); }
        finally { setActionLoad(null); }
    };

    const refuser = async (devisId) => {
        setActionLoad(`refuse_${devisId}`);
        try {
            const r = await fetch(`${API}/api/devis/${devisId}/refuser`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }).then(r => r.json());
            if (r.success) setDevis(p => p.map(d => d.id === devisId ? { ...d, statut: 'REFUSE' } : d));
            else alert('❌ ' + r.message);
        } catch { alert('❌ Erreur'); }
        finally { setActionLoad(null); }
    };

    if (loading) return <p className="text-xs text-slate-500 animate-pulse">Chargement des devis...</p>;
    const devisEnAttente = devis.filter(d => d.statut === 'EN_ATTENTE');
    const devisAccepte = devis.find(d => d.statut === 'ACCEPTE');

    if (devis.length === 0) return (<div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-xs font-medium text-amber-400">⏳ En attente des devis des prestataires...</div>);

    return (
        <div className="space-y-3 mt-4 border-t border-slate-800/60 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">📨 {devis.length} devis reçu{devis.length > 1 ? 's' : ''}</p>
            {devisAccepte && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 shadow-sm">
                    <p className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">✅ Devis accepté</p>
                    <p className="text-white font-bold text-base mt-2">{devisAccepte.fournisseurDevis?.nomEntreprise || 'Prestataire'}</p>
                    <p className="text-emerald-400 font-black text-xl mt-1">{Number(devisAccepte.montant).toLocaleString()} FCFA</p>
                    {devisAccepte.fournisseurDevis?.telephone && (
                        <p className="text-slate-400 text-xs mt-2 bg-slate-900/60 inline-flex px-2.5 py-1 rounded-lg border border-slate-800">📞 {devisAccepte.fournisseurDevis.telephone}</p>
                    )}
                </div>
            )}
            {!devisAccepte && devisEnAttente.map(d => (
                <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <p className="font-bold text-white text-base">{d.fournisseurDevis?.nomEntreprise || 'Prestataire'}</p>
                            {d.fournisseurDevis?.adresse && <p className="text-xs text-slate-400 mt-1">📍 {d.fournisseurDevis.adresse}</p>}
                            {d.fournisseurDevis?.note > 0 && <p className="text-xs font-bold text-yellow-500 mt-1">⭐ {d.fournisseurDevis.note.toFixed(1)}/5</p>}
                        </div>
                        <p className="text-lg font-black text-purple-400 whitespace-nowrap">{Number(d.montant).toLocaleString()} FCFA</p>
                    </div>
                    {d.description && <p className="text-xs text-slate-300 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 leading-relaxed">{d.description}</p>}
                    <div className="flex gap-2">
                        <button onClick={() => accepter(d.id)} disabled={actionLoad === d.id} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:opacity-95 text-white disabled:opacity-40 rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/5">
                            {actionLoad === d.id ? '⏳...' : 'Accepter ce devis'}
                        </button>
                        <button onClick={() => refuser(d.id)} disabled={actionLoad === `refuse_${d.id}`} className="px-4 py-2.5 bg-slate-950 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 disabled:opacity-40 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 transition">
                            {actionLoad === `refuse_${d.id}` ? '⏳' : 'Refuser'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function DashboardClient() {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({});
    const [factures, setFactures] = useState([]);
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [validationLoad, setValidationLoad] = useState(null);
    const [menuOuvert, setMenuOuvert] = useState(false);
    const [chatMission, setChatMission] = useState(null);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    
    let user = {};
    try { user = JSON.parse(localStorage.getItem('user')) || {}; } catch { }

    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const res = await getDashboardClient();
                if (!res.success) throw new Error(res.message);
                setStats(res.data.stats || {});
                setFactures(res.data.facturesRecentes || []);
                setMissions(res.data.missions || []);
            } catch (err) { console.error('Erreur dashboard client:', err); }
            finally { setLoading(false); }
        })();
    }, [token]);

    const validerPrestation = async (id) => {
        if (!window.confirm('Confirmer que la prestation a été effectuée ?')) return;
        setValidationLoad(id);
        try {
            const r = await fetch(`${API}/api/missions/${id}/valider`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }).then(r => r.json());
            if (r.success) setMissions(prev => prev.map(m => m.id === id ? { ...m, statut: 'VALIDEE' } : m));
            else alert('❌ ' + (r.message || 'Erreur'));
        } catch { alert('❌ Erreur serveur'); }
        finally { setValidationLoad(null); }
    };

    if (!token) return <Navigate to="/login" replace />;
    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
            <div className="text-center space-y-3">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-purple-400 font-medium text-xs tracking-wider">Chargement de votre espace...</p>
            </div>
        </div>
    );

    const missionsActives = missions.filter(m => ['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS', 'EN_PREPARATION'].includes(m.statut));
    const tabs = [{ id: 'overview', label: '📊 Résumé' }, { id: 'missions', label: '📋 Missions', badge: missionsActives.length }, { id: 'factures', label: '🧾 Factures' }, { id: 'profil', label: '👤 Profil' }];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex">
            {/* SIDEBAR (DESKTOP) */}
            <aside className="hidden md:flex w-72 bg-slate-900 border-r border-slate-850 p-6 flex-col gap-2">
                <div className="mb-8 px-2 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-lg flex items-center justify-center font-black text-white text-base">iA</div>
                    <div>
                        <h2 className="text-base font-black tracking-tight text-white">Kanari Service</h2>
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-0.5">Espace Client</p>
                    </div>
                </div>
                <nav className="flex flex-col gap-1.5 flex-1">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between border ${activeTab === t.id ? 'bg-purple-600 border-purple-500/20 text-white shadow-md shadow-purple-600/10' : 'hover:bg-slate-800/60 text-slate-400 hover:text-white border-transparent'}`}>
                            <span>{t.label}</span>
                            {t.badge > 0 && <span className="bg-rose-500 text-white text-[10px] font-black min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full">{t.badge}</span>}
                        </button>
                    ))}
                    <button onClick={() => navigate('/accueil')} className="text-left px-4 py-3 rounded-xl text-sm font-bold text-purple-400 hover:text-white hover:bg-slate-800/60 transition-all border border-transparent mt-2">🏠 Retour accueil</button>
                </nav>
                <div className="border-t border-slate-850 pt-4 space-y-3">
                    <div className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Client</p>
                        <p className="text-sm font-bold text-white truncate mt-0.5">{user.nom || 'Mon Profil'}</p>
                    </div>
                    <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-rose-500/10 border border-slate-850 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 font-bold text-xs transition-all uppercase tracking-wider">🚪 Déconnexion</button>
                </div>
            </aside>

            {/* TOPBAR (MOBILE) */}
            <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-850 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-lg flex items-center justify-center font-black text-white text-sm">iA</div>
                    <span className="font-black text-base text-white tracking-tight">Kanari Service</span>
                </div>
                <button onClick={() => setMenuOuvert(!menuOuvert)} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 text-sm flex items-center justify-center font-bold">{menuOuvert ? '✕' : '☰'}</button>
            </div>

            {/* MAIN CONTENT */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto mt-[53px] md:mt-0 max-w-5xl mx-auto w-full">
                {activeTab === 'overview' && (
                    <section className="space-y-6">
                        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-md">Tableau de bord</span>
                                    <h2 className="text-3xl font-black text-white tracking-tight mt-3">Bonjour, {user.nom?.split(' ')[0] || 'vous'} 👋</h2>
                                    <p className="text-slate-400 mt-2 text-sm">Ravi de vous revoir. Voici l'état d'avancement de vos demandes.</p>
                                </div>
                                <div className="bg-slate-950 border border-slate-850 rounded-2xl px-5 py-4 min-w-[140px]">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Missions actives</p>
                                    <p className="text-3xl font-black text-white mt-1">{missionsActives.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[{ icon: '📋', label: 'Missions', value: missions.length }, { icon: '⚡', label: 'En cours', value: missionsActives.length }, { icon: '🧾', label: 'Factures', value: factures.length }, { icon: '✅', label: 'Validées', value: missions.filter(m => m.statut === 'VALIDEE').length }].map((c, i) => (
                                <div key={i} className="bg-slate-900 p-5 rounded-2xl border border-slate-850 shadow-sm flex flex-col justify-between h-28">
                                    <p className="text-xl">{c.icon}</p>
                                    <div>
                                        <p className="text-slate-400 text-xs font-medium">{c.label}</p>
                                        <p className="text-2xl font-black text-white mt-0.5">{c.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {activeTab === 'missions' && (
                    <section className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-white">📋 Mes Missions</h2>
                            <p className="text-slate-400 text-xs font-medium mt-1">{missions.length} mission(s) au total</p>
                        </div>
                        {missions.length === 0 ? (
                            <div className="text-center py-16 text-slate-400 bg-slate-900 border border-slate-850 rounded-2xl">
                                <p className="text-4xl mb-3">📋</p>
                                <p className="text-sm font-medium">Aucune mission pour le moment.</p>
                                <button onClick={() => navigate('/accueil')} className="mt-4 px-4 py-2 bg-purple-600 hover:opacity-95 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-600/10">Trouver un prestataire</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {missions.map(mission => (
                                    <div key={mission.id} className="rounded-2xl border border-slate-850 overflow-hidden bg-slate-900 shadow-sm relative">
                                        <div className="p-5 space-y-4">
                                            <div className="flex justify-between items-start flex-wrap gap-3">
                                                <div>
                                                    <h3 className="text-base font-bold text-white">{mission.service?.nom || 'Prestation'} — #{mission.id}</h3>
                                                    <StatutBadge statut={mission.statut} />
                                                </div>
                                                {['EN_ATTENTE', 'ACCEPTEE', 'EN_PREPARATION', 'EN_COURS', 'TERMINEE'].includes(mission.statut) && (
                                                    <button onClick={() => setChatMission(mission)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 hover:border-purple-500/30 text-slate-300 hover:text-purple-400 text-xs font-bold transition">💬 Message</button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                                <div className="bg-slate-950/60 border border-slate-850/40 rounded-xl px-3 py-2"><p className="text-slate-500 text-[9px] uppercase font-bold mb-0.5">Adresse</p><p className="text-xs font-bold truncate">{mission.adresseIntervention}</p></div>
                                                <div className="bg-slate-950/60 border border-slate-850/40 rounded-xl px-3 py-2"><p className="text-slate-500 text-[9px] uppercase font-bold mb-0.5">Date</p><p className="text-xs font-bold truncate">{mission.dateSouhaitee ? new Date(mission.dateSouhaitee).toLocaleDateString() : '—'}</p></div>
                                                <div className="bg-slate-950/60 border border-slate-850/40 rounded-xl px-3 py-2"><p className="text-slate-500 text-[9px] uppercase font-bold mb-0.5">Montant</p><p className="text-xs font-bold truncate">{mission.montantTotal ? `${Number(mission.montantTotal).toLocaleString()} FCFA` : '—'}</p></div>
                                            </div>
                                            {mission.statut === 'EN_ATTENTE' && <DevisReservation reservationId={mission.id} token={token} onAccepte={() => setMissions(p => p.map(m => m.id === mission.id ? { ...m, statut: 'ACCEPTEE' } : m))} />}
                                            {mission.statut === 'TERMINEE' && (
                                                <button onClick={() => validerPrestation(mission.id)} disabled={validationLoad === mission.id} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white disabled:opacity-40 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-md shadow-purple-600/10">
                                                    {validationLoad === mission.id ? 'Validation...' : '✅ Confirmer et valider la prestation'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </main>

            {chatMission && <ChatModal mission={chatMission} userId={user.id} onClose={() => setChatMission(null)} />}
        </div>
    );
}