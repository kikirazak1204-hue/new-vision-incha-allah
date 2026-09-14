import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Layers, Trash2,
    ChevronDown, Wrench, MapPin, AlertTriangle, User, Camera, X, Globe
} from 'lucide-react';
import { CONFIG_SERVICES } from '../config/servicesConfig';

const API = import.meta.env.VITE_API_URL || '';

// ============================================================================
// Utilitaires & Dictionnaire Multilingue
// ============================================================================
const generateSafeId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `srv-${Math.random().toString(36).substr(2, 9)}`;

const normalize = (s = '') => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const getConfigPourService = (srv) => {
    const cle = normalize(srv.categorie || 'default');
    return CONFIG_SERVICES[cle] || CONFIG_SERVICES.default || {
        titre: 'Service', actionBouton: 'Confirmer', typeFormulaire: 'reservation',
        paiementObligatoire: false, collectif: false, champs: []
    };
};

const dict = {
    fr: {
        retour: "Retour",
        nonConnecte: "Non connecté",
        titreFinalisation: "Finalisation de la Réservation",
        sousTitreSecurise: "Dossier Kanari sécurisé.",
        prestataireSel: "Prestataire sélectionné :",
        vosInformations: "Vos informations",
        nomCompletPlaceholder: "Nom complet *",
        telephonePlaceholder: "Téléphone *",
        adressePlaceholder: "Adresse complète *",
        gpsTitle: "Utiliser ma position GPS",
        dateHeureLabel: "Date & heure souhaitées",
        detailsTitre: "Détails des services",
        candidatureBadge: "Candidature — sans paiement",
        photosTitre: "Photos justificatives (1 à 4 max)",
        ajouterPhotosBtn: "Ajouter des photos",
        btnConfirmer: "Confirmer la demande",
        btnPayer: "Payer & valider",
        dossierVideTitre: "Dossier vide",
        dossierVideDesc: "Sélectionnez un service depuis l'accueil.",
        btnRetourAccueil: "Retour à l'accueil"
    },
    en: {
        retour: "Back",
        nonConnecte: "Not logged in",
        titreFinalisation: "Finalize Reservation",
        sousTitreSecurise: "Secure Kanari file.",
        prestataireSel: "Selected provider:",
        vosInformations: "Your Information",
        nomCompletPlaceholder: "Full Name *",
        telephonePlaceholder: "Phone *",
        adressePlaceholder: "Full Address *",
        gpsTitle: "Use my GPS position",
        dateHeureLabel: "Desired Date & Time",
        detailsTitre: "Service Details",
        candidatureBadge: "Application — no payment",
        photosTitre: "Supporting Photos (1 to 4 max)",
        ajouterPhotosBtn: "Add Photos",
        btnConfirmer: "Confirm Request",
        btnPayer: "Pay & Validate",
        dossierVideTitre: "Empty Folder",
        dossierVideDesc: "Select a service from the home page.",
        btnRetourAccueil: "Back to Home"
    }
};

