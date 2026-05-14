import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../util/api";

// ── Notification Component ─────────────────────────────────────
function NotifFournisseur({ notifs, nom, onGoTo, onDismiss }) {
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        // Entrée avec délai
        const t1 = setTimeout(() => setVisible(true), 100);
        // Auto-dismiss après 6s
        const t2 = setTimeout(() => dismiss(), 6500);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    const dismiss = () => {
        setLeaving(true);
        setTimeout(onDismiss, 400);
    };

    const total = (notifs.missions || 0) + (notifs.messages || 0);

    return (
        <div
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                width: '340px',
                transform: visible && !leaving ? 'translateX(0) scale(1)' : 'translateX(380px) scale(0.95)',
                opacity: visible && !leaving ? 1 : 0,
                transition: leaving
                    ? 'all 0.35s cubic-bezier(0.4, 0, 1, 1)'
                    : 'all 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
        >
            {/* Glow effect */}
            <div style={{
                position: 'absolute', inset: '-2px', borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(59,130,246,0.4))',
                filter: 'blur(8px)', zIndex: -1
            }} />

            <div style={{
                background: 'linear-gradient(145deg, #1a1040, #0f1629)',
                border: '1px solid rgba(139,92,246,0.35)',
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            }}>
                {/* Barre de progression */}
                <div style={{
                    height: '3px',
                    background: 'linear-gradient(90deg, #7c3aed, #3b82f6)',
                    animation: 'shrink 6.5s linear forwards',
                }} />

                <div style={{ padding: '16px 18px 14px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Avatar avec badge */}
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '18px', fontWeight: 'bold', color: 'white'
                                }}>
                                    {nom?.[0]?.toUpperCase() || 'P'}
                                </div>
                                {total > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '-6px', right: '-6px',
                                        background: '#ef4444', color: 'white',
                                        borderRadius: '999px', minWidth: '20px', height: '20px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '11px', fontWeight: 'bold',
                                        border: '2px solid #0f1629',
                                        padding: '0 4px'
                                    }}>
                                        {total}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p style={{ color: 'white', fontWeight: '700', fontSize: '13px', margin: 0, lineHeight: 1.2 }}>
                                    🌍 New Vision
                                </p>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>
                                    Activités récentes
                                </p>
                            </div>
                        </div>
                        <button onClick={dismiss} style={{
                            background: 'rgba(255,255,255,0.07)', border: 'none', color: 'rgba(255,255,255,0.4)',
                            width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                            onMouseEnter={e => e.target.style.color = 'white'}
                            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
                        >✕</button>
                    </div>

                    {/* Bienvenue */}
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '10px' }}>
                        Bon retour, <span style={{ color: 'white', fontWeight: '600' }}>{nom}</span> 👋
                    </p>

                    {/* Alertes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {notifs.missions > 0 && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: 'rgba(234,179,8,0.08)',
                                border: '1px solid rgba(234,179,8,0.25)',
                                borderRadius: '12px', padding: '10px 12px'
                            }}>
                                <div style={{
                                    width: '34px', height: '34px', borderRadius: '10px',
                                    background: 'rgba(234,179,8,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '16px', flexShrink: 0
                                }}>📋</div>
                                <div>
                                    <p style={{ color: '#fbbf24', fontWeight: '700', fontSize: '13px', margin: 0 }}>
                                        {notifs.missions} mission{notifs.missions > 1 ? 's' : ''} en attente
                                    </p>
                                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>
                                        Nécessite votre acceptation
                                    </p>
                                </div>
                            </div>
                        )}

                        {notifs.messages > 0 && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: 'rgba(59,130,246,0.08)',
                                border: '1px solid rgba(59,130,246,0.25)',
                                borderRadius: '12px', padding: '10px 12px'
                            }}>
                                <div style={{
                                    width: '34px', height: '34px', borderRadius: '10px',
                                    background: 'rgba(59,130,246,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '16px', flexShrink: 0
                                }}>💬</div>
                                <div>
                                    <p style={{ color: '#60a5fa', fontWeight: '700', fontSize: '13px', margin: 0 }}>
                                        {notifs.messages} message{notifs.messages > 1 ? 's' : ''} non lu{notifs.messages > 1 ? 's' : ''}
                                    </p>
                                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>
                                        Des clients vous ont écrit
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bouton CTA */}
                    <button onClick={onGoTo} style={{
                        width: '100%', marginTop: '12px', padding: '11px',
                        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                        border: 'none', borderRadius: '12px', color: 'white',
                        fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        transition: 'all 0.2s', letterSpacing: '0.3px'
                    }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        Voir mon dashboard →
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
}

