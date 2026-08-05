import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Zap, FileSignature, ShieldCheck } from 'lucide-react';
import { useNotification } from '../context/NotificationContext.jsx';
const API = import.meta.env.VITE_API_URL || '';
const normalize = (s = '') => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const SERVICES_CLASSIQUE = [
    'plomberie', 'electricite', 'menage', 'transport', 'securite',
    'menuiserie', 'jardinage', 'maconnerie', 'mecanique', 'climatisation',
    'reparation', 'livraison', 'coiffure', 'beaute', 'couture'
];
const SERVICES_PLANIFIE = ['medecine', 'education', 'avocat', 'juridique', 'assurance', 'sport'];
const SERVICES_CONTRAT = ['divertissement', 'mission', 'freelance', 'location', 'hotellerie'];

const detecterType = (nomService = '') => {
    const n = normalize(nomService);
    if (SERVICES_CONTRAT.some((s) => n.includes(s))) return 'contrat';
    if (SERVICES_PLANIFIE.some((s) => n.includes(s))) return 'planifie';
    return 'classique';
};

const LABEL_TYPE = {
    classique: { label: 'Intervention rapide', icon: Zap, desc: 'Un prestataire intervient dès que possible.' },
    planifie: { label: 'Rendez-vous', icon: CalendarClock, desc: 'Choisissez une date et heure précise.' },
    contrat: { label: 'Devis & Contrat', icon: FileSignature, desc: 'Détails complets requis, acompte possible.' },
};

const SERVICE_BACKGROUND_IMAGES = {
    electricite: '/backgrounds/electricite.png',
    plomberie: '/backgrounds/plomberie.png',
    transports: '/backgrounds/transport.png',
    mecanique: '/backgrounds/mecanique.jpg',
    coiffure: '/backgrounds/coiffure.jpg',
    couture: '/backgrounds/couture.jpg',
    sante: '/backgrounds/sante.png',
    restauration: '/backgrounds/restauration.png',
    peinture: '/backgrounds/peinture.jpg',
    maconnerie: '/backgrounds/maconnerie.jpg',
    agriculture: '/backgrounds/agriculture.png',
    livraison: '/backgrounds/transport.png',
    location: '/backgrounds/transport.png',
    hotellerie: '/backgrounds/transport.png',
    assurance: '/backgrounds/transport.png',
    avocat: '/backgrounds/transport.png',
    sport: '/backgrounds/transport.png',
    entretien: '/backgrounds/transport.png',
    menage: '/backgrounds/transport.png',
    securite: '/backgrounds/transport.png',
    menuiserie: '/backgrounds/maconnerie.jpg',
    climatisation: '/backgrounds/sante.png',
    reparation: '/backgrounds/mecanique.jpg',
    beaute: '/backgrounds/coiffure.jpg',
    alimentation: '/backgrounds/restauration.png',
    artisanat: '/backgrounds/couture.jpg',
    fleuriste: '/backgrounds/peinture.jpg',
};

const normalizeKey = (value = '') =>
    String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

const getServiceImage = (service) => {
    if (!service) return '/backgrounds/transport.png';
    if (service.image) return service.image;
    const key = normalizeKey(service.code || service.nom || 'transport');
    return SERVICE_BACKGROUND_IMAGES[key] || '/backgrounds/transport.png';
};

