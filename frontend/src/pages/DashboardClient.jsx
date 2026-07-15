import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardClient } from '../util/api';

const API = import.meta.env.VITE_API_URL;

const STATUT = {
    EN_ATTENTE: { label: 'Nouvelle demande', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' },
    EN_VALIDATION_ADMIN: { label: 'En attente de validation Admin', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-400 shadow-[0_0_8px_#60a5fa] animate-pulse' },
    ACCEPTEE: { label: 'Prestataire assigné', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', dot: 'bg-indigo-400 shadow-[0_0_8px_#6366f1]' },
    EN_PREPARATION: { label: 'Préparation', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-400 shadow-[0_0_8px_#fb923c]' },
    EN_COURS: { label: 'Intervention en cours', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-400 shadow-[0_0_8px_#c084fc]' },
    TERMINEE: { label: 'Travaux terminés — à valider', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400 shadow-[0_0_8px_#34d399]' },
    VALIDEE: { label: 'Clôturée & Validée', bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
    ANNULEE: { label: 'Annulée', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-400 shadow-[0_0_8px_#fb7185]' },
};

function StatutBadge({ statut }) {
    const s = STATUT[statut] || STATUT.EN_ATTENTE;
    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${s.bg} ${s.text} ${s.border} backdrop-blur-md shadow-sm transition-all`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
}

function StatCard({ icon, label, value, gradient }) {
    return (
        <div className="relative overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] p-6 rounded-2xl border border-white/[0.07] hover:border-white/[0.15] transition-all duration-300 group shadow-xl">
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">{label}</span>
                <span className="text-2xl p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] shadow-inner">{icon}</span>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-white">{value ?? '—'}</p>
        </div>
    );
}

// MODAL : MESSAGERIE AVEC LE PRESTATAIRE
function ChatModal({ mission, userId, token, onClose }) {
    const [messages, setMessages] = useState([]);
    const [texte, setTexte] = useState('');
    const [init, setInit] = useState(true);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);

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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-lg bg-[#0E1320] border border-purple-500/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden h-[550px]">
                <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/[0.07]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-purple-500/20">
                            {mission.prestataire?.nomEntreprise?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <div>
                            <p className="font-bold text-slate-100 text-sm">{mission.prestataire?.nomEntreprise || mission.fournisseurNom || 'Prestataire'}</p>
                            <p className="text-purple-400/80 text-xs font-medium">Mission #{mission.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-400 hover:text-white transition-colors text-sm">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
                    {init ? (
                        <div className="flex justify-center items-center h-full"><p className="text-slate-500 text-sm animate-pulse">Chargement de la conversation...</p></div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                            <p className="text-sm font-medium">Aucun message. Lancez la discussion !</p>
                        </div>
                    ) : (
                        messages.map(msg => {
                            const moi = msg.senderId === userId;
                            return (
                                <div key={msg.id} className={`flex ${moi ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${moi ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs font-medium' : 'bg-white/[0.05] border border-white/[0.05] text-slate-200 rounded-bl-xs'}`}>
                                        <p>{msg.contenu}</p>
                                        <p className={`text-[10px] mt-1 text-right ${moi ? 'text-purple-200/70' : 'text-slate-400'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="p-4 bg-white/[0.02] border-t border-white/[0.07] flex gap-2.5">
                    <input
                        value={texte}
                        onChange={e => setTexte(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && envoyer()}
                        placeholder="Écrivez votre message ici..."
                        className="flex-1 bg-[#090D16] border border-white/[0.08] focus:border-purple-500 text-slate-200 placeholder-slate-500 rounded-2xl px-4 py-3 text-sm outline-none transition-all shadow-inner"
                    />
                    <button
                        onClick={envoyer}
                        disabled={!texte.trim() || sending}
                        className={`px-5 rounded-2xl text-sm font-bold flex items-center justify-center transition-all ${texte.trim() ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white shadow-lg shadow-purple-500/25 active:scale-95' : 'bg-white/[0.04] text-slate-600 cursor-not-allowed'}`}>
                        {sending ? '...' : 'Envoyer'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DashboardClient() {
    const navigate = useNavigate();
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [validationLoad, setValidationLoad] = useState(null);
    const [chatMission, setChatMission] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [menuOuvert, setMenuOuvert] = useState(false);
    const token = useMemo(() => localStorage.getItem('token'), []);

    let currentUser = {};
    try { currentUser = JSON.parse(localStorage.getItem('user')) || {}; } catch { }

    // Validation d'une prestation terminée par le client
    const validerPrestation = async (reservationId) => {
        if (!window.confirm("Confirmer la validation de cette prestation ?")) return;

        setValidationLoad(reservationId);
        try {
            const response = await fetch(`${API}/api/reservations/${reservationId}/valider`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setMissions(prev => prev.map(m =>
                    m.id === reservationId ? { ...m, statut: 'VALIDEE' } : m
                ));
            } else {
                alert("Erreur : " + (data.message || "Action non autorisée"));
            }
        } catch (err) {
            console.error(err);
            alert("Erreur de connexion au serveur");
        } finally {
            setValidationLoad(null);
        }
    };

    // Chargement des données avec vraie gestion d'erreur + retry automatique (utile pour le 503
    // "cold start" des backends gratuits type Render, qui peuvent mettre 30-60s à se réveiller)
    useEffect(() => {
        let isMounted = true;
        let retryTimer;

        const initDashboard = async () => {
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const res = await getDashboardClient();
                if (!isMounted) return;

                if (res?.success) {
                    setMissions(res.data.missions || []);
                    setError(null);
                    setLoading(false);
                } else {
                    throw new Error(res?.message || 'Réponse invalide du serveur.');
                }
            } catch (err) {
                console.error("Erreur chargement dashboard client :", err);
                if (!isMounted) return;

                const est503 = err?.status === 503;

                if (est503) {
                    // Le serveur (backend gratuit type Render) peut être en veille : un vrai réveil
                    // à froid prend souvent 30-60s. On retente automatiquement pendant ~65s avant d'abandonner.
                    const MAX_RETRIES = 10;
                    if (retryCount < MAX_RETRIES) {
                        retryTimer = setTimeout(() => setRetryCount(c => c + 1), 6000);
                        return;
                    }
                    setError("Le serveur met du temps à répondre (503). Réessayez dans quelques instants — le service est peut-être en train de redémarrer.");
                } else {
                    // Erreur permanente (401, 404, 500...) : inutile d'attendre, on affiche tout de suite.
                    setError(err?.message || "Une erreur est survenue lors du chargement du dashboard.");
                }
                setLoading(false);
            }
        };

        initDashboard();

        return () => { isMounted = false; clearTimeout(retryTimer); };
    }, [retryCount]);

    const relancer = () => {
        setError(null);
        setLoading(true);
        setRetryCount(c => c + 1);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-[#0B0F19] text-white">
            <div className="text-center space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 animate-ping" />
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_15px_#a855f7]" />
                </div>
                <p className="text-slate-400 font-medium tracking-wide text-sm animate-pulse">
                    {retryCount > 0 ? `Le serveur se réveille, nouvelle tentative (${retryCount}/10)...` : 'Synchronisation sécurisée...'}
                </p>
                {retryCount > 1 && (
                    <p className="text-slate-600 text-xs">Un backend gratuit peut mettre jusqu'à une minute à démarrer après une période d'inactivité.</p>
                )}
            </div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-screen bg-[#0B0F19] p-4">
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-8 max-w-md text-center space-y-4">
                <p className="text-rose-200 font-bold text-lg">{error}</p>
                <button onClick={relancer} className="px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-bold transition-all">Réessayer</button>
            </div>
        </div>
    );

    const missionsActives = missions.filter(m => ['EN_ATTENTE', 'EN_VALIDATION_ADMIN', 'ACCEPTEE', 'EN_PREPARATION', 'EN_COURS'].includes(m.statut));
    const missionsAValider = missions.filter(m => m.statut === 'TERMINEE');
    const missionsTerminees = missions.filter(m => m.statut === 'VALIDEE');
    const totalDepense = missions
        .filter(m => m.statut === 'VALIDEE')
        .reduce((acc, m) => acc + Number(m.montant || m.montantMainOeuvre || m.acompte || 0), 0);

    const tabs = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
        { id: 'missions', label: 'Mes Réservations', icon: '🧾', badge: missionsActives.length + missionsAValider.length },
        { id: 'profil', label: 'Mon Profil', icon: '👤' },
    ];

    const renderMissionCard = (mission) => (
        <div key={mission.id} className="bg-white/[0.02] border border-white/[0.07] hover:border-purple-500/20 rounded-3xl p-6 space-y-5 shadow-xl transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-purple-600 opacity-40 group-hover:opacity-100 transition-opacity" />

            <div className="flex justify-between items-start flex-wrap gap-4 pl-2">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Réservation #{mission.id}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs font-medium text-slate-400">{mission.service?.nom || mission.serviceNom || 'Service'}</span>
                    </div>
                    <h3 className="font-extrabold text-2xl text-white mt-1">{mission.prestataire?.nomEntreprise || mission.fournisseurNom || 'Prestataire en attente d\'assignation'}</h3>

                    {/* Numéro du prestataire visible seulement une fois la mission assignée/validée par l'Admin */}
                    <p className="text-xs text-slate-400 font-medium mt-1">
                        Téléphone prestataire : {' '}
                        <span className={`font-bold ${['ACCEPTEE', 'EN_PREPARATION', 'EN_COURS', 'TERMINEE', 'VALIDEE'].includes(mission.statut) ? 'text-amber-400' : 'text-slate-500'}`}>
                            {['ACCEPTEE', 'EN_PREPARATION', 'EN_COURS', 'TERMINEE', 'VALIDEE'].includes(mission.statut)
                                ? (mission.prestataire?.telephone || mission.fournisseurTelephone || 'Non spécifié')
                                : '📞 Disponible une fois le prestataire assigné'}
                        </span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {!['EN_ATTENTE', 'ANNULEE'].includes(mission.statut) && (
                        <button onClick={() => setChatMission(mission)} className="px-4 py-2 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center gap-2 transition-all">
                            💬 Contacter le prestataire
                        </button>
                    )}
                    <StatutBadge statut={mission.statut} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                    ['Adresse', mission.adresseIntervention || mission.adresse],
                    ['Date souhaitée', mission.dateSouhaitee || mission.dateIntervention ? new Date(mission.dateSouhaitee || mission.dateIntervention).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Dès que possible'],
                    ['Montant', mission.montant || mission.montantMainOeuvre ? `${Number(mission.montant || mission.montantMainOeuvre).toLocaleString()} FCFA` : 'À définir'],
                ].map(([label, val]) => val && (
                    <div key={label} className="bg-[#070A12]/80 rounded-2xl p-4 border border-white/[0.04]">
                        <p className="text-slate-500 text-[10px] uppercase font-black tracking-wider mb-1">{label}</p>
                        <p className="text-slate-200 text-sm font-bold truncate">{val}</p>
                    </div>
                ))}
            </div>

            {(mission.description || mission.besoin) && (
                <div className="bg-white/[0.01] rounded-2xl p-4 border border-white/[0.04]">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Votre demande</span>
                    <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">{mission.description || mission.besoin}</p>
                </div>
            )}

            {mission.statut === 'EN_ATTENTE' && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <p className="text-amber-300 font-bold text-xs tracking-wide uppercase">Votre demande est en cours de traitement</p>
                </div>
            )}

            {mission.statut === 'TERMINEE' && (
                <button
                    onClick={() => validerPrestation(mission.id)}
                    disabled={validationLoad === mission.id}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                    {validationLoad === mission.id ? 'Validation en cours...' : '✅ Valider la prestation'}
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex relative overflow-hidden font-sans selection:bg-purple-500 selection:text-white">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]/[0.1] pointer-events-none" />
            <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]/[0.1] pointer-events-none" />

            {/* Sidebar Desktop */}
            <aside className="hidden md:flex w-72 bg-[#0E1320]/80 backdrop-blur-2xl p-6 flex-col gap-4 border-r border-white/[0.05] z-20 shadow-2xl text-left">
                <div className="flex items-center gap-3 px-2 pt-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <span className="font-black text-white text-base">K</span>
                    </div>
                    <div>
                        <h2 className="font-extrabold text-base tracking-tight text-white leading-none">Kanari Service</h2>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400">Espace Client</span>
                    </div>
                </div>
                <button onClick={() => navigate('/')} className="mt-2 w-full py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-black transition-all shadow-md">
                    + Nouvelle demande
                </button>
                <nav className="flex flex-col gap-1.5 flex-1 mt-2">
                    <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Navigation</span>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} className={`text-left px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === t.id ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/10 border border-purple-500/30 text-white shadow-lg' : 'hover:bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-transparent'}`}>
                            <div className="flex items-center gap-3 text-left">
                                <span className="text-sm">{t.icon}</span>
                                <span>{t.label}</span>
                            </div>
                            {t.badge > 0 && <span className="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">{t.badge}</span>}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Mobile Nav Header */}
            <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-[#0E1320]/90 backdrop-blur-lg border-b border-white/[0.05] z-30 px-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-black text-white text-xs">K</div>
                    <span className="font-extrabold text-sm tracking-tight text-white">Kanari — Client</span>
                </div>
                <button onClick={() => setMenuOuvert(!menuOuvert)} className="px-3 py-1.5 rounded-xl bg-white/[0.05] text-slate-300 font-bold text-xs">{menuOuvert ? 'Fermer ' : 'Menu '}</button>
            </div>

            {/* Mobile Menu Overlay */}
            {menuOuvert && (
                <div className="md:hidden fixed inset-x-0 top-14 bottom-0 z-40 bg-[#0B0F19]/95 backdrop-blur-2xl border-b border-white/[0.05] p-6 space-y-2 overflow-y-auto animate-fadeIn">
                    <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 text-left">Menu Principal</p>
                    <button onClick={() => { navigate('/'); setMenuOuvert(false); }} className="w-full text-left px-4 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg mb-2">
                        + Nouvelle demande
                    </button>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => { setActiveTab(t.id); setMenuOuvert(false); }} className={`w-full text-left px-4 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-between ${activeTab === t.id ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-slate-300 bg-white/[0.02]'}`}>
                            <div className="flex items-center gap-3"><span className="text-lg">{t.icon}</span><span>{t.label}</span></div>
                            {t.badge > 0 && <span className="bg-rose-500 text-white text-xs px-2.5 py-0.5 rounded-full font-black">{t.badge}</span>}
                        </button>
                    ))}
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto mt-14 md:mt-0 max-w-7xl mx-auto z-10 space-y-8">
                <header className="hidden md:flex items-center justify-between pb-4 border-b border-white/[0.05]">
                    <div className="text-left">
                        <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Espace Client</span>
                        <h1 className="text-2xl font-black text-white mt-0.5">{tabs.find(t => t.id === activeTab)?.label}</h1>
                    </div>
                </header>

                {activeTab === 'overview' && (
                    <section className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            <StatCard icon="🧾" label="Réservations actives" value={missionsActives.length} gradient="from-purple-600 to-blue-500" />
                            <StatCard icon="⏳" label="À valider" value={missionsAValider.length} gradient="from-amber-500 to-orange-500" />
                            <StatCard icon="✅" label="Prestations validées" value={missionsTerminees.length} gradient="from-emerald-400 to-teal-500" />
                            <StatCard icon="💰" label="Total dépensé" value={`${totalDepense.toLocaleString()} F`} gradient="from-blue-500 to-cyan-500" />
                        </div>

                        {missionsAValider.length > 0 && (
                            <div className="bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-4 text-left">
                                <h3 className="font-extrabold text-emerald-300 text-base">Prestations terminées en attente de votre validation</h3>
                                <div className="grid grid-cols-1 gap-4 pt-2">
                                    {missionsAValider.map(renderMissionCard)}
                                </div>
                            </div>
                        )}

                        {missionsActives.length > 0 && (
                            <div className="bg-gradient-to-br from-purple-500/5 to-transparent border border-purple-500/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-4 text-left">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <h3 className="font-extrabold text-purple-300 text-base">Réservations en cours</h3>
                                    <button onClick={() => setActiveTab('missions')} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white rounded-xl text-xs font-black transition-all shadow-md">Voir tout</button>
                                </div>
                                <div className="grid grid-cols-1 gap-4 pt-2">
                                    {missionsActives.slice(0, 2).map(renderMissionCard)}
                                </div>
                            </div>
                        )}

                        {missions.length === 0 && (
                            <div className="text-center py-20 bg-white/[0.01] border border-white/[0.05] rounded-3xl text-slate-500 space-y-4">
                                <p className="text-sm font-medium">Vous n'avez pas encore de réservation.</p>
                                <button onClick={() => navigate('/')} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-bold text-xs active:scale-95 transition-all">Faire ma première demande</button>
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'missions' && (
                    <section className="space-y-6 animate-fadeIn text-left">
                        {missions.length === 0 ? (
                            <div className="text-center py-20 bg-white/[0.01] border border-white/[0.05] rounded-3xl text-slate-500">
                                <p className="text-sm font-medium">Aucune réservation trouvée.</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {missions.map(renderMissionCard)}
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'profil' && (
                    <section className="space-y-6 animate-fadeIn text-left">
                        <div className="bg-white/[0.02] border border-white/[0.07] rounded-3xl p-6 md:p-8 shadow-2xl max-w-2xl">
                            <h2 className="text-xl font-black text-white border-b border-white/[0.05] pb-3">Mes informations</h2>
                            <div className="divide-y divide-white/[0.05] pt-2">
                                {[
                                    ['Nom', currentUser?.nom || '—'],
                                    ['Téléphone', currentUser?.telephone || '—'],
                                    ['Email', currentUser?.email || '—'],
                                ].map(([label, val]) => (
                                    <div key={label} className="flex justify-between items-center py-3.5">
                                        <span className="text-slate-400 text-sm">{label}</span>
                                        <span className="font-extrabold text-white text-right text-sm">{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {chatMission && <ChatModal mission={chatMission} userId={currentUser.id} token={token} onClose={() => setChatMission(null)} />}
        </div>
    );
}