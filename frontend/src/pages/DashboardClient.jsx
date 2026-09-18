import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardClient, getBonInterventionParReservation, validerBonIntervention, getDevisReservation, accepterDevis, updateUser } from '../util/api';
import { STATUT, STATUT_FALLBACK, STATUTS_ACTIFS } from '../constants/statuts';
import BonInterventionPrint from '../components/BonInterventionPrint';
import KanariGeoMap from '../components/KanariGeoMap';

const API = import.meta.env.VITE_API_URL;

const BANNIERES_PUB = [
    { titre: "Astuce Entretien", texte: "Pensez à purger vos radiateurs et vérifier vos installations avant l'arrivée des saisons de forte sollicitation.", badge: "Conseil Pro", gradient: "from-blue-600/20 to-purple-600/20", border: "border-blue-500/30" },
    { titre: "Garantie Sérénité Kanari", texte: "Toutes nos interventions sont suivies et garanties. N'hésitez pas à laisser vos remarques pour améliorer notre service.", badge: "Offre & Sécurité", gradient: "from-purple-600/20 to-pink-600/20", border: "border-purple-500/30" },
    { titre: "Programme Fidélité", texte: "Plus vous utilisez Kanari Service, plus vous bénéficiez d'avantages exclusifs sur vos prochains dépannages !", badge: "Avantage", gradient: "from-emerald-600/20 to-teal-600/20", border: "border-emerald-500/30" },
];

function StatutBadge({ statut }) {
    const labels = {
        EN_ATTENTE: 'En attente', ASSIGNEE: 'Prestataire assigné', EN_VALIDATION_ADMIN: 'Validation',
        ACCEPTEE: 'Acceptée', EN_PREPARATION: 'Préparation', EN_COURS: 'En cours',
        TERMINEE: 'À valider', VALIDEE: 'Terminée', ANNULEE: 'Annulée'
    };
    const styles = {
        EN_ATTENTE: 'bg-amber-50 text-amber-700 border-amber-200',
        ASSIGNEE: 'bg-blue-50 text-blue-700 border-blue-200',
        EN_VALIDATION_ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        ACCEPTEE: 'bg-sky-50 text-sky-700 border-sky-200',
        EN_PREPARATION: 'bg-violet-50 text-violet-700 border-violet-200',
        EN_COURS: 'bg-orange-50 text-orange-700 border-orange-200',
        TERMINEE: 'bg-amber-50 text-amber-800 border-amber-200',
        VALIDEE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        ANNULEE: 'bg-red-50 text-red-700 border-red-200'
    };
    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${styles[statut] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {labels[statut] || statut || '—'}
        </span>
    );
}

function TypeBadge({ type }) {
    const labels = { classique: 'Classique', planifie: 'Planifiée', contrat: 'Contrat', candidature: 'Candidature' };
    return <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">{labels[type] || type || 'Demande'}</span>;
}

function StatCard({ label, value }) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500 block mb-2">{label}</span>
            <p className="text-3xl font-extrabold tracking-tight text-[#061a3a]">{value ?? '—'}</p>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// MODAL : MESSAGERIE (API réelle /api/messages)
