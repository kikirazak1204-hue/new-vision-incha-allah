import React, { useState, useEffect } from 'react';

const OPERATEURS = [
    { id: 'ORANGE', label: 'Orange Money', icon: '🟠', color: '#f97316' },
    { id: 'AIRTEL', label: 'Airtel Money', icon: '🔴', color: '#ef4444' },
    { id: 'MYNITA', label: 'MyNita', icon: '🟢', color: '#22c55e' },
    { id: 'AMANA', label: 'Amana', icon: '🔵', color: '#3b82f6' },
];

export default function SoldeRetrait() {
    const [solde, setSolde] = useState(null);
    const [retraits, setRetraits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ montant: '', operateur: '', telephone: '' });
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState('');
    const [succes, setSucces] = useState('');
    const token = localStorage.getItem('token');

    const charger = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/soldes/mien`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSolde(data.data.solde);
                setRetraits(data.data.retraits || []);
            }
        } catch { }
        finally { setLoading(false); }
    };

    useEffect(() => { charger(); }, []);

    const demanderRetrait = async () => {
        if (!form.montant || !form.operateur || !form.telephone) {
            setMessage('Veuillez remplir tous les champs.');
            return;
        }
        if (Number(form.montant) < 500) {
            setMessage('Montant minimum : 500 FCFA.');
            return;
        }
        if (Number(form.montant) > Number(solde?.solde || 0)) {
            setMessage('Montant supérieur à votre solde disponible.');
            return;
        }

        setSending(true);
        setMessage('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/soldes/retrait`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...form, montant: Number(form.montant) })
            });
            const data = await res.json();
            if (data.success) {
                setSucces(`✅ Demande envoyée ! New Vision va traiter votre retrait sous 24h.`);
                setShowForm(false);
                setForm({ montant: '', operateur: '', telephone: '' });
                charger();
            } else {
                setMessage(data.message || 'Erreur.');
            }
        } catch { setMessage('Erreur serveur.'); }
        finally { setSending(false); }
    };

    const statutBadge = (statut) => {
        const styles = {
            EN_ATTENTE: { bg: 'rgba(234,179,8,0.15)', color: '#fbbf24', label: '⏳ En attente' },
            TRAITE: { bg: 'rgba(74,222,128,0.15)', color: '#4ade80', label: '✅ Traité' },
            REFUSE: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: '❌ Refusé' },
        };
        const s = styles[statut] || styles.EN_ATTENTE;
        return (
            <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700' }}>
                {s.label}
            </span>
        );
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Chargement...
        </div>
    );

    return (
        <div style={{ fontFamily: "'Inter','Arial',sans-serif" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* ── Carte solde ── */}
            <div style={{
                background: 'linear-gradient(135deg, #1e1040, #0f1629)',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: '20px', padding: '24px', marginBottom: '20px',
                position: 'relative', overflow: 'hidden'
            }}>
                {/* Glow */}
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', background: 'rgba(124,58,237,0.15)', borderRadius: '50%', filter: 'blur(30px)' }} />

                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>
                    Solde disponible
                </p>
                <p style={{ color: 'white', fontSize: '36px', fontWeight: '900', marginBottom: '4px' }}>
                    {Number(solde?.solde || 0).toLocaleString()}
                    <span style={{ fontSize: '16px', fontWeight: '400', color: 'rgba(255,255,255,0.4)', marginLeft: '6px' }}>FCFA</span>
                </p>

                <div style={{ display: 'flex', gap: '20px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>Total gagné</p>
                        <p style={{ color: '#4ade80', fontWeight: '700', fontSize: '14px', margin: 0 }}>{Number(solde?.totalGagne || 0).toLocaleString()} FCFA</p>
                    </div>
                    <div>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>Total retiré</p>
                        <p style={{ color: '#60a5fa', fontWeight: '700', fontSize: '14px', margin: 0 }}>{Number(solde?.totalRetire || 0).toLocaleString()} FCFA</p>
                    </div>
                </div>

                <button onClick={() => { setShowForm(!showForm); setMessage(''); setSucces(''); }}
                    disabled={Number(solde?.solde || 0) < 500}
                    style={{
                        marginTop: '16px', padding: '12px 20px',
                        background: Number(solde?.solde || 0) >= 500
                            ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                            : 'rgba(255,255,255,0.07)',
                        border: 'none', borderRadius: '12px', color: Number(solde?.solde || 0) >= 500 ? 'white' : 'rgba(255,255,255,0.2)',
                        fontWeight: '700', fontSize: '14px',
                        cursor: Number(solde?.solde || 0) >= 500 ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s'
                    }}>
                    💸 Demander un retrait
                </button>
                {Number(solde?.solde || 0) < 500 && (
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginTop: '6px' }}>Minimum 500 FCFA pour retirer</p>
                )}
            </div>

            {/* Message succès */}
            {succes && (
                <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
                    <p style={{ color: '#4ade80', fontSize: '13px', fontWeight: '600', margin: 0 }}>{succes}</p>
                </div>
            )}

            {/* ── Formulaire retrait ── */}
            {showForm && (
                <div style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '18px', padding: '20px', marginBottom: '20px'
                }}>
                    <h3 style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>
                        💸 Nouveau retrait
                    </h3>

                    {/* Montant */}
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                            Montant (FCFA)
                        </label>
                        <input type="number" value={form.montant}
                            onChange={e => setForm(p => ({ ...p, montant: e.target.value }))}
                            placeholder="Ex: 10000"
                            style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        />
                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginTop: '4px' }}>
                            Disponible : {Number(solde?.solde || 0).toLocaleString()} FCFA
                        </p>
                    </div>

                    {/* Opérateur */}
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                            Opérateur
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {OPERATEURS.map(op => (
                                <button key={op.id} onClick={() => setForm(p => ({ ...p, operateur: op.id }))}
                                    style={{
                                        padding: '10px 12px', borderRadius: '10px', border: 'none',
                                        background: form.operateur === op.id ? `${op.color}22` : 'rgba(255,255,255,0.04)',
                                        outline: form.operateur === op.id ? `2px solid ${op.color}66` : '1px solid rgba(255,255,255,0.08)',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                                    }}>
                                    <span style={{ fontSize: '18px' }}>{op.icon}</span>
                                    <span style={{ color: form.operateur === op.id ? op.color : 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '12px' }}>
                                        {op.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Téléphone */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                            Numéro {form.operateur || 'Mobile Money'}
                        </label>
                        <input type="tel" value={form.telephone}
                            onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))}
                            placeholder="+227 XX XX XX XX"
                            style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    {message && (
                        <p style={{ color: '#f87171', fontSize: '12px', marginBottom: '12px' }}>⚠️ {message}</p>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={demanderRetrait} disabled={sending} style={{
                            flex: 1, padding: '12px',
                            background: 'linear-gradient(135deg,#059669,#047857)',
                            border: 'none', borderRadius: '12px', color: 'white',
                            fontWeight: '700', fontSize: '14px', cursor: 'pointer'
                        }}>
                            {sending ? '⏳...' : '✅ Confirmer le retrait'}
                        </button>
                        <button onClick={() => { setShowForm(false); setMessage(''); }} style={{
                            padding: '12px 16px', background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                            color: 'rgba(255,255,255,0.4)', cursor: 'pointer'
                        }}>
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            {/* ── Historique retraits ── */}
            <div>
                <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>
                    Historique des retraits
                </h3>
                {retraits.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>Aucun retrait pour le moment</p>
                    </div>
                ) : retraits.map(r => {
                    const op = OPERATEURS.find(o => o.id === r.operateur);
                    return (
                        <div key={r.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '12px', padding: '12px 14px', marginBottom: '8px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '20px' }}>{op?.icon || '💸'}</span>
                                <div>
                                    <p style={{ color: 'white', fontWeight: '700', fontSize: '14px', margin: 0 }}>
                                        {Number(r.montant).toLocaleString()} FCFA
                                    </p>
                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>
                                        {op?.label} · {r.telephone} · {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                            </div>
                            {statutBadge(r.statut)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}