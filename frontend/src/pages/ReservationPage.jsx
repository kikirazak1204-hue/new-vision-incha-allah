import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Layers, CreditCard, CheckCircle2, Trash2
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext.jsx';

const API = import.meta.env.VITE_API_URL || '';

const DICT = {
    fr: {
        title: "Finaliser votre demande",
        subtitle: "Kanari regroupe vos services pour une prise en charge fluide.",
        socleTitle: "1. Vos Coordonnées & Lieu",
        servicesListTitle: "2. Vos Services Sélectionnés",
        name: "Votre Nom complet *", phone: "Téléphone direct *", address: "Adresse ou Lieu global *",
        dateGlobal: "📅 Date et heure souhaitées *",
        payment: "💳 Mode de règlement", payKanari: "Paiement sécurisé via Kanari", payDirect: "Paiement direct au prestataire",
        btnConfirm: "VALIDER MON PROJET", loading: "Transmission en cours au réseau Kanari...",
        errFill: "❌ Merci de remplir les champs obligatoires (Nom, Téléphone, Adresse).",
        errServer: "❌ Erreur de connexion avec le serveur Kanari.",
        fourchetteInfo: "💡 Pour les dépannages, le prix exact sera évalué sur place sous forme de fourchette par le prestataire."
    }
};