export default function ReservationPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state || {};

    const [lang, setLang] = useState('fr');
    const t = dict[lang];

    const [servicesSelectionnes, setServicesSelectionnes] = useState(() => {
        const singleService = state.service || JSON.parse(localStorage.getItem('selectedService') || 'null');
        let initialServices = [];
        if (state.services && Array.isArray(state.services)) initialServices = state.services;
        else if (singleService) initialServices = [singleService];
        else {
            const cart = JSON.parse(localStorage.getItem('kanari_cart') || '[]');
            initialServices = cart.map(item => item.service || item);
        }
        return initialServices.map(srv => ({ ...srv, safeId: srv.id || srv._id || srv.serviceId || generateSafeId() }));
    });

    const fournisseurPreselectionne = useMemo(() => {
        return state.fournisseur || JSON.parse(localStorage.getItem('selectedFournisseur') || 'null');
    }, [state.fournisseur]);

    const [activeServiceIndex, setActiveServiceIndex] = useState(0);
    const [detailsServices, setDetailsServices] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const [socle, setSocle] = useState({
        clientNom: '', telephone: '', adresse: '', dateIntervention: '', coords: null
    });
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = localStorage.getItem('token');
            if (token && user.nom) {
                setIsLoggedIn(true);
                setSocle(prev => ({
                    ...prev,
                    clientNom: `${user.prenom || ''} ${user.nom || ''}`.trim(),
                    telephone: user.telephone || '',
                }));
            }
        } catch (e) { console.error("Erreur lecture user:", e); }
    }, []);

    const requiresKanariPayment = useMemo(() => {
        return servicesSelectionnes.some(srv => getConfigPourService(srv).paiementObligatoire);
    }, [servicesSelectionnes]);

    const totalMontant = useMemo(() => {
        return servicesSelectionnes.reduce((acc, srv) => {
            const config = getConfigPourService(srv);
            return config.paiementObligatoire ? acc + Number(srv.prix || srv.tarif || 0) : acc;
        }, 0);
    }, [servicesSelectionnes]);

    const auMoinsUneCandidature = useMemo(() => {
        return servicesSelectionnes.some(srv => getConfigPourService(srv).typeFormulaire === 'candidature');
    }, [servicesSelectionnes]);

    const handleSocleChange = (field) => (e) => setSocle(p => ({ ...p, [field]: e.target.value }));

    const handleDetailChange = (srvKey, field, value) => {
        setDetailsServices(p => ({ ...p, [srvKey]: { ...(p[srvKey] || {}), [field]: value } }));
    };

    const handlePhotoUpload = (srvSafeId, e) => {
        const files = Array.from(e.target.files);
        const currentPhotos = detailsServices[srvSafeId]?.photos || [];
        if (currentPhotos.length + files.length > 4) {
            alert(lang === 'fr' ? "Maximum 4 photos autorisées." : "Maximum 4 photos allowed.");
            return;
        }

        Promise.all(files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (uploadEvent) => resolve(uploadEvent.target.result);
                reader.readAsDataURL(file);
            });
        })).then(base64Images => {
            setDetailsServices(p => ({
                ...p,
                [srvSafeId]: {
                    ...(p[srvSafeId] || {}),
                    photos: [...(p[srvSafeId]?.photos || []), ...base64Images].slice(0, 4)
                }
            }));
        });
    };

    const handleRemovePhoto = (srvSafeId, photoIndex) => {
        setDetailsServices(p => {
            const current = p[srvSafeId]?.photos || [];
            return {
                ...p,
                [srvSafeId]: {
                    ...(p[srvSafeId] || {}),
                    photos: current.filter((_, idx) => idx !== photoIndex)
                }
            };
        });
    };

    const requestGeolocation = () => {
        if (!navigator.geolocation) return alert("Géolocalisation non supportée.");
        navigator.geolocation.getCurrentPosition(
            (pos) => setSocle(p => ({ ...p, coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }, adresse: "Position GPS acquise" })),
            () => alert("Impossible d'obtenir la position.")
        );
    };

    const handleRemoveService = (indexToRemove) => {
        const updated = servicesSelectionnes.filter((_, idx) => idx !== indexToRemove);
        setServicesSelectionnes(updated);
        if (activeServiceIndex >= updated.length) setActiveServiceIndex(Math.max(0, updated.length - 1));
        if (updated.length === 0) {
            localStorage.removeItem('selectedService');
            localStorage.removeItem('kanari_cart');
        }
    };

    const validerChampsDynamiques = () => {
        for (const srv of servicesSelectionnes) {
            const config = getConfigPourService(srv);
            const valeursActuelles = detailsServices[srv.safeId] || {};
            for (const champ of config.champs || []) {
                const estAffiche = !champ.conditionAffiche || champ.conditionAffiche(valeursActuelles);
                if (estAffiche && champ.requis && !valeursActuelles[champ.id]) {
                    return `Le champ "${champ.label}" est obligatoire pour ${config.titre}.`;
                }
            }
        }
        return null;
    };

    const handleSubmit = async () => {
        setMessage({ text: '', type: '' });

        if (!socle.clientNom || !socle.telephone || !socle.adresse) {
            return setMessage({ text: 'Veuillez remplir votre nom, téléphone et adresse.', type: 'error' });
        }
        const dateRequise = servicesSelectionnes.some(srv => {
            const config = getConfigPourService(srv);
            return (config.champs || []).every(c => c.id !== 'date') && config.typeFormulaire !== 'candidature';
        });
        if (dateRequise && !socle.dateIntervention) {
            return setMessage({ text: 'Veuillez indiquer une date souhaitée.', type: 'error' });
        }

        const erreurChamp = validerChampsDynamiques();
        if (erreurChamp) {
            return setMessage({ text: erreurChamp, type: 'error' });
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                clientNom: socle.clientNom,
                telephone: socle.telephone,
                adresse: socle.adresse,
                coordonneesGps: socle.coords,
                dateIntervention: socle.dateIntervention ? new Date(socle.dateIntervention).toISOString() : null,
                modePaiement: requiresKanariPayment ? 'depot_kanari' : 'aucun',
                fournisseurId: fournisseurPreselectionne?.id || null,
                services: servicesSelectionnes.map(srv => {
                    const config = getConfigPourService(srv);
                    const details = detailsServices[srv.safeId] || {};
                    return {
                        serviceId: srv.safeId,
                        nom: srv.nom || srv.serviceNom || 'Service',
                        prix: config.paiementObligatoire ? Number(srv.prix || srv.tarif || 0) : 0,
                        typeFormulaire: config.typeFormulaire,
                        detailsParticuliers: {
                            ...details,
                            photos: details.photos || []
                        },
                    };
                }),
            };

            const res = await fetch(`${API}/api/reservations/global`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (!res.ok || !data.success) throw new Error(data.message || 'Erreur serveur.');

            ['kanari_cart', 'selectedService', 'selectedFournisseur'].forEach(k => localStorage.removeItem(k));

            const montantAPayer = data.montantTotal ?? (requiresKanariPayment ? totalMontant : 0);

            if (montantAPayer > 0) {
                navigate('/paiement', { state: { reservation: { id: data.id, montantTotal: montantAPayer } } });
            } else {
                setMessage({
                    text: auMoinsUneCandidature
                        ? 'Votre candidature a été transmise avec succès.'
                        : 'Demande transmise avec succès. Le prestataire a été notifié.',
                    type: 'success'
                });
                setTimeout(() => navigate('/'), 1800);
            }
        } catch (err) {
            setMessage({ text: err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (servicesSelectionnes.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-[#061a3a] p-6">
                <Wrench size={48} className="text-slate-400 mb-4 animate-bounce" />
                <p className="text-2xl font-black mb-2">{t.dossierVideTitre}</p>
                <p className="text-slate-500 mb-6 text-sm">{t.dossierVideDesc}</p>
                <button onClick={() => navigate('/')} className="px-6 py-3 bg-amber-400 text-[#061a3a] rounded-xl font-black shadow-md hover:bg-amber-300 transition">
                    {t.btnRetourAccueil}
                </button>
            </div>
        );
    }

    const currentService = servicesSelectionnes[activeServiceIndex];
    const configActive = getConfigPourService(currentService);
    const valeursActuelles = detailsServices[currentService.safeId] || {};
    const currentPhotos = valeursActuelles.photos || [];

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 text-[#061a3a] font-sans">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Top Nav & Language Toggle */}
                <div className="flex justify-between items-center">
                    <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-[#061a3a] flex items-center gap-2 font-bold text-sm transition">
                        <ArrowLeft size={18} /> {t.retour}
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setLang(l => (l === 'fr' ? 'en' : 'fr'))}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#061a3a] shadow-sm hover:border-amber-400 transition"
                        >
                            <Globe size={14} className="text-amber-500" />
                            {lang.toUpperCase()}
                        </button>
                        {!isLoggedIn && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5 uppercase font-bold tracking-wider">
                                <AlertTriangle size={12} /> {t.nonConnecte}
                            </span>
                        )}
                    </div>
                </div>

                {/* Header card style Register */}
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-slate-100">
                    <div className="text-xs font-black uppercase tracking-[.25em] text-amber-500 mb-1">
                        KANARI SERVICE
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#061a3a]">
                        {servicesSelectionnes.length === 1 ? configActive.titre : t.titreFinalisation}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {fournisseurPreselectionne
                            ? `${t.prestataireSel} ${fournisseurPreselectionne.nomEntreprise || 'Prestataire'}`
                            : t.sousTitreSecurise}
                    </p>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-2xl text-sm font-semibold border shadow-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {message.text}
                    </div>
                )}

                {/* 1. INFORMATIONS ESSENTIELLES (Register Design) */}
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-slate-100 space-y-4">
                    <h2 className="text-sm font-black text-[#061a3a] flex items-center gap-2 uppercase tracking-wider">
                        <User size={16} className="text-amber-500" /> {t.vosInformations}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder={t.nomCompletPlaceholder}
                            value={socle.clientNom}
                            onChange={handleSocleChange('clientNom')}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold !text-[#061a3a] placeholder:!text-slate-400 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
                        />
                        <input
                            type="tel"
                            placeholder={t.telephonePlaceholder}
                            value={socle.telephone}
                            onChange={handleSocleChange('telephone')}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold !text-[#061a3a] placeholder:!text-slate-400 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
                        />
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={t.adressePlaceholder}
                            value={socle.adresse}
                            onChange={handleSocleChange('adresse')}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm font-semibold !text-[#061a3a] placeholder:!text-slate-400 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
                        />
                        <button type="button" onClick={requestGeolocation} className="absolute right-4 top-3.5 text-amber-500 hover:text-amber-600 transition" title={t.gpsTitle}>
                            <MapPin size={20} />
                        </button>
                    </div>
                    {!auMoinsUneCandidature && (
                        <div>
                            <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-wider">{t.dateHeureLabel}</label>
                            <input
                                type="datetime-local"
                                min={new Date().toISOString().slice(0, 16)}
                                value={socle.dateIntervention}
                                onChange={handleSocleChange('dateIntervention')}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold !text-[#061a3a] outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
                            />
                        </div>
                    )}
                </div>

                {/* 2. CONFIGURATION DYNAMIQUE & PHOTOS (1 à 4) */}
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <h2 className="text-sm font-black text-[#061a3a] flex items-center gap-2 uppercase tracking-wider">
                            <Layers size={16} className="text-amber-500" /> {t.detailsTitre} ({servicesSelectionnes.length})
                        </h2>
                    </div>

                    {servicesSelectionnes.length > 1 && (
                        <div className="relative">
                            <select
                                value={activeServiceIndex}
                                onChange={(e) => setActiveServiceIndex(Number(e.target.value))}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold !text-[#061a3a] outline-none appearance-none cursor-pointer focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
                            >
                                {servicesSelectionnes.map((srv, idx) => {
                                    const cfg = getConfigPourService(srv);
                                    return (
                                        <option key={srv.safeId} value={idx}>
                                            {idx + 1}. {srv.nom || srv.serviceNom} {cfg.paiementObligatoire && srv.prix ? `(${srv.prix} FCFA)` : ''}
                                        </option>
                                    );
                                })}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-4 text-amber-500 pointer-events-none" />
                        </div>
                    )}

                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 mt-3 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <span className="text-xs font-black text-[#061a3a] uppercase tracking-wider">{configActive.titre}</span>
                                {configActive.typeFormulaire === 'candidature' && (
                                    <span className="ml-2 text-[10px] text-slate-400 uppercase font-bold">{t.candidatureBadge}</span>
                                )}
                            </div>
                            {servicesSelectionnes.length > 1 && (
                                <button type="button" onClick={() => handleRemoveService(activeServiceIndex)} className="text-red-500 hover:text-red-700 transition p-1">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {(configActive.champs || []).map(champ => {
                                const estAffiche = !champ.conditionAffiche || champ.conditionAffiche(valeursActuelles);
                                if (!estAffiche) return null;

                                const largeurClass = champ.demiLargeur ? 'sm:col-span-1' : 'sm:col-span-2';
                                const valeur = valeursActuelles[champ.id] || '';

                                return (
                                    <div key={champ.id} className={largeurClass}>
                                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                            {champ.label}{champ.requis ? <b className="text-amber-500"> *</b> : ''}
                                        </label>
                                        {champ.type === 'textarea' ? (
                                            <textarea
                                                rows={3}
                                                placeholder={champ.placeholder || champ.label}
                                                value={valeur}
                                                onChange={(e) => handleDetailChange(currentService.safeId, champ.id, e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold !text-[#061a3a] placeholder:!text-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25 resize-none"
                                            />
                                        ) : champ.type === 'select' ? (
                                            <select
                                                value={valeur}
                                                onChange={(e) => handleDetailChange(currentService.safeId, champ.id, e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold !text-[#061a3a] outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25"
                                            >
                                                <option value="" disabled>{champ.label}</option>
                                                {(champ.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : (
                                            <input
                                                type={champ.type}
                                                placeholder={champ.placeholder || champ.label}
                                                value={valeur}
                                                onChange={(e) => handleDetailChange(currentService.safeId, champ.id, e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold !text-[#061a3a] placeholder:!text-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Section Upload 1 à 4 Photos */}
                        <div className="pt-3 border-t border-slate-200/60 mt-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Camera size={15} className="text-amber-500" /> {t.photosTitre}
                                </label>
                                <span className="text-xs font-semibold text-slate-400">{currentPhotos.length}/4</span>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                {currentPhotos.map((photoUrl, pIdx) => (
                                    <div key={pIdx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm group">
                                        <img src={photoUrl} alt={`Preuve ${pIdx + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePhoto(currentService.safeId, pIdx)}
                                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs shadow hover:bg-red-700 transition"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}

                                {currentPhotos.length < 4 && (
                                    <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/20 transition group">
                                        <Camera size={20} className="text-slate-400 group-hover:text-amber-500 transition mb-1" />
                                        <span className="text-[10px] font-bold text-slate-500 group-hover:text-[#061a3a] text-center px-1">+ Ajouter</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => handlePhotoUpload(currentService.safeId, e)}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bouton Soumission Register Style */}
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full rounded-2xl bg-amber-400 px-6 py-4 text-sm font-black text-[#061a3a] shadow-lg transition-all hover:bg-amber-300 hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-[#061a3a]/30 border-t-[#061a3a] rounded-full animate-spin"></div>
                            Traitement en cours...
                        </>
                    ) : requiresKanariPayment ? (
                        `${t.btnPayer} (${totalMontant.toLocaleString()} FCFA)`
                    ) : servicesSelectionnes.length === 1 ? (
                        configActive.actionBouton || t.btnConfirmer
                    ) : (
                        t.btnConfirmer
                    )}
                </button>
            </div>
        </div>
    );
}