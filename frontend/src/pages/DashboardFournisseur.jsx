import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { getDashboardFournisseur, getProduitsFournisseur, deleteProduit } from '../util/api';
import SoldeRetrait from '../components/SoldeRetrait';
import { EnvoyerDevis } from '../components/DevisSection';

const STATUT = {
    EN_ATTENTE: { label: 'En attente', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', dot: 'bg-yellow-400' },
    ACCEPTEE: { label: 'Acceptée', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-400' },
    EN_PREPARATION: { label: 'Préparation', bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-400' },
    EN_COURS: { label: 'En cours', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', dot: 'bg-purple-400' },
    TERMINEE: { label: 'Terminée', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', dot: 'bg-green-400' },
    VALIDEE: { label: 'Validée ✅', bg: 'bg-emerald-700/20', text: 'text-emerald-300', border: 'border-emerald-700/30', dot: 'bg-emerald-400' },
    ANNULEE: { label: 'Annulée', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-400' },
};

const BADGE_PROFIL = {
    EN_ATTENTE: { label: '⏳ En attente de validation', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    EN_EVALUATION: { label: "🔍 En cours d'évaluation", bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    CONFORME: { label: '🛡️ Garanti Kanari Service', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    SUSPENDU: { label: '🚫 Compte suspendu', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
};

function ChatModal({ mission, userId, onClose }) {
    const [messages, setMessages] = useState([]);
    const [texte, setTexte] = useState('');
    const [init, setInit] = useState(true);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    const token = localStorage.getItem('token');

    const charger = async () => {
        try {
            const r = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/${mission.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const d = await r.json();
            if (d.success) setMessages(d.data || []);
        } catch { }
        finally { setInit(false); }
    };

    useEffect(() => { charger(); const t = setInterval(charger, 5000); return () => clearInterval(t); }, [mission.id]);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const envoyer = async () => {
        if (!texte.trim() || sending) return;
        setSending(true);
        try {
            const r = await fetch(`${import.meta.env.VITE_API_URL}/api/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reservationId: mission.id, contenu: texte.trim() })
            });
            const d = await r.json();
            if (d.success) { setMessages(p => [...p, d.data]); setTexte(''); }
        } catch { }
        finally { setSending(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-gray-900 border border-purple-700/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ height: 500 }}>
                <div className="flex items-center justify-between px-5 py-3 bg-purple-900/50 border-b border-purple-700/30">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm">
                            {mission.client?.nom?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div>
                            <p className="font-semibold text-white text-sm leading-none">{mission.client?.nom || 'Client'}</p>
                            <p className="text-purple-400 text-xs mt-0.5">Mission #{mission.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-lg">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                    {init ? (
                        <p className="text-center text-white/30 text-sm mt-8 animate-pulse">Chargement...</p>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/20">
                            <p className="text-3xl mb-2">💬</p>
                            <p className="text-sm">Commencez la conversation</p>
                        </div>
                    ) : messages.map(msg => {
                        const moi = msg.senderId === userId;
                        return (
                            <div key={msg.id} className={`flex ${moi ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm ${moi ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm'}`}>
                                    <p>{msg.contenu}</p>
                                    <p className={`text-[10px] mt-0.5 text-right ${moi ? 'text-purple-200/50' : 'text-white/25'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        {moi && <span className="ml-1">{msg.lu ? '✓✓' : '✓'}</span>}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>
                <div className="px-3 py-3 border-t border-purple-700/30 flex gap-2">
                    <input value={texte} onChange={e => setTexte(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && envoyer()}
                        placeholder="Écrire un message..."
                        className="flex-1 bg-white/5 border border-white/10 focus:border-purple-500 text-white placeholder-white/25 rounded-xl px-4 py-2 text-sm outline-none transition-colors"
                    />
                    <button onClick={envoyer} disabled={!texte.trim() || sending}
                        className={`w-10 h-9 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${texte.trim() ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>
                        {sending ? '…' : '➤'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, gradient }) {
    return (
        <div className={`bg-gradient-to-br ${gradient} p-5 rounded-2xl shadow-lg`}>
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-white/70 text-sm">{label}</p>
            <p className="text-2xl font-bold mt-0.5">{value ?? '—'}</p>
        </div>
    );
}

function StatutBadge({ statut }) {
    const s = STATUT[statut] || STATUT.EN_ATTENTE;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
}

export default function DashboardFournisseur() {
    const [activeTab, setActiveTab] = useState('overview');
    const [data, setData] = useState(null);
    const [produits, setProduits] = useState([]);
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoad, setActionLoad] = useState(null);
    const [menuOuvert, setMenuOuvert] = useState(false);
    const [chatMission, setChatMission] = useState(null);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    let currentUser = {};
    try { currentUser = JSON.parse(localStorage.getItem('user')) || {}; } catch { }

    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const [dash, prods] = await Promise.all([getDashboardFournisseur(), getProduitsFournisseur()]);
                if (!dash.success) throw new Error(dash.message);
                setData(dash.data);
                setMissions(dash.data.missions || []);
                setProduits(prods.data || []);
            } catch (e) { setError('Impossible de charger le dashboard.'); }
            finally { setLoading(false); }
        })();
    }, [token]);

    const callAction = async (id, endpoint, nextStatut, body = {}) => {
        setActionLoad(`${id}_${endpoint}`);
        try {
            const r = await fetch(`${import.meta.env.VITE_API_URL}/api/missions/${id}/${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body)
            }).then(r => r.json());
            if (r.success) setMissions(p => p.map(m => m.id === id ? { ...m, statut: nextStatut, ...body } : m));
            else alert('❌ ' + (r.message || 'Erreur'));
        } catch { alert('❌ Erreur serveur'); }
        finally { setActionLoad(null); }
    };

    const signalerMateriel = async (id) => {
        const desc = window.prompt('Décrivez le matériel manquant :');
        if (!desc) return;
        await callAction(id, 'materiel', 'EN_PREPARATION', { descriptionMateriel: desc, manqueMateriel: true });
        alert('✅ Kanari Service a été notifié.');
    };

    if (!token) return <Navigate to="/login" replace />;
    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white">
            <div className="text-center space-y-3">
                <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-purple-300 text-sm">Chargement du dashboard...</p>
            </div>
        </div>
    );
    if (error) return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-red-400">{error}</div>
    );

    const { profil, stats, commandesRecentes = [] } = data || {};
    const badgeProfil = BADGE_PROFIL[profil?.statut] || BADGE_PROFIL.EN_ATTENTE;
    const missionsActives = missions.filter(m => ['EN_ATTENTE', 'ACCEPTEE', 'EN_PREPARATION', 'EN_COURS'].includes(m.statut));

    const tabs = [
        { id: 'overview', label: '📊 Résumé' },
        { id: 'missions', label: '📋 Missions', badge: missionsActives.length },
        { id: 'commandes', label: '🛒 Commandes' },
        { id: 'produits', label: '📦 Produits' },
        { id: 'solde', label: '💰 Solde' },
        { id: 'profil', label: '👤 Profil' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-950 text-white flex">

            {/* ── Sidebar desktop ── */}
            <aside className="hidden md:flex w-64 bg-purple-950/80 backdrop-blur p-6 flex-col gap-2 shadow-xl border-r border-purple-800/50">
                <div className="mb-5">
                    <h2 className="text-xl font-bold">🌍 Kanari Service</h2>
                    <p className="text-xs text-purple-400 mt-1">Espace prestataire</p>
                </div>
                <div className={`rounded-xl p-3 border mb-4 ${badgeProfil.bg} ${badgeProfil.border}`}>
                    <p className={`text-xs font-bold ${badgeProfil.text}`}>{badgeProfil.label}</p>
                    {profil?.statut === 'EN_ATTENTE' && (
                        <p className="text-white/30 text-xs mt-0.5">En attente d'évaluation terrain</p>
                    )}
                </div>
                <nav className="flex flex-col gap-1 flex-1">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between
                                ${activeTab === t.id
                                    ? 'bg-purple-600/40 border border-purple-500/50 text-white'
                                    : 'hover:bg-purple-800/40 text-purple-300 hover:text-white border border-transparent'}`}>
                            <span>{t.label}</span>
                            {t.badge > 0 && <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{t.badge}</span>}
                        </button>
                    ))}
                    <button onClick={() => navigate('/accueil')}
                        className="text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-purple-300 hover:text-white hover:bg-purple-800/40 transition-all border border-transparent">
                        🏠 Retour accueil
                    </button>
                </nav>
                <div className="border-t border-purple-800 pt-4 space-y-2">
                    <div className="bg-purple-900/50 rounded-xl px-3 py-2.5">
                        <p className="text-xs text-purple-400">Connecté en tant que</p>
                        <p className="text-sm font-semibold text-white truncate">{profil?.nomEntreprise || profil?.nom || 'Prestataire'}</p>
                    </div>
                    <button onClick={() => { localStorage.clear(); navigate('/login'); }}
                        className="w-full px-3 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-400 font-semibold text-sm transition-all">
                        🚪 Déconnexion
                    </button>
                </div>
            </aside>

            {/* ── Header mobile ── */}
            <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-purple-950/95 backdrop-blur border-b border-purple-800/60 px-4 py-3 flex justify-between items-center">
                <span className="font-bold">🌍 Kanari Service</span>
                <button onClick={() => setMenuOuvert(!menuOuvert)} className="p-2 rounded-lg bg-purple-800/50 text-sm">
                    {menuOuvert ? '✕' : '☰'}
                </button>
            </div>
            {menuOuvert && (
                <div className="md:hidden fixed top-14 inset-x-0 z-40 bg-purple-950 border-b border-purple-800 p-3 space-y-1">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => { setActiveTab(t.id); setMenuOuvert(false); }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex justify-between
                                ${activeTab === t.id ? 'bg-purple-600/40 text-white' : 'text-purple-300 hover:bg-purple-800/40'}`}>
                            <span>{t.label}</span>
                            {t.badge > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{t.badge}</span>}
                        </button>
                    ))}
                    <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-full px-3 py-2.5 rounded-xl bg-red-600/20 text-red-400 font-semibold text-sm">🚪 Déconnexion</button>
                </div>
            )}

            {/* ── Contenu ── */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto mt-14 md:mt-0">

                {/* RÉSUMÉ */}
                {activeTab === 'overview' && (
                    <section className="space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold">Bonjour 👋</h2>
                            <p className="text-purple-300 mt-1">{profil?.nomEntreprise || profil?.nom}</p>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard icon="📦" label="Produits" value={stats?.totalProduits ?? 0} gradient="from-indigo-600 to-indigo-800" />
                            <StatCard icon="📋" label="Missions" value={stats?.totalMissions ?? 0} gradient="from-purple-600 to-purple-800" />
                            <StatCard icon="🛒" label="Commandes" value={stats?.totalCommandes ?? 0} gradient="from-blue-600 to-blue-800" />
                            <StatCard icon="💰" label="Revenus FCFA" value={stats?.totalRevenus?.toLocaleString() ?? 0} gradient="from-emerald-600 to-emerald-800" />
                        </div>
                        {missionsActives.length > 0 && (
                            <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-2xl p-5">
                                <h3 className="font-bold text-yellow-400 mb-3">
                                    ⚡ {missionsActives.length} mission{missionsActives.length > 1 ? 's' : ''} active{missionsActives.length > 1 ? 's' : ''}
                                </h3>
                                <div className="space-y-2">
                                    {missionsActives.slice(0, 3).map(m => (
                                        <div key={m.id} className="flex justify-between items-center bg-black/20 rounded-xl px-4 py-3">
                                            <div>
                                                <p className="font-semibold text-sm">Mission #{m.id}</p>
                                                <p className="text-xs text-white/40">{m.client?.nom || '—'} — {m.adresseIntervention?.substring(0, 30)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <StatutBadge statut={m.statut} />
                                                <button onClick={() => setActiveTab('missions')}
                                                    className="text-xs bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-3 py-1 rounded-full transition-colors">
                                                    Gérer
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* MISSIONS */}
                {activeTab === 'missions' && (
                    <section className="space-y-5">
                        <div>
                            <h2 className="text-3xl font-bold">📋 Mes Missions</h2>
                            <p className="text-purple-300 text-sm mt-1">{missions.length} mission{missions.length > 1 ? 's' : ''} au total</p>
                        </div>
                        {missions.length === 0 ? (
                            <div className="text-center py-20 text-purple-300">
                                <p className="text-5xl mb-4">📭</p>
                                <p>Aucune mission pour le moment.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {missions.map(mission => {
                                    const s = STATUT[mission.statut] || STATUT.EN_ATTENTE;
                                    return (
                                        <div key={mission.id} className={`rounded-2xl border ${s.bg} ${s.border} overflow-hidden`}>
                                            <div className={`h-1 w-full ${s.dot}`} />
                                            <div className="p-5 space-y-4">
                                                <div className="flex justify-between items-start flex-wrap gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="text-lg font-bold">Mission #{mission.id}</h3>
                                                            <StatutBadge statut={mission.statut} />
                                                        </div>
                                                        <p className="text-sm text-white/60 mt-1">
                                                            Client : <span className="text-white font-semibold">{mission.client?.nom || '—'}</span>
                                                            {mission.client?.telephone && <span className="text-white/30 ml-2">· {mission.client.telephone}</span>}
                                                        </p>
                                                    </div>
                                                    <button onClick={() => setChatMission(mission)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700/30 hover:bg-purple-600/50 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-semibold transition-all">
                                                        💬 Discussion
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {[
                                                        ['📍 Adresse', mission.adresseIntervention],
                                                        ['📅 Date', mission.dateSouhaitee ? new Date(mission.dateSouhaitee).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null],
                                                        ['💰 Acompte', mission.acompte ? `${Number(mission.acompte).toLocaleString()} FCFA` : null],
                                                    ].map(([label, val]) => val && (
                                                        <div key={label} className="bg-black/20 rounded-xl px-3 py-2">
                                                            <p className="text-white/35 text-[10px] uppercase tracking-wide mb-0.5">{label}</p>
                                                            <p className="text-white text-sm font-medium truncate">{val}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {mission.description && (
                                                    <div className="bg-black/20 rounded-xl p-3 border-l-2 border-purple-500/40">
                                                        <p className="text-white/40 text-xs mb-1">Besoin du client</p>
                                                        <p className="text-sm text-white/90 leading-relaxed">{mission.description}</p>
                                                    </div>
                                                )}

                                                {mission.manqueMateriel && (
                                                    <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-3">
                                                        <p className="text-orange-400 font-semibold text-sm">🔧 Matériel manquant signalé</p>
                                                        <p className="text-white/50 text-xs mt-0.5">{mission.descriptionMateriel}</p>
                                                        <p className="text-orange-300/60 text-xs mt-1">Kanari Service contacte un fournisseur partenaire...</p>
                                                    </div>
                                                )}

                                                {mission.statut === 'VALIDEE' && (
                                                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl px-4 py-3 flex justify-between items-center">
                                                        <span className="text-emerald-300 font-semibold text-sm">✅ Paiement libéré</span>
                                                        <span className="text-emerald-400 font-bold">{Number(mission.montantTotal)?.toLocaleString()} FCFA</span>
                                                    </div>
                                                )}

                                                {/* ── Devis — visible si mission ACCEPTEE ou EN_COURS ── */}
                                                {['ACCEPTEE', 'EN_PREPARATION', 'EN_COURS'].includes(mission.statut) && (
                                                    <EnvoyerDevis
                                                        mission={mission}
                                                        onDevisEnvoye={() => alert('✅ Devis envoyé au client !')}
                                                    />
                                                )}

                                                {/* ── Actions ── */}
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {mission.statut === 'EN_ATTENTE' && (
                                                        <button onClick={() => callAction(mission.id, 'accepter', 'ACCEPTEE')}
                                                            disabled={actionLoad === `${mission.id}_accepter`}
                                                            className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 rounded-xl text-sm font-bold transition-colors">
                                                            {actionLoad === `${mission.id}_accepter` ? '⏳...' : '✅ Accepter'}
                                                        </button>
                                                    )}
                                                    {['ACCEPTEE', 'EN_PREPARATION'].includes(mission.statut) && (
                                                        <>
                                                            <button onClick={() => callAction(mission.id, 'demarrer', 'EN_COURS')}
                                                                disabled={actionLoad === `${mission.id}_demarrer`}
                                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl text-sm font-bold transition-colors">
                                                                {actionLoad === `${mission.id}_demarrer` ? '⏳...' : mission.statut === 'EN_PREPARATION' ? '🚀 Matériel reçu — Démarrer' : '🚀 Démarrer'}
                                                            </button>
                                                            {mission.statut === 'ACCEPTEE' && (
                                                                <button onClick={() => signalerMateriel(mission.id)}
                                                                    disabled={actionLoad === `${mission.id}_materiel`}
                                                                    className="px-4 py-2 bg-orange-600/80 hover:bg-orange-600 disabled:opacity-40 rounded-xl text-sm font-bold transition-colors">
                                                                    🔧 Signaler matériel manquant
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                    {mission.statut === 'EN_COURS' && (
                                                        <button onClick={() => callAction(mission.id, 'terminer', 'TERMINEE')}
                                                            disabled={actionLoad === `${mission.id}_terminer`}
                                                            className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 rounded-xl text-sm font-bold transition-colors">
                                                            {actionLoad === `${mission.id}_terminer` ? '⏳...' : '🏁 Marquer terminée'}
                                                        </button>
                                                    )}
                                                    {mission.statut === 'TERMINEE' && (
                                                        <div className="px-4 py-2 bg-blue-900/20 border border-blue-500/30 rounded-xl text-blue-300 text-sm">
                                                            ⏳ En attente de validation par le client...
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* COMMANDES */}
                {activeTab === 'commandes' && (
                    <section className="space-y-5">
                        <h2 className="text-3xl font-bold">🛒 Commandes récentes</h2>
                        {commandesRecentes.length === 0 ? (
                            <div className="text-center py-20 text-purple-300">
                                <p className="text-5xl mb-4">🛒</p>
                                <p>Aucune commande récente.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {commandesRecentes.map(cmd => (
                                    <div key={cmd.id} className="bg-purple-900/30 border border-purple-700/30 rounded-2xl p-5 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-bold">Commande #{cmd.id}</h3>
                                            <span className="text-sm text-purple-300">{new Date(cmd.createdAt).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                        <p className="text-sm text-white/60">Client : <span className="text-white font-medium">{cmd.clientCommande?.nom || '—'}</span></p>
                                        {cmd.itemsCommande?.map(item => (
                                            <div key={item.id} className="flex justify-between text-sm bg-black/20 rounded-lg px-3 py-1.5">
                                                <span className="text-white/70">{item.produitCommandeProduit?.nom}</span>
                                                <span className="text-white/40">× {item.quantite}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* PRODUITS */}
                {activeTab === 'produits' && (
                    <section className="space-y-5">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-bold">📦 Mes Produits</h2>
                            <button onClick={() => navigate('/ajouter-produit')}
                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors">
                                + Ajouter
                            </button>
                        </div>
                        {produits.length === 0 ? (
                            <div className="text-center py-20 text-purple-300">
                                <p className="text-5xl mb-4">📦</p>
                                <p>Aucun produit ajouté.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {produits.map(p => (
                                    <div key={p.id} className="bg-purple-900/30 border border-purple-700/30 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-colors group">
                                        <div className="h-44 bg-purple-900/40 overflow-hidden">
                                            {p.image ? (
                                                <img src={`${import.meta.env.VITE_API_URL}/uploads/${p.image}`} alt={p.nom}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    onError={e => { e.target.onerror = null; e.target.src = '/backgrounds/default.jpg'; }} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-5xl text-purple-700">📦</div>
                                            )}
                                        </div>
                                        <div className="p-4 space-y-2">
                                            <h3 className="font-bold text-lg">{p.nom}</h3>
                                            <p className="text-sm text-purple-300 line-clamp-2">{p.description}</p>
                                            <p className="font-bold text-green-400">{p.prix?.toLocaleString()} FCFA</p>
                                            <div className="flex gap-2 pt-1">
                                                <button onClick={() => navigate(`/modifier-produit/${p.id}`)}
                                                    className="flex-1 py-2 bg-indigo-600/40 hover:bg-indigo-600/70 border border-indigo-500/30 text-white rounded-xl text-sm font-medium transition-colors">
                                                    ✏️ Modifier
                                                </button>
                                                <button onClick={() => { if (window.confirm('Supprimer ?')) deleteProduit(p.id).then(() => setProduits(prev => prev.filter(x => x.id !== p.id))); }}
                                                    className="flex-1 py-2 bg-red-600/30 hover:bg-red-600/60 border border-red-500/30 text-red-300 rounded-xl text-sm font-medium transition-colors">
                                                    🗑️ Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* SOLDE */}
                {activeTab === 'solde' && (
                    <section className="space-y-5">
                        <div>
                            <h2 className="text-3xl font-bold">💰 Mon Solde</h2>
                            <p className="text-purple-300 text-sm mt-1">Gérez vos revenus et retraits</p>
                        </div>
                        <SoldeRetrait />
                    </section>
                )}

                {/* PROFIL */}
                {activeTab === 'profil' && (
                    <section className="space-y-5">
                        <h2 className="text-3xl font-bold">👤 Mon Profil</h2>
                        <div className="bg-purple-900/30 border border-purple-700/30 rounded-2xl p-6 max-w-md space-y-4">
                            <div className="w-20 h-20 rounded-2xl bg-purple-600 flex items-center justify-center text-3xl font-bold mx-auto">
                                {profil?.nomEntreprise?.[0]?.toUpperCase() || '🏪'}
                            </div>
                            <div className={`rounded-xl p-3 border text-center ${badgeProfil.bg} ${badgeProfil.border}`}>
                                <p className={`font-bold text-sm ${badgeProfil.text}`}>{badgeProfil.label}</p>
                            </div>
                            <div className="divide-y divide-purple-800/50">
                                {[
                                    ['Entreprise', profil?.nomEntreprise],
                                    ['Email', profil?.userFournisseur?.email],
                                    ['Téléphone', profil?.telephone || profil?.userFournisseur?.telephone],
                                    ['Adresse', profil?.adresse],
                                    ['Quartier', profil?.quartier],
                                    ['Transport', profil?.hasTransport ? '✅ Disponible' : '❌ Non'],
                                    ['Matériel', profil?.hasMateriel ? '✅ Disponible' : '❌ Non'],
                                    ['Note', profil?.note > 0 ? `⭐ ${profil.note.toFixed(1)}/5` : 'Pas encore noté'],
                                ].map(([label, val]) => (
                                    <div key={label} className="flex justify-between items-center py-2.5">
                                        <span className="text-purple-300 text-sm">{label}</span>
                                        <span className="font-semibold text-sm text-right">{val || '—'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {chatMission && (
                <ChatModal mission={chatMission} userId={currentUser.id} onClose={() => setChatMission(null)} />
            )}
        </div>
    );
}