// ── Login Page ─────────────────────────────────────────────────
export default function Login() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [message, setMessage] = useState("");
    const [nomConnecte, setNomConnecte] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [notifs, setNotifs] = useState(null);
    const [redirectTarget, setRedirectTarget] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (message) setMessage("");
    };

    const checkNotifsFournisseur = async (token) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/fournisseur`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!data.success) return null;

            const missions = (data.data?.missions || []).filter(m => m.statut === 'EN_ATTENTE').length;
            const missionsActives = (data.data?.missions || []).filter(m =>
                ['EN_ATTENTE', 'ACCEPTEE', 'EN_PREPARATION', 'EN_COURS'].includes(m.statut)
            );

            let messages = 0;
            await Promise.all(missionsActives.map(async (m) => {
                try {
                    const r = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/non-lus/${m.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const d = await r.json();
                    if (d.success) messages += d.count || 0;
                } catch { }
            }));

            return { missions, messages };
        } catch { return null; }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email.trim() || !form.password.trim()) { setMessage("Veuillez remplir tous les champs."); return; }
        if (!/\S+@\S+\.\S+/.test(form.email)) { setMessage("Adresse email invalide."); return; }

        setLoading(true);
        setMessage("");

        try {
            const result = await loginUser(form);

            if (result.success && result.token) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.setItem("token", result.token);
                localStorage.setItem("user", JSON.stringify(result.user));

                const nom = result.user.nom || result.user.email;
                const role = result.user?.role;
                setNomConnecte(nom);

                if (role === 'fournisseur') {
                    setRedirectTarget('/dashboard-fournisseur');
                    const alertes = await checkNotifsFournisseur(result.token);
                    if (alertes && (alertes.missions > 0 || alertes.messages > 0)) {
                        setNotifs({ ...alertes, nom });
                        // Redirection après 7s (durée de la notif)
                        setTimeout(() => navigate('/dashboard-fournisseur'), 7000);
                    } else {
                        setTimeout(() => navigate('/dashboard-fournisseur'), 1000);
                    }
                } else if (role === 'admin') {
                    setTimeout(() => navigate('/admin'), 1000);
                } else {
                    setTimeout(() => navigate('/accueil'), 1000);
                }
            } else {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setMessage(result.message || "Email ou mot de passe incorrect.");
            }
        } catch {
            setMessage("Erreur serveur. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen px-6 py-12 text-white flex items-center justify-center">
            <div
                className="fixed top-0 left-0 w-full h-full bg-cover bg-center z-[-1] opacity-30 blur-sm"
                style={{ backgroundImage: `url('/backgrounds/kiki3.jpg')` }}
            />

            {/* Notification pro */}
            {notifs && (
                <NotifFournisseur
                    notifs={notifs}
                    nom={nomConnecte}
                    onGoTo={() => navigate('/dashboard-fournisseur')}
                    onDismiss={() => setNotifs(null)}
                />
            )}

            <div className="w-full max-w-md bg-black/70 backdrop-blur-lg rounded-2xl p-8 space-y-7 shadow-xl">
                {/* Logo */}
                <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-2xl font-black mx-auto shadow-lg shadow-purple-500/30">
                        N
                    </div>
                    <h2 className="text-3xl font-bold">Connexion</h2>
                    <p className="text-white/40 text-sm">Bienvenue sur New Vision</p>
                </div>

                {/* Succès */}
                {nomConnecte && (
                    <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/25 rounded-xl px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-sm">✓</div>
                        <p className="text-green-300 font-semibold text-sm">Bienvenue {nomConnecte} !</p>
                    </div>
                )}

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="space-y-1">
                        <label className="text-white/50 text-xs uppercase tracking-wider px-1">Email</label>
                        <input
                            type="email" name="email" placeholder="vous@exemple.com"
                            value={form.email} onChange={handleChange} autoComplete="email"
                            className="w-full p-4 rounded-xl bg-white/10 text-white placeholder-white/30 border border-white/10 focus:border-purple-500 outline-none transition-colors"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-white/50 text-xs uppercase tracking-wider px-1">Mot de passe</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"} name="password" placeholder="••••••••"
                                value={form.password} onChange={handleChange} autoComplete="current-password"
                                className="w-full p-4 pr-12 rounded-xl bg-white/10 text-white placeholder-white/30 border border-white/10 focus:border-purple-500 outline-none transition-colors"
                                required
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                        className={`w-full font-bold py-4 rounded-xl transition-all text-white
                            ${loading ? 'bg-white/20 cursor-not-allowed' : 'bg-gradient-to-r from-purple-500 to-indigo-700 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 active:scale-[0.99]'}`}>
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Connexion...
                            </span>
                        ) : 'Se connecter'}
                    </button>
                </form>

                {/* Erreur */}
                {message && !nomConnecte && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
                        <span className="text-red-400 text-sm">⚠️</span>
                        <p className="text-red-300 text-sm font-medium">{message}</p>
                    </div>
                )}

                {/* Liens */}
                <div className="text-center text-white/40 text-sm space-y-3 pt-2 border-t border-white/8">
                    <p>Pas encore de compte ?</p>
                    <div className="flex gap-3">
                        <Link to="/register-utilisateur"
                            className="flex-1 py-2.5 rounded-xl border border-blue-500/25 bg-blue-500/8 text-blue-400 hover:bg-blue-500/15 font-semibold text-sm transition-colors text-center">
                            👤 Utilisateur
                        </Link>
                        <Link to="/register"
                            className="flex-1 py-2.5 rounded-xl border border-green-500/25 bg-green-500/8 text-green-400 hover:bg-green-500/15 font-semibold text-sm transition-colors text-center">
                            🏪 Fournisseur
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}