export default function ReservationPage({ setCurrentView }) {
    const location = useLocation();
    const navigate = useNavigate();

    const parseStorage = (key) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            return null;
        }
    };

    const state = location.state || {};
    const stateService = state.service;
    const stateFournisseur = state.fournisseur;

    const savedService = stateService || parseStorage('selectedService');
    const savedFournisseur = stateFournisseur || parseStorage('selectedFournisseur');

    const service = savedService;
    const fournisseur = savedFournisseur;

    useEffect(() => {
        if (stateService) {
            localStorage.setItem('selectedService', JSON.stringify(stateService));
        }
        if (stateFournisseur) {
            localStorage.setItem('selectedFournisseur', JSON.stringify(stateFournisseur));
        }
    }, [stateService, stateFournisseur]);

    let user = {};
    try { user = JSON.parse(localStorage.getItem('user')) || {}; } catch { }

    // ➕ AJOUT : détection du mode Admin (saisie manuelle suite à un appel téléphonique du client)
    const isAdmin = String(user?.role || '').toLowerCase().trim() === 'admin';
    // ➕ AJOUT : une assignation directe Admin = un admin connecté qui choisit lui-même un prestataire précis
    const assignationDirecteAdmin = isAdmin && !!fournisseur;

    const typeDetecte = detecterType(service?.nom);

    const [formData, setFormData] = useState({
        besoin: '',
        adresse: '',
        telephone: '',
        clientNom: user?.nom || '',
        dateIntervention: '',
        type: typeDetecte,
        modePaiement: 'depot_kanari',
        statut: 'en_attente',
        parcours: fournisseur ? 'direct' : 'assignation',
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const { showNotification } = useNotification();

    useEffect(() => {
        if (!service) return;
        setFormData((prev) => ({ ...prev, type: detecterType(service.nom) }));
    }, [service]);

    const handleChange = (field) => (e) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async () => {
        setMessage('');

        if (!service?.id) {
            setMessage('❌ Aucun service sélectionné. Retournez à la liste des services.');
            return;
        }
        if (!formData.telephone || !formData.adresse || !formData.besoin) {
            setMessage('❌ Merci de remplir téléphone, adresse et description du besoin.');
            return;
        }
        if ((formData.type === 'planifie' || formData.type === 'contrat') && !formData.dateIntervention) {
            setMessage('❌ Merci de choisir une date pour ce type de service.');
            return;
        }

        setLoading(true);

        const payload = {
            besoin: formData.besoin,
            adresse: formData.adresse,
            telephone: formData.telephone,
            clientNom: formData.clientNom || 'Client anonyme',
            dateIntervention: formData.dateIntervention || null,
            type: formData.type,
            modePaiement: formData.modePaiement,
            serviceId: service?.id || service?._id || parseStorage('selectedServiceId'),
            serviceNom: service?.nom || service?.name || 'service',
            fournisseurId: fournisseur?.id || fournisseur?._id || null,
            parcours: fournisseur ? 'direct' : 'assignation',
            clientId: user?.id || null,
            ...(assignationDirecteAdmin ? {
                statut: 'ACCEPTEE',
                assignePar: 'admin',
                validationAdmin: true,
            } : {}),
        };

        try {
            const res = await fetch(`${API}/api/reservations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setMessage(assignationDirecteAdmin
                    ? '✅ Réservation créée et assignée avec succès ! Le prestataire voit déjà le numéro du client. Redirection...'
                    : '✅ Réservation transmise avec succès ! Redirection...');
                showNotification({
                    title: assignationDirecteAdmin ? 'Mission assignée' : 'Réservation transmise',
                    body: assignationDirecteAdmin
                        ? 'Le prestataire a reçu votre demande et peut démarrer l’intervention.'
                        : 'Votre demande est bien enregistrée. Nous vous recontactons bientôt.',
                    categorie: 'Réservation'
                });
                setTimeout(() => navigate('/'), 1500);
            } else {
                setMessage('❌ ' + (data.message || "Échec de l'envoi de la réservation."));
            }
        } catch (error) {
            console.error('Erreur réservation:', error);
            setMessage('❌ Erreur de connexion au serveur.');
        } finally {
            setLoading(false);
        }
    };

    const typeInfo = LABEL_TYPE[formData.type];
    const TypeIcon = typeInfo.icon;
    const serviceImage = getServiceImage(service);

    // ✅ Garde-fou : si on arrive ici sans service (accès direct à l'URL), on guide l'utilisateur
    if (!service) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6" style={{ background: '#0B0F19' }}>
                <p className="text-2xl font-black text-white mb-2">Aucun service sélectionné</p>
                <p className="text-slate-400 mb-6">Choisissez d'abord un service ou un prestataire avant de réserver.</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-bold active:scale-95 transition-all"
                >
                    Retour à l'accueil
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white p-6 animate-in fade-in duration-300" style={{ background: '#0B0F19' }}>
            <div className="max-w-2xl mx-auto">
                <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-white mb-6 transition flex items-center gap-2 active:scale-95">
                    <ArrowLeft size={18} /> Retour
                </button>

                <h1 className="text-3xl font-black mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                    Finaliser la demande
                </h1>
                <p className="text-slate-400 mb-1">
                    Service : <span className="text-purple-400 font-semibold"><img src={serviceImage} alt={service?.nom} className="inline-block w-5 h-5 rounded-full object-cover mr-2" /> {service?.nom}</span>
                </p>
                {fournisseur && (
                    <p className="text-slate-400 mb-6 text-sm">
                        Prestataire choisi : <span className="text-white font-semibold">{fournisseur.nomEntreprise}</span>
                    </p>
                )}

                {/* ➕ AJOUT : bandeau visible uniquement en mode Admin avec prestataire déjà choisi */}
                {assignationDirecteAdmin && (
                    <div
                        className="mb-6 rounded-2xl border border-emerald-500/30 p-4 flex items-center gap-3"
                        style={{ background: 'rgba(16,185,129,0.08)', backdropFilter: 'blur(12px)' }}
                    >
                        <ShieldCheck className="text-emerald-400 shrink-0" size={26} />
                        <div>
                            <p className="font-black text-emerald-300 text-sm">Mode Admin — Assignation directe</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Cette réservation (client qui a appelé) sera créée déjà validée. Le prestataire verra
                                immédiatement le numéro du client dans son Dashboard, sans étape de validation supplémentaire.
                            </p>
                        </div>
                    </div>
                )}

                <div
                    className="mb-8 rounded-2xl border border-purple-500/30 p-4 flex items-center gap-3"
                    style={{ background: 'rgba(139,92,246,0.08)', backdropFilter: 'blur(12px)' }}
                >
                    <TypeIcon className="text-purple-400" size={28} />
                    <div>
                        <p className="font-black text-purple-300">{typeInfo.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{typeInfo.desc}</p>
                    </div>
                    <span className="ml-auto text-[10px] uppercase tracking-wider bg-purple-500/15 text-purple-300 px-2 py-1 rounded-full">
                        Détecté automatiquement
                    </span>
                </div>

                {message && (
                    <div className={`mb-6 rounded-2xl p-4 text-center font-semibold text-sm border ${message.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border-rose-500/20'}`}>
                        {message}
                    </div>
                )}

                <div className="space-y-4">
                    <input
                        placeholder="Votre nom"
                        value={formData.clientNom}
                        onChange={handleChange('clientNom')}
                        className="w-full bg-white/[0.04] p-4 rounded-xl border border-white/[0.08] focus:border-purple-500 outline-none transition"
                    />
                    <input
                        placeholder="Téléphone *"
                        value={formData.telephone}
                        onChange={handleChange('telephone')}
                        className="w-full bg-white/[0.04] p-4 rounded-xl border border-white/[0.08] focus:border-purple-500 outline-none transition"
                    />
                    <input
                        placeholder="Adresse d'intervention *"
                        value={formData.adresse}
                        onChange={handleChange('adresse')}
                        className="w-full bg-white/[0.04] p-4 rounded-xl border border-white/[0.08] focus:border-purple-500 outline-none transition"
                    />

                    {(formData.type === 'planifie' || formData.type === 'contrat') && (
                        <div>
                            <label className="block text-slate-400 text-sm mb-2">
                                {formData.type === 'planifie' ? '📅 Date et heure du rendez-vous *' : '📅 Date souhaitée pour l\'événement *'}
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.dateIntervention}
                                onChange={handleChange('dateIntervention')}
                                className="w-full bg-white/[0.04] p-4 rounded-xl border border-white/[0.08] focus:border-purple-500 outline-none transition"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-slate-400 text-sm mb-2">💳 Mode de paiement</label>
                        <select
                            value={formData.modePaiement}
                            onChange={handleChange('modePaiement')}
                            className="w-full bg-white/[0.04] p-4 rounded-xl border border-white/[0.08] focus:border-purple-500 outline-none transition"
                        >
                            <option value="depot_kanari" className="bg-slate-900">Paiement sécurisé via dépôt Kanari</option>
                            <option value="direct_prestataire" className="bg-slate-900">Paiement direct au prestataire</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-slate-400 text-sm mb-2">
                            {formData.type === 'contrat' ? 'Décrivez votre événement / projet en détail *' : 'Décrivez votre besoin *'}
                        </label>
                        <textarea
                            placeholder={formData.type === 'contrat'
                                ? 'Ex : Mariage le 15 juillet, 200 personnes, besoin d\'un DJ pour 6h...'
                                : 'Ex : Fuite d\'eau sous l\'évier de la cuisine...'}
                            value={formData.besoin}
                            onChange={handleChange('besoin')}
                            className="w-full h-32 bg-white/[0.04] p-4 rounded-xl border border-white/[0.08] focus:border-purple-500 outline-none transition"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full mt-8 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-black text-xl active:scale-95 hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50"
                >
                    {loading
                        ? 'Envoi en cours...'
                        : assignationDirecteAdmin
                            ? 'VALIDER & ASSIGNER LA RÉSERVATION'
                            : 'CONFIRMER LA DEMANDE'}
                </button>
            </div>
        </div>
    );
}