// ════════════════════════════════════════════════════════════════
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-lg bg-[#061a3a] border border-purple-500/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden h-[550px]">
                <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center font-bold text-[#061a3a] shadow-md shadow-purple-500/20">
                            {mission.prestataire?.nomEntreprise?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm">{mission.prestataire?.nomEntreprise || mission.fournisseurNom || 'Prestataire'}</p>
                            <p className="text-purple-400/80 text-xs font-medium">Mission #{mission.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-500 hover:text-[#061a3a] transition-colors text-sm">×</button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
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
                                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${moi ? 'bg-amber-500 hover:bg-amber-600 text-[#061a3a] rounded-br-xs font-medium' : 'bg-white/[0.05] border border-slate-200 text-slate-700 rounded-bl-xs'}`}>
                                        <p>{msg.contenu}</p>
                                        <p className={`text-[10px] mt-1 text-right ${moi ? 'text-purple-200/70' : 'text-slate-500'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="p-4 bg-white border-t border-slate-200 flex gap-2.5">
                    <input
                        value={texte}
                        onChange={e => setTexte(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && envoyer()}
                        placeholder="Écrivez votre message ici..."
                        className="flex-1 bg-[#090D16] border border-white/[0.08] focus:border-purple-500 text-slate-700 placeholder-slate-500 rounded-2xl px-4 py-3 text-sm outline-none transition-all shadow-inner"
                    />
                    <button
                        onClick={envoyer}
                        disabled={!texte.trim() || sending}
                        className={`px-5 rounded-2xl text-sm font-bold flex items-center justify-center transition-all ${texte.trim() ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-[#061a3a] shadow-lg shadow-purple-500/25 active:scale-95' : 'bg-slate-50 text-slate-600 cursor-not-allowed'}`}>
                        {sending ? '...' : 'Envoyer'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// MODAL : REMARQUE (API réelle PUT /api/reservations/:id/remarque)
// ════════════════════════════════════════════════════════════════
function RemarqueModal({ mission, token, onClose, onSaved }) {
    const [remarque, setRemarque] = useState(mission.remarqueClient || '');
    const [loading, setLoading] = useState(false);

    const sauvegarder = async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/api/reservations/${mission.id}/remarque`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ remarque: remarque.trim() })
            });
            const d = await r.json();
            if (d.success) { onSaved(mission.id, remarque.trim()); onClose(); }
            else alert("Erreur lors de l'enregistrement de votre remarque.");
        } catch {
            alert("Erreur de connexion au serveur.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#061a3a] border border-purple-500/20 rounded-3xl shadow-2xl p-6 space-y-5">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-[#061a3a]">Appréciation & Remarques</h3>
                        <p className="text-xs text-purple-400">Mission #{mission.id} - {mission.service?.nom || mission.serviceNom}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-500 hover:text-[#061a3a] transition-colors text-sm">×</button>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500">Votre avis / note pour cette prestation :</label>
                    <textarea
                        rows={4}
                        value={remarque}
                        onChange={e => setRemarque(e.target.value)}
                        placeholder="Ex: Prestation impeccable, technicien très professionnel et ponctuel..."
                        className="w-full bg-[#090D16] border border-white/[0.08] focus:border-purple-500 text-slate-700 placeholder-slate-600 rounded-2xl p-4 text-sm outline-none transition-all shadow-inner resize-none"
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition-all">Annuler</button>
                    <button onClick={sauvegarder} disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-[#061a3a] font-bold rounded-xl text-xs shadow-lg transition-all">
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// MODAL : BON D'INTERVENTION À VALIDER (cœur de la liaison client/fournisseur)
//
// Branché sur les VRAIES routes déjà existantes côté backend :
//   GET  /api/bons-intervention/reservation/:id  → getBonInterventionParReservation
//   PUT  /api/bons-intervention/:id/valider      → validerBonIntervention(bonId, {note, commentaire})
//
// Important : validerBon() côté backend attend l'ID DU BON (bon.id),
// PAS l'ID de la réservation. Une note (1 à 5) est optionnelle mais,
// si fournie, met à jour automatiquement la moyenne du fournisseur
// (logique déjà gérée par le contrôleur — rien à recalculer ici).
//
// Cycle : le prestataire transmet un bon -> statut TERMINEE.
// Le client voit ICI le détail exact (description, montants) transmis
// par le prestataire, peut l'imprimer, noter la prestation, et doit
// cliquer "Valider" pour clôturer réellement la mission -> VALIDEE.
// ════════════════════════════════════════════════════════════════
function BonAValiderModal({ mission, token, onClose, onValide }) {
    const [bon, setBon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur] = useState('');
    const [validation, setValidation] = useState(false);
    const [note, setNote] = useState(0);
    const [commentaire, setCommentaire] = useState('');
    const printRef = useRef(null);

    useEffect(() => {
        let actif = true;
        (async () => {
            try {
                const d = await getBonInterventionParReservation(mission.id);
                if (!actif) return;
                if (d.success) setBon(d.data);
                else setErreur(d.message || "Impossible de récupérer le bon d'intervention.");
            } catch (err) {
                if (actif) setErreur(err?.message || "Erreur réseau lors de la récupération du bon d'intervention.");
            } finally {
                if (actif) setLoading(false);
            }
        })();
        return () => { actif = false; };
    }, [mission.id]);

    const valider = async () => {
        if (!bon?.id) return;
        if (!window.confirm("Confirmez-vous que les travaux ont bien été réalisés conformément à ce bon ? Cette action clôture définitivement la mission.")) return;
        setValidation(true);
        try {
            const d = await validerBonIntervention(bon.id, {
                note: note > 0 ? note : null,
                commentaire: commentaire.trim() || null,
            });
            if (d.success) { onValide(mission.id); onClose(); }
            else alert("Erreur : " + (d.message || "Action non autorisée"));
        } catch (err) {
            alert(err?.message || "Erreur de connexion au serveur");
        } finally {
            setValidation(false);
        }
    };

    const imprimer = () => window.print();

    const total = bon ? Number(bon.montantFinal ?? (Number(bon.montantMainOeuvre || 0) + Number(bon.montantPiecesOutils || 0))) : 0;
    const nomPrestataire = bon?.fournisseurBon?.nomEntreprise || mission.prestataire?.nomEntreprise || mission.fournisseurNom || 'Prestataire';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md print:bg-white">
            <div className="w-full max-w-lg bg-[#061a3a] border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h3 className="text-lg font-black text-[#061a3a] flex items-center gap-2">Bon d'intervention à valider</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-500 hover:text-[#061a3a] text-sm">×</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading && (
                        <div className="flex flex-col items-center py-10 space-y-3">
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-slate-500 text-sm">Chargement du bon d'intervention...</p>
                        </div>
                    )}

                    {!loading && erreur && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-300 text-sm text-center">
                            {erreur}
                        </div>
                    )}

                    {!loading && bon && (
                        <>
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
                                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Mission</p>
                                <p className="text-sm font-bold text-[#061a3a]">#{mission.id} — {mission.service?.nom || mission.serviceNom}</p>
                                <p className="text-xs text-slate-500">{nomPrestataire}</p>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Travaux effectués</p>
                                <p className="text-sm text-slate-700 leading-relaxed">{bon.descriptionTravail}</p>
                            </div>

                            {bon.piecesOutils && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Pièces / matériel utilisés</p>
                                    <p className="text-sm text-slate-700">{bon.piecesOutils}</p>
                                </div>
                            )}

                            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-slate-500">Main d'œuvre</span><span className="font-mono font-bold text-[#061a3a]">{Number(bon.montantMainOeuvre || 0).toLocaleString('fr-FR')} FCFA</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Pièces / matériel</span><span className="font-mono font-bold text-[#061a3a]">{Number(bon.montantPiecesOutils || 0).toLocaleString('fr-FR')} FCFA</span></div>
                                <div className="flex justify-between pt-2 border-t border-slate-200"><span className="font-black text-emerald-400">Total à régler</span><span className="font-mono font-black text-emerald-400 text-base">{total.toLocaleString('fr-FR')} FCFA</span></div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Noter la prestation (optionnel)</p>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setNote(n === note ? 0 : n)}
                                            className={`w-9 h-9 rounded-lg text-sm font-bold border transition-all ${n <= note ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'bg-white/[0.03] border-white/[0.08] text-slate-500 hover:border-white/20'}`}
                                        >{n}</button>
                                    ))}
                                </div>
                                <textarea
                                    rows={2}
                                    value={commentaire}
                                    onChange={e => setCommentaire(e.target.value)}
                                    placeholder="Un commentaire sur la prestation (optionnel)..."
                                    className="w-full bg-[#090D16] border border-white/[0.08] focus:border-emerald-500 text-slate-700 placeholder-slate-600 rounded-xl p-3 text-sm outline-none resize-none"
                                />
                            </div>

                            <p className="text-xs text-slate-500 leading-relaxed">
                                En validant, vous confirmez que les travaux ci-dessus ont bien été réalisés. La mission passera au statut "Clôturée & Validée" et ne pourra plus être modifiée.
                            </p>
                        </>
                    )}
                </div>

                {!loading && bon && (
                    <div className="p-4 border-t border-slate-200 flex gap-3">
                        <button onClick={imprimer} className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition-all">
                            Imprimer
                        </button>
                        <button onClick={valider} disabled={validation} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-all disabled:opacity-50">
                            {validation ? 'Validation...' : 'Valider la prestation'}
                        </button>
                    </div>
                )}
            </div>

            {bon && (
                <BonInterventionPrint
                    ref={printRef}
                    type="bon"
                    numero={`BI-${mission.id}`}
                    mission={mission}
                    client={mission.client}
                    prestataire={{ nomEntreprise: nomPrestataire, telephone: bon?.fournisseurBon?.telephone }}
                    description={bon.descriptionTravail}
                    dateDocument={bon.createdAt}
                    lignes={[
                        { label: "Main d'œuvre", montant: bon.montantMainOeuvre },
                        { label: bon.piecesOutils || 'Pièces / matériel', montant: bon.montantPiecesOutils },
                    ]}
                />
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// ONGLET : OFFRES REÇUES — devis de plusieurs prestataires sur une
// même demande en attente. Backend déjà existant (routes/devis.js),
// il ne manquait que cet écran côté client.
// ════════════════════════════════════════════════════════════════
function CarteDevisReservation({ mission, token, onAccepte }) {
    const [devisListe, setDevisListe] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acceptation, setAcceptation] = useState(null);

    useEffect(() => {
        let actif = true;
        (async () => {
            try {
                const d = await getDevisReservation(mission.id);
                if (actif && d.success) setDevisListe(d.data || []);
            } catch { } finally {
                if (actif) setLoading(false);
            }
        })();
        return () => { actif = false; };
    }, [mission.id]);

    const accepter = async (devisId) => {
        if (!window.confirm("Confirmer ce prestataire pour votre mission ? Les autres devis seront automatiquement refusés.")) return;
        setAcceptation(devisId);
        try {
            const d = await accepterDevis(devisId);
            if (d.success) onAccepte(mission.id);
            else alert(d.message || "Erreur lors de l'acceptation.");
        } catch (err) {
            alert(err.message || 'Erreur de connexion au serveur.');
        } finally {
            setAcceptation(null);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 text-left">
            <div>
                <span className="text-xs font-bold text-purple-400">Mission #{mission.id}</span>
                <h4 className="font-extrabold text-[#061a3a] text-lg mt-0.5">{mission.serviceNom || mission.service?.nom || 'Service'}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{mission.adresse}</p>
            </div>

            {loading ? (
                <p className="text-sm text-slate-500 animate-pulse">Chargement des offres...</p>
            ) : devisListe.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune offre reçue pour le moment. Les prestataires de votre secteur ont été notifiés.</p>
            ) : (
                <div className="space-y-3">
                    {devisListe.map(devis => (
                        <div key={devis.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div>
                                <p className="text-sm font-bold text-[#061a3a]">{devis.fournisseurDevis?.nomEntreprise || 'Prestataire'}</p>
                                {Number(devis.fournisseurDevis?.note) > 0 && (
                                    <p className="text-xs text-amber-400">{Number(devis.fournisseurDevis.note).toFixed(1)} / 5</p>
                                )}
                                {devis.description && <p className="text-xs text-slate-500 mt-1">{devis.description}</p>}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-base font-black text-emerald-400">{Number(devis.montant).toLocaleString()} FCFA</span>
                                <button
                                    onClick={() => accepter(devis.id)}
                                    disabled={acceptation === devis.id}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-[#061a3a] rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                >
                                    {acceptation === devis.id ? 'Confirmation...' : 'Accepter cette offre'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function OngletOffresRecues({ missions, token, onDevisAccepte }) {
    const missionsEnAttente = missions.filter(m => m.statut === 'EN_ATTENTE' && !m.fournisseurId);

    if (missionsEnAttente.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2 shadow-sm">
                <p className="text-slate-500 text-sm">Aucune demande en attente d'offre pour le moment.</p>
                <p className="text-slate-600 text-xs">Dès qu'une demande sans prestataire assigné reçoit des propositions, elles apparaissent ici.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 text-left">
            {missionsEnAttente.map(m => (
                <CarteDevisReservation key={m.id} mission={m} token={token} onAccepte={onDevisAccepte} />
            ))}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════
// ONGLET : MES REÇUS — réutilise le même document imprimable que le
// bon d'intervention (BonInterventionPrint) pour chaque mission
// clôturée. Pas de système séparé à maintenir : le bon d'intervention
// validé EST le reçu de la prestation.
// ════════════════════════════════════════════════════════════════
function CarteRecu({ mission, token }) {
    const [bon, setBon] = useState(null);
    const [loading, setLoading] = useState(false);
    const printRef = useRef(null);

    const chargerEtImprimer = async () => {
        setLoading(true);
        try {
            const d = await getBonInterventionParReservation(mission.id);
            if (d.success) {
                setBon(d.data);
                setTimeout(() => window.print(), 150);
            } else {
                alert(d.message || 'Reçu introuvable pour cette mission.');
            }
        } catch (err) {
            alert(err.message || 'Erreur de connexion au serveur.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-left">
            <div>
                <span className="text-xs font-bold text-purple-400">Mission #{mission.id}</span>
                <p className="text-[#061a3a] font-bold text-sm mt-0.5">{mission.serviceNom || mission.service?.nom || 'Service'}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                    {mission.prestataire?.nomEntreprise || 'Prestataire'} · {Number(mission.montantTotal || 0).toLocaleString()} FCFA
                </p>
            </div>
            <button
                onClick={chargerEtImprimer}
                disabled={loading}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-white/[0.08] transition-all disabled:opacity-50 shrink-0"
            >
                {loading ? 'Chargement...' : 'Voir / Imprimer le reçu'}
            </button>

            {bon && (
                <BonInterventionPrint
                    ref={printRef}
                    type="bon"
                    numero={`BI-${mission.id}`}
                    mission={mission}
                    client={mission.client}
                    prestataire={{ nomEntreprise: bon.fournisseurBon?.nomEntreprise || mission.prestataire?.nomEntreprise, telephone: bon.fournisseurBon?.telephone }}
                    description={bon.descriptionTravail}
                    dateDocument={bon.valideLe || bon.createdAt}
                    lignes={[
                        { label: "Main d'œuvre", montant: bon.montantMainOeuvre },
                        { label: bon.piecesOutils || 'Pièces / matériel', montant: bon.montantPiecesOutils },
                    ]}
                />
            )}
        </div>
    );
}

function OngletRecus({ missions, token }) {
    const missionsValidees = missions.filter(m => m.statut === 'VALIDEE');

    if (missionsValidees.length === 0) {
        return (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2 shadow-sm">
                <p className="text-slate-500 text-sm">Aucun reçu disponible pour le moment.</p>
                <p className="text-slate-600 text-xs">Le reçu d'une mission apparaît ici une fois la prestation validée.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 text-left">
            {missionsValidees.map(m => <CarteRecu key={m.id} mission={m} token={token} />)}
        </div>
    );
}

/// ════════════════════════════════════════════════════════════════
// ONGLET : MON PROFIL — réellement modifiable, branché sur
// PUT /api/users/:id (backend/routes/users.js).
// ════════════════════════════════════════════════════════════════
function OngletProfilClient({ currentUser = {}, onProfilMisAJour }) {
    const [form, setForm] = useState({
        nom: currentUser?.nom || '',
        prenom: currentUser?.prenom || '',
        email: currentUser?.email || '',
        telephone: currentUser?.telephone || '',
        ville: currentUser?.ville || '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const champ = (id) => (e) => setForm(p => ({ ...p, [id]: e.target.value }));

    const enregistrer = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        if (!form.nom.trim() || !form.telephone.trim()) {
            setMessage({ text: 'Le nom et le téléphone sont obligatoires.', type: 'error' });
            return;
        }
        setLoading(true);
        try {
            const d = await updateUser(currentUser.id, {
                nom: form.nom.trim(),
                prenom: form.prenom.trim() || null,
                email: form.email.trim() || null,
                telephone: form.telephone.trim(),
                ville: form.ville.trim() || null,
            });
            if (d?.success) {
                onProfilMisAJour(d.data);
                setMessage({ text: 'Profil mis à jour avec succès.', type: 'success' });
            } else {
                setMessage({ text: d?.message || 'Erreur lors de la mise à jour.', type: 'error' });
            }
        } catch (err) {
            setMessage({ text: err?.message || 'Erreur de connexion au serveur.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={enregistrer} className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 text-left max-w-xl">
            <h3 className="font-extrabold text-xl text-[#061a3a]">Mon Profil Client</h3>

            {message.text && (
                <div className={`p-3.5 rounded-xl text-xs font-semibold border ${message.type === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Nom *</label>
                    <input value={form.nom} onChange={champ('nom')} className="w-full bg-[#090D16] border border-white/[0.08] focus:border-purple-500 text-slate-700 rounded-xl p-3 text-sm outline-none transition-all" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Prénom</label>
                    <input value={form.prenom} onChange={champ('prenom')} className="w-full bg-[#090D16] border border-white/[0.08] focus:border-purple-500 text-slate-700 rounded-xl p-3 text-sm outline-none transition-all" />
                </div>
            </div>

            <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Adresse e-mail</label>
                <input type="email" value={form.email} onChange={champ('email')} className="w-full bg-[#090D16] border border-white/[0.08] focus:border-purple-500 text-slate-700 rounded-xl p-3 text-sm outline-none transition-all" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Téléphone *</label>
                    <input value={form.telephone} onChange={champ('telephone')} className="w-full bg-[#090D16] border border-white/[0.08] focus:border-purple-500 text-slate-700 rounded-xl p-3 text-sm outline-none transition-all" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Ville</label>
                    <input value={form.ville} onChange={champ('ville')} className="w-full bg-[#090D16] border border-white/[0.08] focus:border-purple-500 text-slate-700 rounded-xl p-3 text-sm outline-none transition-all" />
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-[#061a3a] font-bold rounded-xl text-sm shadow-lg transition-all disabled:opacity-50">
                {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
        </form>
    );
}

// ════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════
export default function DashboardClient() {
    const navigate = useNavigate();
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chatMission, setChatMission] = useState(null);
    const [remarqueMission, setRemarqueMission] = useState(null);
    const [bonMission, setBonMission] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [menuOuvert, setMenuOuvert] = useState(false);

    const pubAleatoire = useMemo(() => BANNIERES_PUB[Math.floor(Math.random() * BANNIERES_PUB.length)], []);
    const token = useMemo(() => localStorage.getItem('token'), []);

    const [currentUser, setCurrentUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
    });

    const handleProfilMisAJour = (userMisAJour) => {
        setCurrentUser(prev => {
            const fusionne = { ...prev, ...userMisAJour };
            try { localStorage.setItem('user', JSON.stringify(fusionne)); } catch { }
            return fusionne;
        });
    };

    const handleRemarqueSaved = (missionId, nouvelleRemarque) => {
        setMissions(prev => prev.map(m => m.id === missionId ? { ...m, remarqueClient: nouvelleRemarque } : m));
    };

    const handleBonValide = () => {
        setBonMission(null);
        setTimeout(() => chargerDashboard(true), 0);
    };

    const chargerDashboard = async (silencieux = false) => {
        if (!token) { navigate('/login'); return; }
        if (!silencieux) setLoading(true);
        try {
            const res = await getDashboardClient();
            if (res?.success) {
                setMissions(Array.isArray(res.data?.missions) ? res.data.missions : []);
                setError(null);
            } else {
                throw new Error(res?.message || 'Réponse invalide du serveur.');
            }
        } catch (err) {
            console.error('Erreur dashboard client:', err);
            if (!silencieux) setError(err?.message || 'Impossible de charger vos réservations.');
        } finally {
            if (!silencieux) setLoading(false);
        }
    };

    useEffect(() => {
        chargerDashboard(false);
        const interval = setInterval(() => chargerDashboard(true), 8000);
        const onFocus = () => chargerDashboard(true);
        window.addEventListener('focus', onFocus);
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
        };
    }, [token, navigate]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 text-[#061a3a]">
            <div className="text-center space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-2 border-amber-200 animate-ping" />
                    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
                <p className="text-slate-500 font-medium tracking-wide text-sm animate-pulse">
                    Synchronisation de votre espace client…
                </p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
            <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md text-center space-y-4 shadow-sm">
                <p className="text-red-700 font-bold text-lg">{error}</p>
                <button onClick={() => chargerDashboard(false)} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-[#061a3a] rounded-xl text-xs font-bold transition-all">Réessayer</button>
            </div>
        </div>
    );

    const missionsList = Array.isArray(missions) ? missions : [];
    const missionsActives = missionsList.filter(m => STATUTS_ACTIFS?.includes(m?.statut));
    const missionsAValider = missionsList.filter(m => m?.statut === 'TERMINEE');
    const missionsTerminees = missionsList.filter(m => m?.statut === 'VALIDEE');
    const missionsEnAttenteOffres = missionsList.filter(m => m?.statut === 'EN_ATTENTE' && !m?.fournisseurId);
    
    // ✅ Utilisation cohérente de montantTotal pour les réservations
    const toutesTransactions = missionsList.filter(m => Number(m?.montantTotal || m?.montant || 0) > 0);
    const totalDepense = toutesTransactions.filter(m => m?.statutPaiement === 'paye').reduce((acc, m) => acc + Number(m?.montantTotal || m?.montant || 0), 0);

    const tabs = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: '' },
        { id: 'missions', label: 'Mes Réservations', icon: '', badge: missionsActives.length + missionsAValider.length },
        { id: 'offres', label: 'Offres reçues', icon: '', badge: missionsEnAttenteOffres.length },
        { id: 'recus', label: 'Mes Reçus', icon: '', badge: missionsTerminees.length },
        { id: 'paiements', label: 'Paiements & Transactions', icon: '', badge: toutesTransactions.length },
        { id: 'profil', label: 'Mon Profil', icon: '' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans print:bg-white">
            <div className="hidden" />
            <div className="hidden" />

            <aside className="hidden md:flex w-64 bg-[#061a3a] p-5 flex-col gap-4 border-r border-slate-200 z-20 shadow-lg text-left print:hidden">
                <div className="flex items-center gap-3 px-2 pt-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <span className="font-black text-white text-base">K</span>
                    </div>
                    <div>
                        <h2 className="font-extrabold text-base tracking-tight text-white leading-none">Kanari Service</h2>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">Espace Client</span>
                    </div>
                </div>
                <button onClick={() => navigate('/')} className="mt-2 w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-[#061a3a] text-xs font-black transition-all shadow-md">
                    + Nouvelle demande
                </button>
                <nav className="flex flex-col gap-1.5 flex-1 mt-2">
                    <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Navigation</span>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} className={`text-left px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === t.id ? 'bg-amber-50 border border-amber-200 text-[#061a3a] shadow-sm' : 'hover:bg-slate-50 text-slate-600 hover:text-[#061a3a] border border-transparent'}`}>
                            <div className="flex items-center gap-3 text-left">
                                <span>{t.label}</span>
                            </div>
                            {t.badge > 0 && <span className="bg-amber-500 text-[#061a3a] text-[10px] px-2 py-0.5 rounded-full font-black">{t.badge}</span>}
                        </button>
                    ))}
                    <button onClick={() => navigate('/historique-paiements')} className="text-left px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group hover:bg-white/[0.03] text-slate-500 hover:text-slate-700 border border-transparent">
                        <div className="flex items-center gap-3 text-left"><span>Historique Paiements</span></div>
                    </button>
                </nav>
            </aside>

            <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-[#061a3a] backdrop-blur-lg border-b border-slate-200 z-30 px-4 flex justify-between items-center print:hidden">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-500 text-xs">K</div>
                    <span className="font-extrabold text-sm tracking-tight text-white">Kanari — Client</span>
                </div>
                <button onClick={() => setMenuOuvert(!menuOuvert)} className="px-3 py-1.5 rounded-xl bg-white/10 text-white font-bold text-xs">{menuOuvert ? 'Fermer' : 'Menu'}</button>
            </div>

            {menuOuvert && (
                <div className="md:hidden fixed inset-x-0 top-14 bottom-0 z-40 bg-[#061a3a] backdrop-blur-2xl border-b border-slate-200 p-6 space-y-2 overflow-y-auto print:hidden">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 text-left">Menu Principal</p>
                    <button onClick={() => { navigate('/'); setMenuOuvert(false); }} className="w-full text-left px-4 py-3.5 rounded-2xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-[#061a3a] shadow-lg mb-2">
                        + Nouvelle demande
                    </button>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => { setActiveTab(t.id); setMenuOuvert(false); }} className={`w-full text-left px-4 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-between ${activeTab === t.id ? 'bg-amber-500 hover:bg-amber-600 text-[#061a3a] shadow-lg' : 'text-slate-600 bg-white'}`}>
                            <div className="flex items-center gap-3"><span>{t.label}</span></div>
                            {t.badge > 0 && <span className="bg-amber-500 text-[#061a3a] text-xs px-2.5 py-0.5 rounded-full font-black">{t.badge}</span>}
                        </button>
                    ))}
                    <button onClick={() => { navigate('/historique-paiements'); setMenuOuvert(false); }} className="w-full text-left px-4 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-3 text-slate-600 bg-white">
                        <span>Historique Paiements</span>
                    </button>
                </div>
            )}

            <main className="flex-1 p-6 md:p-10 overflow-y-auto mt-14 md:mt-0 max-w-6xl mx-auto z-10 space-y-8 print:hidden">
                <header className="hidden md:flex items-center justify-between pb-4 border-b border-slate-200">
                    <div className="text-left">
                        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Espace Client</span>
                        <h1 className="text-2xl font-black text-[#061a3a] mt-0.5">{tabs.find(t => t.id === activeTab)?.label}</h1>
                    </div>
                </header>

                {missionsAValider.length > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            <p className="text-sm font-bold text-emerald-300">
                                {missionsAValider.length} intervention{missionsAValider.length > 1 ? 's' : ''} terminée{missionsAValider.length > 1 ? 's' : ''} en attente de votre validation.
                            </p>
                        </div>
                        <button onClick={() => setBonMission(missionsAValider[0])} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shrink-0">
                            Voir le bon & valider
                        </button>
                    </div>
                )}

                {pubAleatoire && (
                    <div className={`bg-gradient-to-r ${pubAleatoire.gradient} border ${pubAleatoire.border} rounded-3xl p-5 md:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left`}>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#061a3a] font-bold text-[10px] tracking-wider uppercase">{pubAleatoire.badge}</span>
                                <h4 className="font-extrabold text-[#061a3a] text-base">{pubAleatoire.titre}</h4>
                            </div>
                            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">{pubAleatoire.texte}</p>
                        </div>
                        <button onClick={() => navigate('/historique-paiements')} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-500 text-xs font-bold transition-all border border-white/10 shrink-0">
                            Voir mes paiements 
                        </button>
                    </div>
                )}

                {activeTab === 'overview' && (
                    <div className="space-y-8 text-left">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <StatCard label="Demandes en cours" value={missionsActives.length} gradient="from-purple-500 to-indigo-500" />
                            <StatCard label="Interventions validées" value={missionsTerminees.length} gradient="from-emerald-500 to-teal-500" />
                            <StatCard label="Total dépensé" value={`${totalDepense.toLocaleString()} FCFA`} gradient="from-blue-500 to-cyan-500" />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-extrabold text-lg text-[#061a3a]">Dernières missions en cours</h3>
                                <button onClick={() => setActiveTab('missions')} className="text-xs text-purple-400 hover:underline font-bold">Voir tout ({missionsList.length})</button>
                            </div>
                            {missionsActives.length === 0 ? (
                                <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3">
                                    <p className="text-slate-500 text-sm">Aucune mission active pour le moment.</p>
                                    <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-[#061a3a] rounded-xl text-xs font-bold">Créer une demande</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {missionsActives.slice(0, 2).map(m => (
                                        <div key={m?.id} className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-purple-400">Mission #{m?.id}</span>
                                                    <span>•</span>
                                                    <span className="text-xs text-slate-500">{m?.service?.nom || m?.serviceNom || 'Service'}</span>
                                                </div>
                                                <h4 className="font-extrabold text-[#061a3a] text-lg">{m?.prestataire?.nomEntreprise || 'Recherche de prestataire...'}</h4>
                                                {m?.statut === 'EN_COURS' && (m?.latitude || m?.latitudeClient || m?.prestataire?.latitude) && (
                                                    <div className="mt-4 w-full sm:max-w-xl">
                                                        <KanariGeoMap
                                                            clientPosition={{ latitude: m?.latitudeClient ?? m?.latitude, longitude: m?.longitudeClient ?? m?.longitude }}
                                                            providerPosition={{ latitude: m?.prestataire?.latitude ?? m?.fournisseurLatitude, longitude: m?.prestataire?.longitude ?? m?.fournisseurLongitude }}
                                                            providerName={m?.prestataire?.nomEntreprise || 'Prestataire'}
                                                            missionStatus={m?.statut}
                                                            height={260}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <StatutBadge statut={m?.statut} />
                                                <button onClick={() => setChatMission(m)} className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold text-xs rounded-xl border border-purple-500/20">Chat</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'missions' && (
                    <div className="space-y-6 text-left">
                        <div className="flex justify-between items-center">
                            <h3 className="font-extrabold text-xl text-[#061a3a]">Toutes mes réservations</h3>
                            <button onClick={() => navigate('/')} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-[#061a3a] rounded-xl text-xs font-bold">+ Nouvelle demande</button>
                        </div>
                        {missionsList.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                                <p className="text-slate-500 text-sm">Vous n'avez pas encore effectué de réservation.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {missionsList.map(m => (
                                    <div key={m?.id} className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-xs font-bold text-purple-400">#{m?.id} - {m?.service?.nom || m?.serviceNom || 'Service'}</span>
                                                <h4 className="font-extrabold text-[#061a3a] text-lg mt-0.5">{m?.prestataire?.nomEntreprise || 'Prestataire en attente'}</h4>
                                            </div>
                                            <StatutBadge statut={m?.statut} />
                                        </div>

                                        {m?.statut === 'TERMINEE' && (
                                            <button onClick={() => setBonMission(m)} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-all">
                                                Voir le bon d'intervention & valider
                                            </button>
                                        )}

                                        <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-200">
                                            <span>Montant : <strong className="text-[#061a3a]">{Number(m?.montantTotal || m?.montant || m?.montantMainOeuvre || 0).toLocaleString()} FCFA</strong></span>
                                            <div className="flex items-center gap-4">
                                                {m?.statut === 'VALIDEE' && (
                                                    <button onClick={() => setRemarqueMission(m)} className="text-amber-400 font-bold hover:underline">Laisser un avis</button>
                                                )}
                                                {m?.statut && !['EN_ATTENTE', 'ANNULEE'].includes(m?.statut) && (
                                                    <button onClick={() => setChatMission(m)} className="text-purple-400 font-bold hover:underline">Ouvrir le chat</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'offres' && (
                    <OngletOffresRecues
                        missions={missionsList}
                        token={token}
                        onDevisAccepte={() => chargerDashboard(true)}
                    />
                )}

                {activeTab === 'recus' && (
                    <OngletRecus missions={missionsList} token={token} />
                )}

                {activeTab === 'paiements' && (
                    <div className="space-y-6 text-left">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-extrabold text-xl text-[#061a3a]">Paiements & Transactions</h3>
                                <p className="text-xs text-slate-500 mt-1">Historique complet de vos règlements de services.</p>
                            </div>
                            <button onClick={() => navigate('/historique-paiements')} className="px-4 py-2 bg-amber-500 hover:bg-indigo-500 text-[#061a3a] rounded-xl text-xs font-bold transition">
                                Voir la page dédiée 
                            </button>
                        </div>

                        {toutesTransactions.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                                <p className="text-slate-500 text-sm">Aucune transaction enregistrée pour l'instant.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {toutesTransactions.map(t => (
                                    <div key={t?.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex justify-between items-center">
                                        <div>
                                            <span className="text-xs font-bold text-indigo-400">Transaction liée à la réservation #{t?.id}</span>
                                            <p className="text-[#061a3a] font-bold text-sm mt-0.5">{t?.service?.nom || t?.serviceNom || 'Prestation'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[#061a3a] font-mono font-extrabold">{Number(t?.montantTotal || t?.montant || t?.montantMainOeuvre || 0).toLocaleString()} FCFA</p>
                                            <span className={`text-[10px] font-bold uppercase ${t?.statutPaiement === 'paye' ? 'text-emerald-600' : t?.statutPaiement === 'echoue' ? 'text-red-600' : 'text-amber-600'}`}>{t?.statutPaiement === 'paye' ? 'Réglé' : t?.statutPaiement === 'echoue' ? 'Échec' : t?.statutPaiement === 'en_attente' ? 'En attente' : 'Non payé'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'profil' && (
                    <OngletProfilClient currentUser={currentUser} onProfilMisAJour={handleProfilMisAJour} />
                )}
            </main>

            {chatMission && <ChatModal mission={chatMission} userId={currentUser?.id} token={token} onClose={() => setChatMission(null)} />}
            {remarqueMission && <RemarqueModal mission={remarqueMission} token={token} onClose={() => setRemarqueMission(null)} onSaved={handleRemarqueSaved} />}
            {bonMission && <BonAValiderModal mission={bonMission} token={token} onClose={() => setBonMission(null)} onValide={handleBonValide} />}
        </div>
    );
}