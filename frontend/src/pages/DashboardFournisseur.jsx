import React, { useEffect, useState, useRef } from 'react';
import { getDashboardFournisseur, getProduitsFournisseur, deleteProduit } from '../util/api';
import SoldeRetrait from '../components/SoldeRetrait';

const API = import.meta.env.VITE_API_URL;

const STATUT = {
    EN_ATTENTE: { label: 'En attente', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' },
    ACCEPTEE: { label: 'Acceptée', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-400 shadow-[0_0_8px_#60a5fa]' },
    EN_PREPARATION: { label: 'Préparation', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-400 shadow-[0_0_8px_#fb923c]' },
    EN_COURS: { label: 'En cours', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-400 shadow-[0_0_8px_#c084fc]' },
    TERMINEE: { label: 'Terminée', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400 shadow-[0_0_8px_#34d399]' },
    VALIDEE: { label: 'Validée ✅', bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
    ANNULEE: { label: 'Annulée', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-400 shadow-[0_0_8px_#fb7185]' },
};

const BADGE_PROFIL = {
    EN_ATTENTE: { label: '⏳ En attente de validation', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    EN_EVALUATION: { label: "🔍 En cours d'évaluation", bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    CONFORME: { label: '🛡️ Garanti Kanari Service', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    SUSPENDU: { label: '🚫 Compte suspendu', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
};

function StatutBadge({ statut }) {
    const s = STATUT[statut] || STATUT.EN_ATTENTE;
    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${s.bg} ${s.text} ${s.border} backdrop-blur-md shadow-sm transition-all`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-lg bg-[#0E1320] border border-purple-500/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden h-[550px]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/[0.07]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-purple-500/20">
                            {mission.client?.nom?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div>
                            <p className="font-bold text-slate-100 text-sm">{mission.client?.nom || mission.clientNom || 'Client'}</p>
                            <p className="text-purple-400/80 text-xs font-medium">Mission #{mission.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-slate-400 hover:text-white transition-colors text-sm">✕</button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
                    {init ? (
                        <div className="flex justify-center items-center h-full"><p className="text-slate-500 text-sm animate-pulse">Chargement de la conversation...</p></div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                            <span className="text-4xl">💬</span>
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

                {/* Footer */}
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
                        {sending ? '⏳' : 'Envoyer'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function OngletDevis({ token }) {
    const [reservations, setReservations] = useState([]);
    const [mesDevis, setMesDevis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState('disponibles');
    const [montant, setMontant] = useState({});
    const [description, setDescription] = useState({});
    const [sending, setSending] = useState(null);
    const [photos, setPhotos] = useState({});
    const [uploadLoading, setUploadLoading] = useState(null);

    const charger = async () => {
        try {
            const [r1, r2] = await Promise.all([
                fetch(`${API}/api/reservations/disponibles`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
                fetch(`${API}/api/devis/mes-devis`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            ]);
            if (r1.success) setReservations(r1.data || []);
            if (r2.success) setMesDevis(r2.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { charger(); }, []);

    const envoyerDevis = async (reservationId) => {
        if (!montant[reservationId]) { alert('Entrez un montant'); return; }
        setSending(reservationId);
        try {
            const r = await fetch(`${API}/api/devis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reservationId, montant: montant[reservationId], description: description[reservationId] || '' })
            }).then(r => r.json());
            if (r.success) { alert('✅ Devis envoyé !'); charger(); }
            else alert('❌ ' + r.message);
        } catch { alert('❌ Erreur serveur'); }
        finally { setSending(null); }
    };

    const envoyerPhotos = async (missionId, type) => {
        const file = photos[`${missionId}_${type}`];
        if (!file) { alert('Choisissez une photo'); return; }
        setUploadLoading(`${missionId}_${type}`);
        const fd = new FormData();
        fd.append(type, file);
        try {
            const r = await fetch(`${API}/api/missions/${missionId}/photos`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd
            }).then(r => r.json());
            if (r.success) alert('✅ Photo envoyée !');
            else alert('❌ ' + r.message);
        } catch { alert('❌ Erreur'); }
        finally { setUploadLoading(null); }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm animate-pulse">Recherche des opportunités...</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.01] p-2 rounded-2xl border border-white/[0.05]">
                <div className="flex gap-1 p-1 bg-[#070A12] rounded-xl border border-white/[0.05]">
                    {[['disponibles', '🔔 Demandes disponibles'], ['mesdevis', '📋 Mes devis envoyés']].map(([id, label]) => (
                        <button 
                            key={id} 
                            onClick={() => setActiveSubTab(id)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeSubTab === id ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'}`}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {activeSubTab === 'disponibles' && (
                <div className="space-y-4">
                    {reservations.length === 0 ? (
                        <div className="text-center py-16 bg-white/[0.01] border border-white/[0.05] rounded-3xl text-slate-500 space-y-3">
                            <p className="text-4xl">📭</p>
                            <p className="text-sm font-medium">Aucune nouvelle demande d'intervention dans votre secteur.</p>
                        </div>
                    ) : reservations.map(res => {
                        const dejaEnvoye = mesDevis.some(d => d.reservationDevis?.id === res.id);
                        return (
                            <div key={res.id} className="bg-white/[0.02] hover:bg-white/[0.03] border border-white/[0.07] hover:border-purple-500/30 rounded-3xl p-6 space-y-5 transition-all shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 bottom-0 w-1 bg-purple-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="flex justify-between items-start flex-wrap gap-3 pl-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Demande #{res.id}</span>
                                            <span className="text-slate-600">•</span>
                                            <span className="text-xs text-slate-400">{res.serviceNom}</span>
                                        </div>
                                        <h3 className="font-extrabold text-xl text-white mt-1">{res.clientNom || 'Client anonyme'}</h3>
                                    </div>
                                    <StatutBadge statut={res.statut} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        ['📍 Lieu', res.adresseIntervention || res.adresse],
                                        ['📅 Date ciblée', res.dateSouhaitee ? new Date(res.dateSouhaitee).toLocaleDateString('fr-FR') : 'Dès que possible'],
                                        ['📞 Contact', res.telephone],
                                    ].map(([label, val]) => val ? (
                                        <div key={label} className="bg-[#070A12]/60 rounded-2xl p-3.5 border border-white/[0.04]">
                                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">{label}</p>
                                            <p className="text-slate-200 text-sm font-semibold truncate">{val}</p>
                                        </div>
                                    ) : null)}
                                </div>

                                {(res.description || res.besoin) && (
                                    <div className="bg-purple-950/10 rounded-2xl p-4 border border-purple-500/15">
                                        <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">Détail du besoin</span>
                                        <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">{res.description || res.besoin}</p>
                                    </div>
                                )}

                                {dejaEnvoye ? (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                        <p className="text-emerald-300 font-bold text-xs tracking-wide uppercase">Devis transmis avec succès</p>
                                    </div>
                                ) : (
                                    <div className="bg-[#070A12]/80 rounded-2xl p-5 border border-white/[0.05] space-y-4">
                                        <span className="text-slate-300 text-xs font-bold uppercase tracking-wider">Formuler une offre</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <input
                                                type="number"
                                                placeholder="Prix proposé (FCFA) *"
                                                value={montant[res.id] || ''}
                                                onChange={e => setMontant(p => ({ ...p, [res.id]: e.target.value }))}
                                                className="bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm outline-none font-bold"
                                            />
                                            <textarea
                                                placeholder="Précisions sur l'intervention..."
                                                value={description[res.id] || ''}
                                                onChange={e => setDescription(p => ({ ...p, [res.id]: e.target.value }))}
                                                className="sm:col-span-2 bg-white/[0.03] border border-white/[0.08] focus:border-purple-500 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm outline-none resize-none h-11"
                                            />
                                        </div>
                                        <button
                                            onClick={() => envoyerDevis(res.id)}
                                            disabled={sending === res.id}
                                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 transition-all active:scale-[0.99] disabled:opacity-50">
                                            {sending === res.id ? 'Transmission en cours...' : '🚀 Envoyer ma proposition commerciale'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {activeSubTab === 'mesdevis' && (
                <div className="space-y-4">
                    {mesDevis.length === 0 ? (
                        <div className="text-center py-16 bg-white/[0.01] border border-white/[0.05] rounded-3xl text-slate-500 space-y-2">
                            <p className="text-4xl">📋</p>
                            <p className="text-sm font-medium">Aucun devis émis pour le moment.</p>
                        </div>
                    ) : mesDevis.map(devis => {
                        const res = devis.reservationDevis;
                        const statutDevis = {
                            EN_ATTENTE: { label: '⏳ En attente de réponse', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                            ACCEPTE: { label: '🎉 Devis Accepté !', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]' },
                            REFUSE: { label: '❌ Décliné', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
                        }[devis.statut] || { label: devis.statut, color: 'text-slate-400 bg-white/[0.05] border-white/[0.1]' };

                        return (
                            <div key={devis.id} className="bg-white/[0.02] border border-white/[0.07] rounded-3xl p-6 space-y-4 shadow-xl">
                                <div className="flex justify-between items-start flex-wrap gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Devis #{devis.id}</span>
                                            <span className="text-slate-600">/</span>
                                            <span className="text-xs text-purple-400 font-semibold">Demande #{res?.id}</span>
                                        </div>
                                        <h4 className="text-lg font-bold text-white mt-0.5">{res?.clientNom || 'Client'}</h4>
                                    </div>
                                    <span className={`px-3.5 py-1 rounded-full text-xs font-bold border ${statutDevis.color}`}>
                                        {statutDevis.label}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center bg-[#070A12]/80 rounded-2xl px-5 py-3.5 border border-white/[0.04]">
                                    <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Montant convenu</span>
                                    <span className="font-black text-lg text-amber-400">{Number(devis.montant).toLocaleString()} FCFA</span>
                                </div>

                                {devis.description && (
                                    <p className="text-sm text-slate-400 bg-white/[0.01] rounded-2xl p-4 border border-white/[0.03] italic">« {devis.description} »</p>
                                )}

                                {devis.statut === 'ACCEPTE' && (
                                    <div className="bg-purple-950/10 border border-purple-500/20 rounded-2xl p-4 space-y-3">
                                        <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>📸</span> Justificatifs d'intervention requis
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {['photoAvant', 'photoApres'].map(type => (
                                                <div key={type} className="flex items-center gap-2 bg-[#070A12] p-2 rounded-xl border border-white/[0.05]">
                                                    <label className="flex-1 flex items-center gap-2 px-3 py-1.5 cursor-pointer truncate">
                                                        <span className="text-xs font-medium text-slate-300">{type === 'photoAvant' ? 'État initial' : 'Résultat final'}</span>
                                                        <input type="file" accept="image/*" className="hidden"
                                                            onChange={e => setPhotos(p => ({ ...p, [`${res?.id}_${type}`]: e.target.files[0] }))} />
                                                        {photos[`${res?.id}_${type}`] && <span className="text-[10px] text-emerald-400 font-bold ml-auto bg-emerald-500/10 px-2 py-0.5 rounded">Prêt</span>}
                                                    </label>
                                                    <button
                                                        onClick={() => envoyerPhotos(res?.id, type)}
                                                        disabled={uploadLoading === `${res?.id}_${type}` || !photos[`${res?.id}_${type}`]}
                                                        className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-white/[0.03] disabled:text-slate-600 text-white rounded-lg text-xs font-bold transition-all">
                                                        {uploadLoading === `${res?.id}_${type}` ? '⏳' : 'Upload'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function DashboardFournisseur({ setCurrentView }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [data, setData] = useState(null);
    const [produits, setProduits] = useState([]);
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoad, setActionLoad] = useState(null);
    const [menuOuvert, setMenuOuvert] = useState(false);
    const [chatMission, setChatMission] = useState(null);
    const token = localStorage.getItem('token');
    let currentUser = {};
    try { currentUser = JSON.parse(localStorage.getItem('user')) || {}; } catch { }

    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const [dash, prods] = await Promise.all([
                    getDashboardFournisseur(),
                    getProduitsFournisseur()
                ]);
                if (!dash.success) throw new Error(dash.message);
                setData(dash.data);
                setMissions(dash.data.missions || []);
                setProduits(prods.data || []);
            } catch (e) {
                console.error(e);
                setError('Impossible de charger le dashboard.');
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    const callAction = async (id, endpoint, nextStatut, body = {}) => {
        setActionLoad(`${id}_${endpoint}`);
        try {
            const r = await fetch(`${API}/api/missions/${id}/${endpoint}`, {
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

    if (!token) {
        setCurrentView && setCurrentView('login');
        return null;
    }

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-[#0B0F19] text-white">
            <div className="text-center space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 animate-ping" />
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_15px_#a855f7]" />
                </div>
                <p className="text-slate-400 font-medium tracking-wide text-sm animate-pulse">Synchronisation sécurisée...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-screen bg-[#0B0F19] p-4">
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-8 max-w-md text-center space-y-4">
                <span className="text-5xl">⚠️</span>
                <p className="text-rose-200 font-bold text-lg">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-bold transition-all">Réessayer</button>
            </div>
        </div>
    );

    const { profil, stats, commandesRecentes = [] } = data || {};
    const badgeProfil = BADGE_PROFIL[profil?.statut] || BADGE_PROFIL.EN_ATTENTE;
    const missionsActives = missions.filter(m => ['EN_ATTENTE', 'ACCEPTEE', 'EN_PREPARATION', 'EN_COURS'].includes(m.statut));

    const tabs = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
        { id: 'devis', label: 'Devis & Requetes', icon: '📨' },
        { id: 'missions', label: 'Interventions', icon: '📋', badge: missionsActives.length },
        { id: 'commandes', label: 'Commandes Shop', icon: '🛒' },
        { id: 'produits', label: 'Catalogue', icon: '📦' },
        { id: 'solde', label: 'Portefeuille', icon: '💰' },
        { id: 'profil', label: 'Fiche Etablissement', icon: '🏢' },
    ];

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex relative overflow-hidden font-sans selection:bg-purple-500 selection:text-white">
            {/* Ambient background glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Sidebar Desktop */}
            <aside className="hidden md:flex w-72 bg-[#0E1320]/80 backdrop-blur-2xl p-6 flex-col gap-4 border-r border-white/[0.05] z-20 shadow-2xl">
                <div className="flex items-center gap-3 px-2 pt-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <span className="font-black text-white text-base">K</span>
                    </div>
                    <div>
                        <h2 className="font-extrabold text-base tracking-tight text-white leading-none">Kanari Service</h2>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400">Partner Portal</span>
                    </div>
                </div>

                <div className={`mt-2 rounded-2xl p-3 border ${badgeProfil.bg} ${badgeProfil.border} flex items-center gap-2`}>
                    <p className={`text-[11px] font-bold tracking-wide ${badgeProfil.text}`}>{badgeProfil.label}</p>
                </div>

                <nav className="flex flex-col gap-1.5 flex-1 mt-2">
                    <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Navigation</span>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`text-left px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group
                                ${activeTab === t.id ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/10 border border-purple-500/30 text-white shadow-lg shadow-purple-500/5 pl-4' : 'hover:bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-transparent'}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-base group-hover:scale-110 transition-transform">{t.icon}</span>
                                <span>{t.label}</span>
                            </div>
                            {t.badge > 0 && <span className="bg-gradient-to-r from-rose-500 to-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">{t.badge}</span>}
                        </button>
                    ))}
                    
                    <div className="pt-4 mt-auto border-t border-white/[0.05]">
                        <button onClick={() => setCurrentView && setCurrentView('accueil')} className="w-full text-left px-3.5 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all flex items-center gap-3">
                            <span className="text-base">🏠</span> Retour au site
                        </button>
                    </div>
                </nav>

                <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center justify-between gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300 text-xs truncate">
                        {profil?.nomEntreprise?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{profil?.nomEntreprise || profil?.nom || 'Prestataire'}</p>
                        <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" /> Connecté</span>
                    </div>
                    <button onClick={() => { localStorage.clear(); setCurrentView && setCurrentView('login'); }} title="Se déconnecter"
                        className="p-2 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors text-sm">
                        🚪
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-[#0E1320]/95 backdrop-blur-lg border-b border-white/[0.07] px-5 py-3.5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-black text-white text-xs">K</div>
                    <span className="font-extrabold text-sm tracking-tight">Kanari Portal</span>
                </div>
                <button onClick={() => setMenuOuvert(!menuOuvert)} className="p-2 rounded-xl bg-white/[0.05] text-slate-300 font-bold text-xs">{menuOuvert ? 'Fermer ✕' : 'Menu ☰'}</button>
            </div>

            {/* Mobile Menu Overlay */}
            {menuOuvert && (
                <div className="md:hidden fixed inset-x-0 top-14 bottom-0 z-40 bg-[#0B0F19]/95 backdrop-blur-2xl border-b border-white/[0.05] p-6 space-y-2 overflow-y-auto animate-fadeIn">
                    <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">Menu Principal</p>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => { setActiveTab(t.id); setMenuOuvert(false); }}
                            className={`w-full text-left px-4 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-between ${activeTab === t.id ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25' : 'text-slate-300 bg-white/[0.02]'}`}>
                            <div className="flex items-center gap-3"><span className="text-lg">{t.icon}</span><span>{t.label}</span></div>
                            {t.badge > 0 && <span className="bg-rose-500 text-white text-xs px-2.5 py-0.5 rounded-full font-black">{t.badge}</span>}
                        </button>
                    ))}
                    <div className="pt-6 border-t border-white/[0.05] space-y-2">
                        <button onClick={() => { setCurrentView && setCurrentView('accueil'); }} className="w-full py-3 rounded-2xl bg-white/[0.04] text-center font-bold text-xs text-slate-300">🏠 Retour au site</button>
                        <button onClick={() => { localStorage.clear(); setCurrentView && setCurrentView('login'); }} className="w-full py-3 rounded-2xl bg-rose-500/20 text-rose-400 font-bold text-xs">🚪 Déconnexion</button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto mt-14 md:mt-0 max-w-7xl mx-auto z-10 space-y-8">

                {/* Top Status Breadcrumb */}
                <header className="hidden md:flex items-center justify-between pb-4 border-b border-white/[0.05]">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Espace de gestion</span>
                        <h1 className="text-2xl font-black text-white mt-0.5">{tabs.find(t => t.id === activeTab)?.label}</h1>
                    </div>
                    <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] px-4 py-2 rounded-2xl">
                        <span className="text-xs text-slate-400">Statut réseau :</span>
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" /> Optimal</span>
                    </div>
                </header>

                {activeTab === 'overview' && (
                    <section className="space-y-8 animate-fadeIn">
                        {/* Welcome Banner */}
                        <div className="relative rounded-3xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-transparent border border-purple-500/20 p-8 overflow-hidden shadow-2xl">
                            <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="max-w-xl space-y-2">
                                <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider inline-block">Tableau de bord</span>
                                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Bonjour, <span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">{profil?.nomEntreprise || profil?.nom || 'Partenaire'}</span> 👋</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">Voici le résumé de vos performances commerciales et l'état de votre file d'attente sur Kanari.</p>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            <StatCard icon="📦" label="Produits en vente" value={stats?.totalProduits ?? 0} gradient="from-indigo-500 to-blue-500" />
                            <StatCard icon="📋" label="Missions traitées" value={stats?.totalMissions ?? 0} gradient="from-purple-500 to-pink-500" />
                            <StatCard icon="🛒" label="Ventes directes" value={stats?.totalCommandes ?? 0} gradient="from-blue-500 to-cyan-500" />
                            <StatCard icon="💰" label="Chiffre d'affaires" value={`${stats?.totalRevenus?.toLocaleString() ?? 0} F`} gradient="from-emerald-400 to-teal-500" />
                        </div>

                        {/* Active Alerts Section */}
                        {missionsActives.length > 0 && (
                            <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 text-xl">⚡</span>
                                        <div>
                                            <h3 className="font-extrabold text-amber-300 text-base">Missions nécessitant votre attention</h3>
                                            <span className="text-xs text-amber-400/70">{missionsActives.length} dossier{missionsActives.length > 1 ? 's' : ''} en cours de traitement</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setActiveTab('missions')} className="hidden sm:block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all">Ouvrir le gestionnaire</button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                                    {missionsActives.slice(0, 3).map(m => (
                                        <div key={m.id} className="bg-[#070A12]/80 border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-all">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-[10px] uppercase font-extrabold text-slate-500">Réf #{m.id}</span>
                                                    <p className="font-extrabold text-white text-sm truncate max-w-[140px] mt-0.5">{m.client?.nom || m.clientNom || 'Client'}</p>
                                                </div>
                                                <StatutBadge statut={m.statut} />
                                            </div>
                                            <button onClick={() => setActiveTab('missions')} className="w-full py-2 bg-white/[0.03] hover:bg-amber-500/20 hover:text-amber-300 text-slate-400 rounded-xl text-xs font-bold transition-all text-center">Gérer l'intervention →</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'devis' && <OngletDevis token={token} />}

                {activeTab === 'missions' && (
                    <section className="space-y-6 animate-fadeIn">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.01] p-6 rounded-3xl border border-white/[0.05]">
                            <div>
                                <h2 className="text-2xl font-black text-white">📋 Suivi des Interventions</h2>
                                <p className="text-slate-400 text-xs mt-1">{missions.length} mission{missions.length > 1 ? 's' : ''} rattachée{missions.length > 1 ? 's' : ''} à votre compte</p>
                            </div>
                        </div>

                        {missions.length === 0 ? (
                            <div className="text-center py-20 bg-white/[0.01] border border-white/[0.05] rounded-3xl text-slate-500 space-y-2">
                                <p className="text-4xl">📭</p>
                                <p className="text-sm font-medium">Aucune intervention planifiée.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5">
                                {missions.map(mission => {
                                    const s = STATUT[mission.statut] || STATUT.EN_ATTENTE;
                                    return (
                                        <div key={mission.id} className="bg-white/[0.02] border border-white/[0.07] hover:border-white/[0.15] rounded-3xl p-6 md:p-8 transition-all shadow-xl space-y-6 relative overflow-hidden group">
                                            {/* Top Accent line */}
                                            <div className={`absolute top-0 left-0 right-0 h-1.5 ${s.dot}`} />

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.05]">
                                                <div>
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Mission #{mission.id}</span>
                                                        <StatutBadge statut={mission.statut} />
                                                    </div>
                                                    <h3 className="text-xl font-black text-white mt-1.5">{mission.client?.nom || mission.clientNom || 'Client non renseigné'}</h3>
                                                    {(mission.client?.telephone || mission.telephone) && (
                                                        <span className="text-xs font-semibold text-purple-400 inline-block mt-1">📞 Contact : {mission.client?.telephone || mission.telephone}</span>
                                                    )}
                                                </div>

                                                <button onClick={() => setChatMission(mission)}
                                                    className="self-start sm:self-center px-4 py-2.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/5 transition-all active:scale-95">
                                                    <span>💬</span> Messagerie Client
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {[
                                                    ['📍 Adresse exacte', mission.adresseIntervention || mission.adresse],
                                                    ['📅 Horaires convenus', mission.dateSouhaitee ? new Date(mission.dateSouhaitee).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Non spécifié'],
                                                    ['💰 Acompte versé', mission.acompte ? `${Number(mission.acompte).toLocaleString()} FCFA` : 'Aucun acompte'],
                                                ].map(([label, val]) => val && (
                                                    <div key={label} className="bg-[#070A12]/80 rounded-2xl p-4 border border-white/[0.04]">
                                                        <p className="text-slate-500 text-[10px] uppercase font-black tracking-wider mb-1">{label}</p>
                                                        <p className="text-slate-200 text-sm font-bold truncate">{val}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {(mission.description || mission.besoin) && (
                                                <div className="bg-white/[0.01] rounded-2xl p-4 border border-white/[0.04]">
                                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cahier des charges client</span>
                                                    <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">{mission.description || mission.besoin}</p>
                                                </div>
                                            )}

                                            {/* Action Toolbar */}
                                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                                {mission.statut === 'EN_ATTENTE' && (
                                                    <button onClick={() => callAction(mission.id, 'accepter', 'ACCEPTEE')} disabled={actionLoad === `${mission.id}_accepter`}
                                                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50">
                                                        {actionLoad === `${mission.id}_accepter` ? 'Validation...' : '✅ Confirmer et Accepter la mission'}
                                                    </button>
                                                )}

                                                {['ACCEPTEE', 'EN_PREPARATION'].includes(mission.statut) && (
                                                    <>
                                                        <button onClick={() => callAction(mission.id, 'demarrer', 'EN_COURS')} disabled={actionLoad === `${mission.id}_demarrer`}
                                                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-purple-500/25 transition-all active:scale-95 disabled:opacity-50">
                                                            {actionLoad === `${mission.id}_demarrer` ? 'Activation...' : '🚀 Déclarer l\'intervention "En Cours"'}
                                                        </button>
                                                        {mission.statut === 'ACCEPTEE' && (
                                                            <button onClick={() => signalerMateriel(mission.id)} disabled={actionLoad === `${mission.id}_materiel`}
                                                                className="px-5 py-3 bg-white/[0.05] hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-white/[0.08] font-bold rounded-xl text-xs transition-all">
                                                                ⚠️ Signaler un manque de matériel
                                                            </button>
                                                        )}
                                                    </>
                                                )}

                                                {mission.statut === 'EN_COURS' && (
                                                    <button onClick={() => callAction(mission.id, 'terminer', 'TERMINEE')} disabled={actionLoad === `${mission.id}_terminer`}
                                                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-90 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50">
                                                        {actionLoad === `${mission.id}_terminer` ? 'Clôture...' : '🏁 Marquer les travaux comme "Terminés"'}
                                                    </button>
                                                )}

                                                {mission.statut === 'TERMINEE' && (
                                                    <div className="px-5 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 font-semibold text-xs flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                                                        Dossier en attente du quitus de validation par le client...
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

                {activeTab === 'commandes' && (
                    <section className="space-y-6 animate-fadeIn">
                        <div className="bg-white/[0.01] p-6 rounded-3xl border border-white/[0.05]">
                            <h2 className="text-2xl font-black text-white">🛒 Commandes de la Boutique</h2>
                            <p className="text-slate-400 text-xs mt-1">Achats directs passés sur votre vitrine Kanari</p>
                        </div>

                        {commandesRecentes.length === 0 ? (
                            <div className="text-center py-20 bg-white/[0.01] border border-white/[0.05] rounded-3xl text-slate-500 space-y-2">
                                <p className="text-4xl">🛒</p>
                                <p className="text-sm font-medium">Aucune commande récente.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {commandesRecentes.map(cmd => (
                                    <div key={cmd.id} className="bg-white/[0.02] border border-white/[0.07] rounded-3xl p-6 space-y-4 shadow-xl">
                                        <div className="flex justify-between items-center pb-3 border-b border-white/[0.05]">
                                            <span className="font-extrabold text-white text-base">Commande #{cmd.id}</span>
                                            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">{new Date(cmd.createdAt).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium">Destinataire : <span className="text-white font-bold">{cmd.clientCommande?.nom || 'Non spécifié'}</span></p>
                                        <div className="space-y-2 pt-1">
                                            {cmd.itemsCommande?.map(item => (
                                                <div key={item.id} className="flex justify-between items-center text-xs bg-[#070A12] rounded-xl px-3.5 py-2.5 border border-white/[0.04]">
                                                    <span className="text-slate-200 font-semibold">{item.produitCommandeProduit?.nom}</span>
                                                    <span className="text-purple-300 font-extrabold bg-white/[0.05] px-2 py-0.5 rounded">x{item.quantite}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'produits' && (
                    <section className="space-y-6 animate-fadeIn">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.01] p-6 rounded-3xl border border-white/[0.05]">
                            <div>
                                <h2 className="text-2xl font-black text-white">📦 Gestion du Catalogue</h2>
                                <p className="text-slate-400 text-xs mt-1">Vos articles visibles par les clients de la plateforme</p>
                            </div>
                            <button onClick={() => setCurrentView && setCurrentView('ajouterProduit')} 
                                className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                                + Référencer un nouvel article
                            </button>
                        </div>

                        {produits.length === 0 ? (
                            <div className="text-center py-20 bg-white/[0.01] border border-white/[0.05] rounded-3xl text-slate-500 space-y-2">
                                <p className="text-4xl">📦</p>
                                <p className="text-sm font-medium">Votre catalogue est vide.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {produits.map(p => (
                                    <div key={p.id} className="bg-white/[0.02] border border-white/[0.07] hover:border-purple-500/40 rounded-3xl overflow-hidden group flex flex-col justify-between transition-all shadow-xl">
                                        <div>
                                            <div className="h-48 bg-[#070A12] relative overflow-hidden">
                                                {p.image ? (
                                                    <img src={`${API}/uploads/${p.image}`} alt={p.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e => { e.target.src = '/backgrounds/default.jpg'; }} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-4xl text-slate-700">📦</div>
                                                )}
                                                <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/[0.1]">
                                                    <span className="text-xs font-black text-amber-400">{p.prix?.toLocaleString()} F</span>
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-2">
                                                <h3 className="font-extrabold text-lg text-white leading-snug">{p.nom}</h3>
                                                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{p.description || 'Aucune description.'}</p>
                                            </div>
                                        </div>

                                        <div className="p-6 pt-0 flex gap-2.5 mt-4">
                                            <button onClick={() => setCurrentView && setCurrentView('modifierProduit')} className="flex-1 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 font-bold rounded-xl text-xs transition-all">Éditer</button>
                                            <button onClick={() => { if (window.confirm(`Retirer "${p.nom}" du catalogue ?`)) deleteProduit(p.id).then(() => setProduits(prev => prev.filter(x => x.id !== p.id))); }}
                                                className="px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs transition-all" title="Supprimer">
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'solde' && (
                    <section className="space-y-6 animate-fadeIn">
                        <div className="bg-white/[0.01] p-6 rounded-3xl border border-white/[0.05]">
                            <h2 className="text-2xl font-black text-white">💰 Flux Financiers</h2>
                            <p className="text-slate-400 text-xs mt-1">Gérez vos encaissements et demandez vos virements</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.07] rounded-3xl p-6 md:p-8 shadow-2xl">
                            <SoldeRetrait />
                        </div>
                    </section>
                )}

                {activeTab === 'profil' && (
                    <section className="space-y-6 animate-fadeIn">
                        <div className="bg-white/[0.01] p-6 rounded-3xl border border-white/[0.05]">
                            <h2 className="text-2xl font-black text-white">🏢 Paramètres de l'Établissement</h2>
                            <p className="text-slate-400 text-xs mt-1">Informations légales et logistiques</p>
                        </div>

                        <div className="bg-white/[0.02] border border-white/[0.07] rounded-3xl p-8 max-w-xl mx-auto space-y-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                            
                            <div className="text-center space-y-3">
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-4xl font-black mx-auto shadow-xl shadow-purple-500/20 ring-4 ring-white/[0.05]">
                                    {profil?.nomEntreprise?.[0]?.toUpperCase() || '🏪'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">{profil?.nomEntreprise || 'Nom non défini'}</h3>
                                    <p className="text-xs text-purple-400 font-semibold mt-0.5">{profil?.userFournisseur?.email}</p>
                                </div>
                                <div className={`inline-block rounded-full px-4 py-1 border ${badgeProfil.bg} ${badgeProfil.border}`}>
                                    <span className={`text-xs font-bold ${badgeProfil.text}`}>{badgeProfil.label}</span>
                                </div>
                            </div>

                            <div className="divide-y divide-white/[0.05] pt-4 text-xs font-medium">
                                {[
                                    ['Responsable légal', profil?.nom || '—'],
                                    ['Téléphone Pro.', profil?.telephone || profil?.userFournisseur?.telephone || '—'],
                                    ['Siège / Adresse', profil?.adresse || '—'],
                                    ['Secteur / Quartier', profil?.quartier || '—'],
                                    ['Capacité de Transport', profil?.hasTransport ? '✅ Véhiculé' : '❌ Non véhiculé'],
                                    ['Outillage Pro.', profil?.hasMateriel ? '✅ Équipement complet' : '❌ À vérifier'],
                                    ['Indice de satisfaction', profil?.note > 0 ? `⭐ ${profil.note.toFixed(1)} / 5` : 'Nouveau partenaire (Non noté)'],
                                ].map(([label, val]) => (
                                    <div key={label} className="flex justify-between items-center py-3.5">
                                        <span className="text-slate-400">{label}</span>
                                        <span className="font-extrabold text-white text-right">{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {chatMission && <ChatModal mission={chatMission} userId={currentUser.id} onClose={() => setChatMission(null)} />}
        </div>
    );
}