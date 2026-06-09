import React, { useState, useEffect } from 'react';

const ACOMPTE = 1500;
const RETOUR_CLIENT = 1250;

// ── Composant Prestataire — envoyer un devis ──────────────────
export function EnvoyerDevis({ mission, onDevisEnvoye }) {
    const [montant, setMontant] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const token = localStorage.getItem('token');

    const envoyer = async () => {
        if (!montant || Number(montant) < ACOMPTE) {
            setMessage(`Le montant doit être supérieur à ${ACOMPTE} FCFA.`);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/devis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reservationId: mission.id, montant: Number(montant), description })
            });
            const data = await res.json();
            if (data.success) {
                setMessage('');
                onDevisEnvoye?.(data.data);
            } else {
                setMessage(data.message || 'Erreur.');
            }
        } catch { setMessage('Erreur serveur.'); }
        finally { setLoading(false); }
    };

    const resteClient = montant ? Math.max(0, Number(montant) - RETOUR_CLIENT) : 0;

    return (
        <div style={{
            background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '14px', padding: '16px', marginTop: '12px'
        }}>
            <p style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>
                📋 Envoyer un devis
            </p>

            <div style={{ marginBottom: '10px' }}>
                <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                    Montant total (FCFA)
                </label>
                <input
                    type="number" value={montant} onChange={e => setMontant(e.target.value)}
                    placeholder="Ex: 25000"
                    style={{
                        width: '100%', padding: '11px 14px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                    }}
                />
                {montant > 0 && (
                    <div style={{ marginTop: '8px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: '8px', padding: '8px 12px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>
                            Acompte déjà payé : <span style={{ color: '#4ade80' }}>1 250 FCFA déduits</span>
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '2px 0 0' }}>
                            Client paiera en plus : <span style={{ color: 'white', fontWeight: '700' }}>{resteClient.toLocaleString()} FCFA</span>
                        </p>
                    </div>
                )}
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                    Description du devis
                </label>
                <textarea
                    value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Détaillez les travaux, matériaux inclus..."
                    rows={3}
                    style={{
                        width: '100%', padding: '11px 14px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white', fontSize: '13px', outline: 'none', resize: 'vertical',
                        boxSizing: 'border-box', fontFamily: 'inherit'
                    }}
                />
            </div>

            {message && <p style={{ color: '#f87171', fontSize: '12px', marginBottom: '8px' }}>⚠️ {message}</p>}

            <button onClick={envoyer} disabled={loading || !montant}
                style={{
                    width: '100%', padding: '11px',
                    background: montant && !loading ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'rgba(255,255,255,0.07)',
                    border: 'none', borderRadius: '10px', color: montant ? 'white' : 'rgba(255,255,255,0.25)',
                    fontWeight: '700', fontSize: '13px', cursor: montant && !loading ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s'
                }}>
                {loading ? '⏳ Envoi...' : '📤 Envoyer le devis'}
            </button>
        </div>
    );
}

// ── Composant Client — voir et répondre au devis ──────────────
export function VoirDevis({ mission, onAccepte, onRefuse, onAnnuler }) {
    const [devis, setDevis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoad, setActionLoad] = useState(null);
    const [showAnnuler, setShowAnnuler] = useState(false);
    const [annulationInfo, setAnnulationInfo] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/devis/reservation/${mission.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) setDevis(data.data || []);
            } catch { }
            finally { setLoading(false); }
        })();
    }, [mission.id]);

    const devisEnAttente = devis.find(d => d.statut === 'EN_ATTENTE');
    const devisAccepte = devis.find(d => d.statut === 'ACCEPTE');

    const accepter = async (id) => {
        setActionLoad('accepter');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/devis/${id}/accepter`, {
                method: 'PUT', headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setDevis(p => p.map(d => d.id === id ? { ...d, statut: 'ACCEPTE' } : d));
                onAccepte?.(data);
            }
        } catch { }
        finally { setActionLoad(null); }
    };

    const refuser = async (id) => {
        setActionLoad('refuser');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/devis/${id}/refuser`, {
                method: 'PUT', headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setDevis(p => p.map(d => d.id === id ? { ...d, statut: 'REFUSE' } : d));
                onRefuse?.();
            }
        } catch { }
        finally { setActionLoad(null); }
    };

    const annuler = async () => {
        setActionLoad('annuler');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/devis/annuler/${mission.id}`, {
                method: 'PUT', headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setAnnulationInfo(data);
                onAnnuler?.(data);
            }
        } catch { }
        finally { setActionLoad(null); }
    };

    if (loading) return <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Chargement devis...</p>;

    return (
        <div style={{ marginTop: '12px' }}>

            {/* Devis accepté */}
            {devisAccepte && (
                <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '14px', padding: '14px' }}>
                    <p style={{ color: '#4ade80', fontWeight: '700', fontSize: '14px', marginBottom: '6px' }}>✅ Devis accepté</p>
                    <p style={{ color: 'white', fontSize: '18px', fontWeight: '800' }}>{Number(devisAccepte.montant).toLocaleString()} FCFA</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '4px' }}>
                        Acompte déduit : <span style={{ color: '#4ade80' }}>1 250 FCFA</span> —
                        Reste à payer : <span style={{ color: 'white', fontWeight: '700' }}>{Math.max(0, Number(devisAccepte.montant) - RETOUR_CLIENT).toLocaleString()} FCFA</span>
                    </p>
                    {devisAccepte.description && (
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '8px', lineHeight: '1.5' }}>{devisAccepte.description}</p>
                    )}
                </div>
            )}

            {/* Devis en attente */}
            {devisEnAttente && !devisAccepte && (
                <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '14px', padding: '14px' }}>
                    <p style={{ color: '#fbbf24', fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>📋 Devis reçu — en attente de votre réponse</p>
                    <p style={{ color: 'white', fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>
                        {Number(devisEnAttente.montant).toLocaleString()} FCFA
                    </p>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px 10px', marginBottom: '10px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>
                            Acompte déjà payé : <span style={{ color: '#4ade80' }}>1 250 FCFA déduits</span>
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '2px 0 0' }}>
                            Vous paierez en plus : <span style={{ color: 'white', fontWeight: '700' }}>{Math.max(0, Number(devisEnAttente.montant) - RETOUR_CLIENT).toLocaleString()} FCFA</span>
                        </p>
                    </div>
                    {devisEnAttente.description && (
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '12px', lineHeight: '1.5' }}>{devisEnAttente.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => accepter(devisEnAttente.id)} disabled={actionLoad === 'accepter'}
                            style={{
                                flex: 1, padding: '10px', background: 'linear-gradient(135deg,#059669,#047857)',
                                border: 'none', borderRadius: '10px', color: 'white',
                                fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                            }}>
                            {actionLoad === 'accepter' ? '⏳...' : '✅ Accepter'}
                        </button>
                        <button onClick={() => refuser(devisEnAttente.id)} disabled={actionLoad === 'refuser'}
                            style={{
                                flex: 1, padding: '10px', background: 'rgba(239,68,68,0.15)',
                                border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px',
                                color: '#f87171', fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                            }}>
                            {actionLoad === 'refuser' ? '⏳...' : '❌ Refuser'}
                        </button>
                    </div>
                </div>
            )}

            {/* Pas encore de devis */}
            {!devisEnAttente && !devisAccepte && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>⏳ En attente du devis du prestataire...</p>
                </div>
            )}

            {/* Annulation */}
            {!annulationInfo && ['EN_ATTENTE', 'ACCEPTEE'].includes(mission.statut) && (
                <div style={{ marginTop: '10px' }}>
                    {!showAnnuler ? (
                        <button onClick={() => setShowAnnuler(true)} style={{
                            width: '100%', padding: '9px', background: 'transparent',
                            border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px',
                            color: 'rgba(239,68,68,0.6)', fontSize: '12px', cursor: 'pointer'
                        }}>
                            Annuler la réservation
                        </button>
                    ) : (
                        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '12px' }}>
                            <p style={{ color: '#f87171', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>⚠️ Confirmer l'annulation ?</p>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '10px', lineHeight: '1.5' }}>
                                {mission.statut === 'EN_ATTENTE'
                                    ? 'Vous récupérerez 1 250 FCFA. Kanari Service garde 250 FCFA.'
                                    : 'Vous récupérerez 750 FCFA. 750 FCFA partagés entre Kanari Service et le prestataire.'
                                }
                            </p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={annuler} disabled={actionLoad === 'annuler'} style={{
                                    flex: 1, padding: '9px', background: '#dc2626',
                                    border: 'none', borderRadius: '9px', color: 'white',
                                    fontWeight: '700', fontSize: '12px', cursor: 'pointer'
                                }}>
                                    {actionLoad === 'annuler' ? '⏳...' : 'Oui, annuler'}
                                </button>
                                <button onClick={() => setShowAnnuler(false)} style={{
                                    flex: 1, padding: '9px', background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px',
                                    color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer'
                                }}>
                                    Non, garder
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Résultat annulation */}
            {annulationInfo && (
                <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '12px', padding: '12px', marginTop: '10px' }}>
                    <p style={{ color: '#4ade80', fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>✅ Réservation annulée</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{annulationInfo.message}</p>
                    <p style={{ color: 'white', fontWeight: '700', fontSize: '15px', marginTop: '6px' }}>
                        Remboursement : {annulationInfo.remboursement?.toLocaleString()} FCFA
                    </p>
                </div>
            )}
        </div>
    );
}