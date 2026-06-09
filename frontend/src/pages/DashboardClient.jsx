import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getDashboardClient } from '../util/api';

const STATUT = {
    EN_ATTENTE: {
        label: 'En attente',
        bg: 'bg-amber-500/15',
        text: 'text-amber-300',
        border: 'border-amber-400/20',
        dot: 'bg-amber-300',
    },
    ACCEPTEE: {
        label: 'Acceptée',
        bg: 'bg-sky-500/15',
        text: 'text-sky-300',
        border: 'border-sky-400/20',
        dot: 'bg-sky-300',
    },
    EN_PREPARATION: {
        label: 'Préparation',
        bg: 'bg-orange-500/15',
        text: 'text-orange-300',
        border: 'border-orange-400/20',
        dot: 'bg-orange-300',
    },
    EN_COURS: {
        label: 'En cours',
        bg: 'bg-violet-500/15',
        text: 'text-violet-300',
        border: 'border-violet-400/20',
        dot: 'bg-violet-300',
    },
    TERMINEE: {
        label: 'Terminée',
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-300',
        border: 'border-emerald-400/20',
        dot: 'bg-emerald-300',
    },
    VALIDEE: {
        label: 'Validée ✅',
        bg: 'bg-emerald-600/15',
        text: 'text-emerald-200',
        border: 'border-emerald-400/20',
        dot: 'bg-emerald-300',
    },
    ANNULEE: {
        label: 'Annulée',
        bg: 'bg-rose-500/15',
        text: 'text-rose-300',
        border: 'border-rose-400/20',
        dot: 'bg-rose-300',
    },
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
                headers: { Authorization: `Bearer ${token}` },
            });
            const d = await r.json();
            if (d.success) setMessages(d.data || []);
        } catch (err) {
            console.error('Erreur chargement messages:', err);
        } finally {
            setInit(false);
        }
    };

    useEffect(() => {
        charger();
        const t = setInterval(charger, 5000);
        return () => clearInterval(t);
    }, [mission.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const envoyer = async () => {
        if (!texte.trim() || sending) return;
        setSending(true);
        try {
            const r = await fetch(`${import.meta.env.VITE_API_URL}/api/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reservationId: mission.id, contenu: texte.trim() }),
            });
            const d = await r.json();
            if (d.success) {
                setMessages((p) => [...p, d.data]);
                setTexte('');
            }
        } catch (err) {
            console.error('Erreur envoi message:', err);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <div className="w-full max-w-md bg-slate-950/90 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 bg-white/5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center font-bold text-sm text-white">
                            {mission.prestataire?.nomEntreprise?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <div>
                            <p className="font-semibold text-white text-sm leading-none">
                                {mission.prestataire?.nomEntreprise || 'Prestataire'}
                            </p>
                            <p className="text-sky-300 text-xs mt-1">Mission #{mission.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-lg leading-none">
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                    {init ? (
                        <p className="text-center text-white/30 text-sm mt-8 animate-pulse">Chargement...</p>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-white/20">
                            <p className="text-3xl mb-2">💬</p>
                            <p className="text-sm">Commencez la conversation</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const moi = msg.senderId === userId;
                            return (
                                <div key={msg.id} className={`flex ${moi ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm ${moi
                                                ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-br-sm'
                                                : 'bg-white/8 text-white rounded-bl-sm border border-white/10'
                                            }`}
                                    >
                                        <p>{msg.contenu}</p>
                                        <p className={`text-[10px] mt-1 text-right ${moi ? 'text-sky-100/60' : 'text-white/30'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            {moi && <span className="ml-1">{msg.lu ? '✓✓' : '✓'}</span>}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="px-3 py-3 border-t border-white/10 flex gap-2 bg-white/5">
                    <input
                        value={texte}
                        onChange={(e) => setTexte(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && envoyer()}
                        placeholder="Écrire un message..."
                        className="flex-1 bg-slate-900/80 border border-white/10 focus:border-sky-500 text-white placeholder-white/30 rounded-2xl px-4 py-2.5 text-sm outline-none transition-colors"
                    />
                    <button
                        onClick={envoyer}
                        disabled={!texte.trim() || sending}
                        className={`w-11 h-11 rounded-2xl text-sm font-bold transition-all flex items-center justify-center ${texte.trim()
                                ? 'bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white'
                                : 'bg-white/5 text-white/20 cursor-not-allowed'
                            }`}
                    >
                        {sending ? '…' : '➤'}
                    </button>
                </div>
            </div>
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
    try {
        user = JSON.parse(localStorage.getItem('user')) || {};
    } catch (err) {
        console.error('Erreur lecture user:', err);
    }

    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const res = await getDashboardClient();
                if (!res.success) throw new Error(res.message);
                setStats(res.data.stats || {});
                setFactures(res.data.facturesRecentes || []);
                setMissions(res.data.missions || []);
            } catch (err) {
                console.error('Erreur dashboard client:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    const validerPrestation = async (id) => {
        if (!window.confirm('Confirmer que la prestation a été effectuée ?')) return;
        setValidationLoad(id);
        try {
            const r = await fetch(`${import.meta.env.VITE_API_URL}/api/missions/${id}/valider`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            }).then((r) => r.json());
            if (r.success) {
                setMissions((prev) => prev.map((m) => (m.id === id ? { ...m, statut: 'VALIDEE' } : m)));
            } else {
                alert('❌ ' + (r.message || 'Erreur'));
            }
        } catch (err) {
            console.error('Erreur validation mission:', err);
            alert('❌ Erreur serveur');
        } finally {
            setValidationLoad(null);
        }
    };

    if (!token) return <Navigate to="/login" replace />;
    if (loading)
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sky-300 text-sm">Chargement...</p>
                </div>
            </div>
        );

    const missionsActives = missions.filter((m) => ['EN_ATTENTE', 'ACCEPTEE', 'EN_COURS', 'EN_PREPARATION'].includes(m.statut));
    const tabs = [
        { id: 'overview', label: '📊 Résumé' },
        { id: 'missions', label: '📋 Missions', badge: missionsActives.length },
        { id: 'factures', label: '🧾 Factures' },
        { id: 'profil', label: '👤 Profil' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex">
            <aside className="hidden md:flex w-72 bg-white/5 backdrop-blur-xl p-6 flex-col gap-2 border-r border-white/10">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                        🌍 Kanari Service
                    </h2>
                    <p className="text-xs text-sky-300 mt-1">Espace client</p>
                </div>

                <nav className="flex flex-col gap-2 flex-1">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-between border ${activeTab === t.id
                                    ? 'bg-sky-500/15 border-sky-400/20 text-white shadow-lg shadow-sky-500/10'
                                    : 'hover:bg-white/8 text-white/75 hover:text-white border-transparent'
                                }`}
                        >
                            <span>{t.label}</span>
                            {t.badge > 0 && (
                                <span className="bg-rose-500 text-white text-xs font-bold min-w-5 h-5 px-1 flex items-center justify-center rounded-full">
                                    {t.badge}
                                </span>
                            )}
                        </button>
                    ))}
                    <button
                        onClick={() => navigate('/accueil')}
                        className="text-left px-4 py-3 rounded-2xl text-sm font-semibold text-sky-200 hover:text-white hover:bg-white/8 transition-all border border-transparent"
                    >
                        🏠 Retour accueil
                    </button>
                </nav>

                <div className="border-t border-white/10 pt-4 space-y-3">
                    <div className="bg-white/5 rounded-2xl px-4 py-3">
                        <p className="text-xs text-sky-300">Connecté en tant que</p>
                        <p className="text-sm font-semibold text-white truncate">{user.nom || 'Client'}</p>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            navigate('/login');
                        }}
                        className="w-full px-4 py-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/20 text-rose-200 font-semibold text-sm transition-all"
                    >
                        🚪 Déconnexion
                    </button>
                </div>
            </aside>

            <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex justify-between items-center">
                <span className="font-bold bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                    🌍 Kanari Service
                </span>
                <button onClick={() => setMenuOuvert(!menuOuvert)} className="p-2 rounded-xl bg-white/8 text-sm">
                    {menuOuvert ? '✕' : '☰'}
                </button>
            </div>

            {menuOuvert && (
                <div className="md:hidden fixed top-14 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-white/10 p-3 space-y-2">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => {
                                setActiveTab(t.id);
                                setMenuOuvert(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-2xl text-sm flex justify-between ${activeTab === t.id ? 'bg-sky-500/15 text-white' : 'text-white/75 hover:bg-white/8'
                                }`}
                        >
                            <span>{t.label}</span>
                            {t.badge > 0 && (
                                <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">{t.badge}</span>
                            )}
                        </button>
                    ))}
                    <button
                        onClick={() => {
                            localStorage.clear();
                            navigate('/login');
                        }}
                        className="w-full px-4 py-3 rounded-2xl bg-rose-500/15 text-rose-200 font-semibold text-sm"
                    >
                        🚪 Déconnexion
                    </button>
                </div>
            )}

            <main className="flex-1 p-6 md:p-8 overflow-y-auto mt-14 md:mt-0">
                {activeTab === 'overview' && (
                    <section className="space-y-6">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-7 shadow-2xl">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <p className="text-sky-300 text-sm mb-2">Bienvenue sur votre espace client</p>
                                    <h2 className="text-3xl md:text-4xl font-bold">
                                        Bonjour, {user.nom?.split(' ')[0] || 'vous'} 👋
                                    </h2>
                                    <p className="text-white/60 mt-2 text-sm">Voici un résumé clair de votre activité.</p>
                                </div>
                                <div className="bg-gradient-to-br from-sky-500/20 to-cyan-500/10 border border-sky-400/20 rounded-3xl px-5 py-4">
                                    <p className="text-xs text-sky-200/70">Missions actives</p>
                                    <p className="text-3xl font-bold">{missionsActives.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { icon: '📋', label: 'Missions', value: missions.length, color: 'from-sky-500/20 to-blue-500/15', border: 'border-sky-400/20' },
                                { icon: '⚡', label: 'En cours', value: missionsActives.length, color: 'from-amber-500/20 to-orange-500/15', border: 'border-amber-400/20' },
                                { icon: '🧾', label: 'Factures', value: factures.length, color: 'from-violet-500/20 to-fuchsia-500/15', border: 'border-violet-400/20' },
                                { icon: '✅', label: 'Validées', value: missions.filter((m) => m.statut === 'VALIDEE').length, color: 'from-emerald-500/20 to-green-500/15', border: 'border-emerald-400/20' },
                            ].map((c, i) => (
                                <div key={i} className={`bg-gradient-to-br ${c.color} p-5 rounded-3xl border ${c.border} shadow-xl`}>
                                    <p className="text-2xl mb-2">{c.icon}</p>
                                    <p className="text-white/70 text-sm">{c.label}</p>
                                    <p className="text-3xl font-bold mt-1">{c.value}</p>
                                </div>
                            ))}
                        </div>

                        {missionsActives.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Missions en cours</h3>
                                    <button onClick={() => setActiveTab('missions')} className="text-xs text-sky-300 hover:text-sky-200">
                                        Voir tout →
                                    </button>
                                </div>
                                {missionsActives.slice(0, 3).map((m) => (
                                    <div key={m.id} className="flex justify-between items-center bg-white/5 border border-white/10 rounded-3xl px-4 py-4">
                                        <div>
                                            <p className="font-semibold text-sm">
                                                {m.service?.emoji || '📋'} {m.service?.nom || 'Mission'} #{m.id}
                                            </p>
                                            <p className="text-xs text-white/45 mt-1">{m.prestataire?.nomEntreprise || '—'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatutBadge statut={m.statut} />
                                            <button
                                                onClick={() => setActiveTab('missions')}
                                                className="text-xs bg-sky-500/15 hover:bg-sky-500/25 px-3 py-1.5 rounded-full transition-colors border border-sky-400/20"
                                            >
                                                Voir
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'missions' && (
                    <section className="space-y-5">
                        <div>
                            <h2 className="text-3xl font-bold">📋 Mes Missions</h2>
                            <p className="text-sky-300 text-sm mt-1">
                                {missions.length} mission{missions.length > 1 ? 's' : ''} au total
                            </p>
                        </div>

                        {missions.length === 0 ? (
                            <div className="text-center py-20 text-white/60 bg-white/5 border border-white/10 rounded-3xl">
                                <p className="text-5xl mb-4">📋</p>
                                <p>Aucune mission pour le moment.</p>
                                <button
                                    onClick={() => navigate('/accueil')}
                                    className="mt-4 px-5 py-2.5 bg-sky-500/15 border border-sky-400/20 text-sky-200 rounded-2xl text-sm hover:bg-sky-500/25 transition-colors"
                                >
                                    Trouver un prestataire
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {missions.map((mission) => {
                                    const s = STATUT[mission.statut] || STATUT.EN_ATTENTE;
                                    return (
                                        <div key={mission.id} className={`rounded-3xl border ${s.bg} ${s.border} overflow-hidden bg-white/5 backdrop-blur-xl`}>
                                            <div className={`h-1 w-full ${s.dot}`} />
                                            <div className="p-5 space-y-4">
                                                <div className="flex justify-between items-start flex-wrap gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="text-lg font-bold">{mission.service?.nom || 'Prestation'} — #{mission.id}</h3>
                                                            <StatutBadge statut={mission.statut} />
                                                        </div>
                                                        <p className="text-sm text-white/60 mt-1">
                                                            Prestataire : <span className="text-white font-semibold">{mission.prestataire?.nomEntreprise || '—'}</span>
                                                        </p>
                                                    </div>

                                                    {['EN_ATTENTE', 'ACCEPTEE', 'EN_PREPARATION', 'EN_COURS', 'TERMINEE'].includes(mission.statut) && (
                                                        <button
                                                            onClick={() => setChatMission(mission)}
                                                            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/20 text-sky-200 hover:text-white text-xs font-semibold transition-all"
                                                        >
                                                            💬 Discussion
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {[
                                                        ['📍 Adresse', mission.adresseIntervention],
                                                        [
                                                            '📅 Date',
                                                            mission.dateSouhaitee
                                                                ? new Date(mission.dateSouhaitee).toLocaleString('fr-FR', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })
                                                                : null,
                                                        ],
                                                        ['💰 Acompte', mission.acompte ? `${mission.acompte.toLocaleString()} FCFA` : null],
                                                    ].map(([label, val]) =>
                                                        val ? (
                                                            <div key={label} className="bg-black/20 rounded-2xl px-3 py-2">
                                                                <p className="text-white/35 text-[10px] uppercase tracking-wide mb-0.5">{label}</p>
                                                                <p className="text-white text-sm font-medium truncate">{val}</p>
                                                            </div>
                                                        ) : null
                                                    )}
                                                </div>

                                                {mission.manqueMateriel && (
                                                    <div className="bg-orange-500/10 border border-orange-400/20 rounded-2xl p-3">
                                                        <p className="text-orange-300 font-semibold text-sm">🔧 En attente de matériel</p>
                                                        <p className="text-white/50 text-xs mt-0.5">
                                                            Le prestataire a signalé un besoin en matériel. Kanari Service s'en occupe.
                                                        </p>
                                                    </div>
                                                )}

                                                {mission.statut === 'TERMINEE' && (
                                                    <div className="space-y-2">
                                                        <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-2xl p-3">
                                                            <p className="text-emerald-300 font-semibold text-sm">🏁 Mission terminée par le prestataire</p>
                                                            <p className="text-white/50 text-xs mt-0.5">Validez pour libérer le paiement Escrow.</p>
                                                        </div>
                                                        <button
                                                            onClick={() => validerPrestation(mission.id)}
                                                            disabled={validationLoad === mission.id}
                                                            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:opacity-40 rounded-2xl font-bold text-sm transition-colors"
                                                        >
                                                            {validationLoad === mission.id ? '⏳ Validation...' : '✅ Valider et libérer le paiement'}
                                                        </button>
                                                    </div>
                                                )}

                                                {mission.statut === 'VALIDEE' && (
                                                    <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-2xl px-4 py-3 flex justify-between items-center">
                                                        <span className="text-emerald-200 font-semibold text-sm">✅ Paiement libéré</span>
                                                        <span className="text-emerald-300 font-bold">{mission.montantTotal?.toLocaleString()} FCFA</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'factures' && (
                    <section className="space-y-5">
                        <h2 className="text-3xl font-bold">🧾 Factures</h2>
                        {factures.length === 0 ? (
                            <div className="text-center py-20 text-white/60 bg-white/5 border border-white/10 rounded-3xl">
                                <p className="text-5xl mb-4">🧾</p>
                                <p>Aucune facture disponible.</p>
                            </div>
                        ) : (
                            factures.map((f) => (
                                <div key={f.id} className="bg-white/5 p-5 rounded-3xl border border-white/10 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold">Facture #{f.id}</span>
                                        <span className="font-bold text-emerald-300">{f.montantTotal?.toLocaleString()} FCFA</span>
                                    </div>
                                    {f.factureCommande?.itemsCommande?.map((item) => (
                                        <div key={item.id} className="text-xs text-white/45 flex justify-between bg-black/20 rounded-2xl px-3 py-1.5">
                                            <span>{item.produitCommandeProduit?.nom}</span>
                                            <span>× {item.quantite}</span>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </section>
                )}

                {activeTab === 'profil' && (
                    <section className="space-y-5">
                        <h2 className="text-3xl font-bold">👤 Mon Profil</h2>
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 max-w-md space-y-4">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-3xl font-bold mx-auto shadow-lg shadow-sky-500/20">
                                {user.nom?.[0]?.toUpperCase() || '👤'}
                            </div>
                            <div className="divide-y divide-white/10">
                                {[
                                    ['Nom', user.nom],
                                    ['Email', user.email],
                                    ['Téléphone', user.telephone],
                                    ['Ville', user.ville],
                                    ['Missions', missions.length],
                                    ['Validées', missions.filter((m) => m.statut === 'VALIDEE').length],
                                ].map(([label, val]) => (
                                    <div key={label} className="flex justify-between items-center py-2.5">
                                        <span className="text-sky-200 text-sm">{label}</span>
                                        <span className="font-semibold text-sm">{val || '—'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {chatMission && <ChatModal mission={chatMission} userId={user.id} onClose={() => setChatMission(null)} />}
        </div>
    );
}