export default function ReservationPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [lang] = useState('fr');
    const t = DICT[lang];

    const state = location.state || {};
    const singleService = state.service || JSON.parse(localStorage.getItem('selectedService') || 'null');
    const fournisseur = state.fournisseur || JSON.parse(localStorage.getItem('selectedFournisseur') || 'null');

    const [servicesSelectionnes, setServicesSelectionnes] = useState(() => {
        if (state.services && Array.isArray(state.services)) return state.services;
        if (singleService) return [singleService];
        const cart = JSON.parse(localStorage.getItem('kanari_cart') || '[]');
        return cart.length > 0 ? cart.map(item => item.service || item) : [];
    });

    let user = {};
    try { user = JSON.parse(localStorage.getItem('user') || '{}'); } catch { }

    const [socle, setSocle] = useState({
        clientNom: user?.nom || '',
        telephone: user?.telephone || '',
        adresse: '',
        dateIntervention: '',
        modePaiement: 'direct_prestataire',
        commentaireGlobal: ''
    });

    const [detailsServices, setDetailsServices] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSocleChange = (field) => (e) => {
        setSocle(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleDetailChange = (serviceId, field) => (e) => {
        setDetailsServices(prev => ({
            ...prev,
            [serviceId]: {
                ...(prev[serviceId] || {}),
                [field]: e.target.value
            }
        }));
    };

    const handleRemoveService = (indexToRemove) => {
        const updated = servicesSelectionnes.filter((_, idx) => idx !== indexToRemove);
        setServicesSelectionnes(updated);
        if (updated.length === 0) {
            localStorage.removeItem('selectedService');
            localStorage.removeItem('kanari_cart');
        }
    };

    const handleSubmit = async () => {
        setMessage('');
        if (!socle.clientNom || !socle.telephone || !socle.adresse) {
            return setMessage(t.errFill);
        }
        if (servicesSelectionnes.length === 0) {
            return setMessage("❌ Aucun service sélectionné.");
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const payload = {
                clientNom: socle.clientNom,
                telephone: socle.telephone,
                adresse: socle.adresse,
                dateIntervention: socle.dateIntervention
                    ? new Date(socle.dateIntervention).toISOString()
                    : new Date().toISOString(),
                modePaiement: socle.modePaiement,
                commentaireGlobal: socle.commentaireGlobal,
                fournisseurId: fournisseur?.id || fournisseur?._id || null,
                services: servicesSelectionnes.map(srv => ({
                    serviceId: srv.id || srv._id || srv.serviceId,
                    nom: srv.nom || srv.serviceNom,
                    detailsParticuliers: detailsServices[srv.id || srv._id] || {}
                }))
            };

            const res = await fetch(`${API}/api/reservations/global`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok && (data.success || data.id)) {
                showNotification({
                    title: 'Projet Transmis avec Succès',
                    body: `${servicesSelectionnes.length} service(s) pris en charge par Kanari.`,
                    categorie: 'Kanari Pro'
                });

                localStorage.removeItem('kanari_cart');
                localStorage.removeItem('selectedService');

                if (socle.modePaiement === 'depot_kanari') {
                    navigate('/paiement', { state: { reservationId: data.id || data.reservation?._id, payload } });
                } else {
                    navigate('/');
                }
            } else {
                setMessage('❌ ' + (data.message || t.errServer));
            }
        } catch (err) {
            setMessage(t.errServer);
        } finally {
            setLoading(false);
        }
    };

    if (servicesSelectionnes.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-[#0B0F19] text-white">
                <p className="text-2xl font-black mb-2">Votre dossier est vide</p>
                <p className="text-slate-400 mb-6">Veuillez sélectionner au moins un service pour continuer.</p>
                <button onClick={() => navigate('/')} className="px-6 py-3 bg-purple-600 rounded-2xl font-bold text-white shadow-lg">
                    Retour à l'accueil
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white p-6 pb-28 font-sans selection:bg-purple-500/30" style={{ background: '#0B0F19' }}>
            <div className="max-w-2xl mx-auto space-y-6">

                {/* EN-TÊTE PRO */}
                <div className="flex justify-between items-center">
                    <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-white transition flex items-center gap-2">
                        <ArrowLeft size={18} /> Retour
                    </button>
                    <span className="text-xs bg-purple-500/10 text-purple-300 px-3 py-1 rounded-full border border-purple-500/20 font-bold flex items-center gap-1.5">
                        <Layers size={13} /> Espace Pro Kanari
                    </span>
                </div>

                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                        {t.title}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">{t.subtitle}</p>
                </div>

                {message && (
                    <div className={`rounded-2xl p-4 text-center font-semibold text-sm border ${message.startsWith('❌') ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'}`}>
                        {message}
                    </div>
                )}

                {/* SECTION 1 : SOCLE COMMUN */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-md">
                    <h2 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 size={16} /> {t.socleTitle}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Nom & Prénom *</label>
                            <input type="text" placeholder="Ex: Moussa Abdou" value={socle.clientNom} onChange={handleSocleChange('clientNom')} className="w-full bg-white/[0.03] p-3.5 rounded-xl border border-white/10 focus:border-purple-500 outline-none text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Téléphone direct *</label>
                            <input type="tel" placeholder="Ex: +227 90 00 00 00" value={socle.telephone} onChange={handleSocleChange('telephone')} className="w-full bg-white/[0.03] p-3.5 rounded-xl border border-white/10 focus:border-purple-500 outline-none text-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">Lieu ou Adresse d'intervention / de la sortie *</label>
                        <input type="text" placeholder="Ex: Quartier Yantala, près de la pharmacie..." value={socle.adresse} onChange={handleSocleChange('adresse')} className="w-full bg-white/[0.03] p-3.5 rounded-xl border border-white/10 focus:border-purple-500 outline-none text-sm" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">{t.dateGlobal}</label>
                            <input type="datetime-local" value={socle.dateIntervention} onChange={handleSocleChange('dateIntervention')} className="w-full bg-white/[0.03] p-3.5 rounded-xl border border-white/10 focus:border-purple-500 outline-none text-sm" style={{ colorScheme: 'dark' }} />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">Commentaire / Instructions globales</label>
                            <input type="text" placeholder="Ex: Précautions particulières..." value={socle.commentaireGlobal} onChange={handleSocleChange('commentaireGlobal')} className="w-full bg-white/[0.03] p-3.5 rounded-xl border border-white/10 focus:border-purple-500 outline-none text-sm" />
                        </div>
                    </div>
                </div>

                {/* SECTION 2 : SERVICES SÉLECTIONNÉS */}
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                        <span>{t.servicesListTitle} ({servicesSelectionnes.length})</span>
                        <span className="text-xs text-purple-400 normal-case font-normal">Analysé et unifié par Kanari</span>
                    </h2>

                    <div className="space-y-3">
                        {servicesSelectionnes.map((srv, index) => {
                            const srvId = srv.id || srv._id || index;
                            const srvNom = srv.nom || srv.serviceNom || 'Service';

                            return (
                                <div key={srvId} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 relative group">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-sm">{srvNom}</h3>
                                                <p className="text-xs text-slate-400">Pris en compte dans votre dossier global</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveService(index)} className="text-slate-500 hover:text-rose-400 p-2 transition">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <input
                                        type="text"
                                        placeholder={`Précision spécifique pour ${srvNom} (optionnel)...`}
                                        value={detailsServices[srvId]?.precision || ''}
                                        onChange={handleDetailChange(srvId, 'precision')}
                                        className="w-full bg-black/20 p-2.5 rounded-xl border border-white/5 text-xs text-slate-300 outline-none focus:border-purple-500"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* SECTION 3 : PAIEMENT */}
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-md">
                    <label className="block text-slate-300 text-sm font-semibold flex items-center gap-2">
                        <CreditCard size={18} className="text-purple-400" /> {t.payment}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setSocle(p => ({ ...p, modePaiement: 'direct_prestataire' }))}
                            className={`p-4 rounded-xl border text-left transition-all ${socle.modePaiement === 'direct_prestataire' ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg' : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05]'}`}
                        >
                            <p className="font-bold text-sm mb-1">💵 Main à main</p>
                            <p className="text-xs opacity-70">Paiement direct sur place avec le prestataire</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSocle(p => ({ ...p, modePaiement: 'depot_kanari' }))}
                            className={`p-4 rounded-xl border text-left transition-all ${socle.modePaiement === 'depot_kanari' ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg' : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05]'}`}
                        >
                            <p className="font-bold text-sm mb-1">📱 Via Kanari</p>
                            <p className="text-xs opacity-70">Paiement sécurisé ou cagnotte via l'application</p>
                        </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">{t.fourchetteInfo}</p>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-black text-[15px] tracking-wide active:scale-95 transition-all flex justify-center items-center shadow-xl shadow-purple-500/20 disabled:opacity-50"
                >
                    {loading ? t.loading : t.btnConfirm}
                </button>

            </div>
        </div>
    );
}