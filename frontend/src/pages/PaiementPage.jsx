import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePanier } from '../context/PanierContext';
import { validerPaiement } from '../util/api';

// ── Étapes visuelles ───────────────────────────────────────────
const ETAPES = ['Récapitulatif', 'Confirmation', 'Traitement', 'Résultat'];

// ── Spinner ────────────────────────────────────────────────────
function Spinner({ size = 24, color = '#fff' }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            border: `3px solid rgba(255,255,255,0.15)`,
            borderTop: `3px solid ${color}`,
            animation: 'spin 0.8s linear infinite', display: 'inline-block'
        }} />
    );
}

// ── Ligne de détail ────────────────────────────────────────────
function LigneDetail({ label, value, highlight }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>{label}</span>
            <span style={{ color: highlight ? '#4ade80' : 'white', fontWeight: highlight ? '800' : '600', fontSize: highlight ? '22px' : '14px' }}>
                {value}
            </span>
        </div>
    );
}

export default function PaiementPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { viderPanier } = usePanier();

    const [etape, setEtape] = useState(0); // 0=recap, 1=confirm, 2=traitement, 3=resultat
    const [succes, setSucces] = useState(false);
    const [erreur, setErreur] = useState('');
    const [commandeId, setCommandeId] = useState(null);
    const [montantTotal, setMontantTotal] = useState(null);
    const [typeFlux, setTypeFlux] = useState('commande'); // 'commande' | 'reservation'
    const [infoReserv, setInfoReserv] = useState(null); // données réservation si flux service
    const [methode, setMethode] = useState('mobile'); // 'mobile' | 'card'
    const [telephone, setTelephone] = useState('');

    let user = {};
    try { user = JSON.parse(localStorage.getItem('user')) || {}; } catch { }

    useEffect(() => {
        // ── Flux commande produit ──
        let cid = location.state?.commandeId || location.state?.id;
        let mnt = location.state?.montant_total || location.state?.montant;

        // ── Flux réservation service ──
        const reserv = location.state?.reservation;
        if (reserv) {
            setTypeFlux('reservation');
            setInfoReserv(reserv);
            setCommandeId(reserv.id || reserv.reservationId);
            setMontantTotal(reserv.acompte || reserv.montant);
            return;
        }

        // Fallback localStorage pour commandes
        if (!cid) {
            try {
                const saved = JSON.parse(localStorage.getItem('lastCommande'));
                if (saved) { cid = saved.commandeId; mnt = saved.montant_total; }
            } catch { }
        }

        if (cid) setCommandeId(cid);
        if (mnt) setMontantTotal(mnt);
        if (user.telephone) setTelephone(user.telephone);
    }, [location]);

    // ── Écran erreur — aucune commande ──
    if (!commandeId && !infoReserv) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0f1e, #111827)' }}>
                <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.04)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', maxWidth: '360px' }}>
                    <p style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</p>
                    <p style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Aucune commande trouvée</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '24px' }}>Veuillez recommencer depuis le début.</p>
                    <button onClick={() => navigate('/accueil')} style={{
                        padding: '12px 24px', background: 'white', color: '#111827',
                        fontWeight: '700', borderRadius: '14px', border: 'none', cursor: 'pointer', width: '100%'
                    }}>
                        Retour à l'accueil
                    </button>
                </div>
            </div>
        );
    }

    const acompte = typeFlux === 'reservation' ? montantTotal : null;
    const isReservation = typeFlux === 'reservation';
    const montantAffiche = Number(montantTotal || 0);

    // ── Lancer le paiement ──
    const lancerPaiement = async () => {
        setEtape(2);
        setErreur('');
        try {
            const payload = {
                commandeId,
                montant: montantAffiche,
                telephone: telephone || user.telephone || '',
                nom: user.nom || '',
                messageClient: isReservation ? `Acompte Escrow Mission #${commandeId}` : `Paiement Commande #${commandeId}`,
                referenceClient: `PAY-${commandeId}-${Date.now()}`,
                typeFlux,
            };

            const data = await validerPaiement(payload);

            if (data.success || data.transactionId) {
                setSucces(true);
                setEtape(3);
                if (!isReservation) {
                    viderPanier();
                    localStorage.removeItem('lastCommande');
                }
            } else {
                setErreur(data.message || 'Paiement refusé. Vérifiez votre solde.');
                setEtape(3);
            }
        } catch (err) {
            setErreur('Erreur technique. Veuillez réessayer.');
            setEtape(3);
        }
    };

    // ────────────────────────────────────────────────────────────
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0d0b1e 0%, #0a1628 50%, #050d1a 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '20px', fontFamily: "'Inter','Arial',sans-serif"
        }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
                @keyframes pulse-green { 0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.4); } 50% { box-shadow: 0 0 0 16px rgba(74,222,128,0); } }
                @keyframes checkDraw { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
            `}</style>

            <div style={{ width: '100%', maxWidth: '440px', animation: 'fadeUp 0.5s ease' }}>

                {/* ── Header logo ── */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px', fontWeight: '900', color: 'white', margin: '0 auto 10px',
                        boxShadow: '0 8px 24px rgba(124,58,237,0.35)'
                    }}>N</div>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                        {isReservation ? 'Paiement Escrow · Acompte 15%' : 'Paiement Sécurisé'}
                    </p>
                </div>

                {/* ── Barre d'étapes ── */}
                {etape < 3 && (
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px', gap: '4px' }}>
                        {ETAPES.slice(0, 3).map((e, i) => (
                            <React.Fragment key={i}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        background: i <= etape ? 'linear-gradient(135deg, #7c3aed, #2563eb)' : 'rgba(255,255,255,0.08)',
                                        border: i === etape ? '2px solid rgba(124,58,237,0.6)' : '2px solid transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '11px', fontWeight: '700',
                                        color: i <= etape ? 'white' : 'rgba(255,255,255,0.25)',
                                        transition: 'all 0.3s'
                                    }}>
                                        {i < etape ? '✓' : i + 1}
                                    </div>
                                    <p style={{ color: i <= etape ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)', fontSize: '10px', marginTop: '4px', whiteSpace: 'nowrap' }}>
                                        {e}
                                    </p>
                                </div>
                                {i < 2 && <div style={{ flex: 2, height: '2px', background: i < etape ? 'linear-gradient(90deg, #7c3aed, #2563eb)' : 'rgba(255,255,255,0.08)', borderRadius: '2px', marginBottom: '18px', transition: 'all 0.3s' }} />}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* ── CARTE PRINCIPALE ── */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.5)'
                }}>
                    {/* ── ÉTAPE 0 : Récapitulatif ── */}
                    {etape === 0 && (
                        <div style={{ padding: '28px' }}>
                            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
                                {isReservation ? '🔒 Acompte Escrow' : '🛒 Récapitulatif'}
                            </h2>

                            {isReservation && (
                                <div style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Service réservé</p>
                                    <p style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>
                                        {infoReserv?.service?.nom || infoReserv?.serviceNom || 'Prestation de service'}
                                    </p>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '4px' }}>
                                        {infoReserv?.prestataire?.nomEntreprise || infoReserv?.prestataireNom || '—'}
                                    </p>
                                </div>
                            )}

                            <div style={{ marginBottom: '20px' }}>
                                <LigneDetail label="Référence" value={`#${commandeId}`} />
                                <LigneDetail label="Client" value={user.nom || '—'} />
                                {isReservation && infoReserv?.dateSouhaitee && (
                                    <LigneDetail label="Date souhaitée" value={new Date(infoReserv.dateSouhaitee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} />
                                )}
                                {isReservation && (
                                    <LigneDetail label="Montant total estimé" value={`${Number(infoReserv?.montantTotal || montantAffiche * 6.67).toLocaleString()} FCFA`} />
                                )}
                                <LigneDetail
                                    label={isReservation ? 'Acompte à payer (15%)' : 'Montant total'}
                                    value={`${montantAffiche.toLocaleString()} FCFA`}
                                    highlight
                                />
                            </div>

                            {isReservation && (
                                <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '12px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
                                    <span style={{ fontSize: '16px' }}>🔐</span>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: '1.5' }}>
                                        Votre acompte est <strong style={{ color: 'rgba(255,255,255,0.8)' }}>sécurisé en Escrow</strong>. Il ne sera libéré qu'après votre validation de la mission terminée.
                                    </p>
                                </div>
                            )}

                            <button onClick={() => setEtape(1)} style={{
                                width: '100%', padding: '15px',
                                background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                                border: 'none', borderRadius: '14px', color: 'white',
                                fontWeight: '800', fontSize: '15px', cursor: 'pointer',
                                boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
                                transition: 'all 0.2s', letterSpacing: '0.3px'
                            }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                Continuer →
                            </button>

                            <button onClick={() => navigate(-1)} style={{
                                width: '100%', padding: '12px', marginTop: '10px',
                                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '14px', color: 'rgba(255,255,255,0.4)',
                                fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                            >
                                ← Retour
                            </button>
                        </div>
                    )}

                    {/* ── ÉTAPE 1 : Méthode de paiement ── */}
                    {etape === 1 && (
                        <div style={{ padding: '28px' }}>
                            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>Méthode de paiement</h2>
                            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginBottom: '20px' }}>
                                Montant : <strong style={{ color: '#4ade80' }}>{montantAffiche.toLocaleString()} FCFA</strong>
                            </p>

                            {/* Choix méthode */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                                {[
                                    { id: 'mobile', icon: '📱', label: 'Mobile Money', sub: 'Orange · Moov · Wave' },
                                    { id: 'card', icon: '💳', label: 'Carte bancaire', sub: 'Visa · Mastercard' },
                                ].map(m => (
                                    <button key={m.id} onClick={() => setMethode(m.id)} style={{
                                        padding: '14px 12px', borderRadius: '14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                                        background: methode === m.id ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                                        outline: methode === m.id ? '2px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.08)',
                                        transition: 'all 0.2s'
                                    }}>
                                        <p style={{ fontSize: '20px', marginBottom: '4px' }}>{m.icon}</p>
                                        <p style={{ color: 'white', fontWeight: '700', fontSize: '13px', margin: 0 }}>{m.label}</p>
                                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>{m.sub}</p>
                                    </button>
                                ))}
                            </div>

                            {/* Champ téléphone si Mobile Money */}
                            {methode === 'mobile' && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                                        Numéro Mobile Money
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+227 XX XX XX XX"
                                        value={telephone}
                                        onChange={e => setTelephone(e.target.value)}
                                        style={{
                                            width: '100%', padding: '14px 16px', borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                                            color: 'white', fontSize: '15px', outline: 'none',
                                            boxSizing: 'border-box', fontFamily: 'inherit'
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                                    />
                                </div>
                            )}

                            {methode === 'card' && (
                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px', marginBottom: '20px', textAlign: 'center' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Vous serez redirigé vers le portail KkiaPay sécurisé.</p>
                                </div>
                            )}

                            <button onClick={lancerPaiement}
                                disabled={methode === 'mobile' && !telephone.trim()}
                                style={{
                                    width: '100%', padding: '15px',
                                    background: methode === 'mobile' && !telephone.trim()
                                        ? 'rgba(255,255,255,0.1)'
                                        : 'linear-gradient(135deg, #059669, #047857)',
                                    border: 'none', borderRadius: '14px', color: 'white',
                                    fontWeight: '800', fontSize: '15px', cursor: methode === 'mobile' && !telephone.trim() ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 8px 24px rgba(5,150,105,0.3)',
                                    transition: 'all 0.2s', letterSpacing: '0.5px'
                                }}
                                onMouseEnter={e => { if (!(methode === 'mobile' && !telephone.trim())) e.currentTarget.style.transform = 'scale(1.02)'; }}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                🔒 Payer {montantAffiche.toLocaleString()} FCFA
                            </button>

                            <button onClick={() => setEtape(0)} style={{
                                width: '100%', padding: '12px', marginTop: '10px',
                                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '14px', color: 'rgba(255,255,255,0.4)',
                                fontWeight: '600', fontSize: '14px', cursor: 'pointer'
                            }}>
                                ← Retour
                            </button>
                        </div>
                    )}

                    {/* ── ÉTAPE 2 : Traitement ── */}
                    {etape === 2 && (
                        <div style={{ padding: '48px 28px', textAlign: 'center' }}>
                            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                                <Spinner size={52} color="#7c3aed" />
                            </div>
                            <h3 style={{ color: 'white', fontWeight: '700', fontSize: '17px', marginBottom: '8px' }}>Traitement en cours...</h3>
                            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', lineHeight: '1.6' }}>
                                Connexion sécurisée au serveur de paiement.<br />
                                Ne fermez pas cette fenêtre.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '24px' }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i} style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: 'rgba(124,58,237,0.6)',
                                        animation: `pulse-green 1.4s ease-in-out ${i * 0.2}s infinite`
                                    }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── ÉTAPE 3 : Résultat ── */}
                    {etape === 3 && succes && (
                        <div style={{ padding: '40px 28px', textAlign: 'center' }}>
                            {/* Cercle animé succès */}
                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                                <div style={{
                                    width: '72px', height: '72px', borderRadius: '50%',
                                    background: 'rgba(74,222,128,0.15)', border: '2px solid rgba(74,222,128,0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    animation: 'pulse-green 2s ease-in-out infinite'
                                }}>
                                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                        <path d="M6 16l8 8 12-14" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                            strokeDasharray="100" strokeDashoffset="0"
                                            style={{ animation: 'checkDraw 0.5s ease 0.2s both' }} />
                                    </svg>
                                </div>
                            </div>

                            <h3 style={{ color: '#4ade80', fontWeight: '800', fontSize: '20px', marginBottom: '8px' }}>
                                Paiement réussi !
                            </h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '6px' }}>
                                {isReservation
                                    ? `Acompte de ${montantAffiche.toLocaleString()} FCFA sécurisé en Escrow`
                                    : `${montantAffiche.toLocaleString()} FCFA débité avec succès`
                                }
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginBottom: '28px' }}>
                                Référence : PAY-{commandeId}
                            </p>

                            {isReservation && (
                                <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '12px', padding: '12px', marginBottom: '20px', textAlign: 'left' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', lineHeight: '1.6' }}>
                                        ✅ Acompte bloqué en Escrow<br />
                                        🔔 Le prestataire a été notifié<br />
                                        💬 Vous pouvez maintenant discuter avec lui
                                    </p>
                                </div>
                            )}

                            <button onClick={() => navigate(isReservation ? '/dashboard-client' : '/dashboard-client')} style={{
                                width: '100%', padding: '14px',
                                background: 'linear-gradient(135deg, #059669, #047857)',
                                border: 'none', borderRadius: '14px', color: 'white',
                                fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                                boxShadow: '0 8px 24px rgba(5,150,105,0.3)'
                            }}>
                                Voir mon dashboard →
                            </button>
                        </div>
                    )}

                    {/* ── ÉTAPE 3 : Échec ── */}
                    {etape === 3 && !succes && (
                        <div style={{ padding: '40px 28px', textAlign: 'center' }}>
                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                                <div style={{
                                    width: '72px', height: '72px', borderRadius: '50%',
                                    background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.35)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px'
                                }}>❌</div>
                            </div>

                            <h3 style={{ color: '#f87171', fontWeight: '800', fontSize: '20px', marginBottom: '8px' }}>
                                Paiement échoué
                            </h3>
                            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginBottom: '24px', lineHeight: '1.6' }}>
                                {erreur || 'Une erreur est survenue lors du paiement.'}
                            </p>

                            <button onClick={() => { setEtape(1); setErreur(''); }} style={{
                                width: '100%', padding: '14px', marginBottom: '10px',
                                background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                                border: 'none', borderRadius: '14px', color: 'white',
                                fontWeight: '700', fontSize: '14px', cursor: 'pointer'
                            }}>
                                Réessayer
                            </button>
                            <button onClick={() => navigate(-1)} style={{
                                width: '100%', padding: '12px',
                                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '14px', color: 'rgba(255,255,255,0.4)',
                                fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                            }}>
                                Annuler
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Footer sécurité ── */}
                {etape < 2 && (
                    <div style={{ textAlign: 'center', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px' }}>🔒</span>
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>
                            Paiement sécurisé · Cryptage SSL · Powered by KkiaPay
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}