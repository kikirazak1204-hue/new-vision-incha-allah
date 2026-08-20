// ============================================================
// Fichier : src/pages/ReservationPage.jsx
// Architecture : Moteur de Formulaire Multi-Services Intelligent
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CONFIG_SERVICES } from '../config/servicesConfig';

const ReservationPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 👤 Coordonnées globales du client & date d'intervention
    const [coordonnees, setCoordonnees] = useState({
        clientNom: '',
        telephone: '',
        adresse: '',
        dateIntervention: '',
        heureIntervention: '09:00',
        commentaireGlobal: ''
    });

    // 🧠 Stockage des réponses dynamiques pour CHAQUE service
    // Format : { "service_id_1": { "typePneud": "SUV", ... }, ... }
    const [formulaires, setFormulaires] = useState({});

    useEffect(() => {
        const loadData = () => {
            // 1. Chargement des services sélectionnés
            const savedServices = location.state?.services || JSON.parse(localStorage.getItem('selectedServices') || '[]');
            
            if (savedServices.length > 0) {
                setServices(savedServices);
                localStorage.setItem('selectedServices', JSON.stringify(savedServices));

                // Initialisation de l'état des questionnaires dynamiques
                const initForms = {};
                savedServices.forEach(s => { 
                    initForms[s.id || s._id] = {}; 
                });
                setFormulaires(initForms);
            } else {
                navigate('/');
                return;
            }

            // 2. Pré-remplissage des coordonnées si l'utilisateur est connecté
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const u = JSON.parse(userStr);
                    setCoordonnees(prev => ({
                        ...prev,
                        clientNom: u.nom || u.name || `${u.prenom || ''} ${u.nom || ''}`.trim(),
                        telephone: u.telephone || u.phone || '',
                        adresse: u.adresse || u.address || ''
                    }));
                } catch (e) {
                    console.error("Erreur lecture utilisateur:", e);
                }
            }

            setIsLoading(false);
        };

        loadData();
    }, [location.state, navigate]);

    // ⚡️ Gestionnaire de saisie des coordonnées globales
    const handleCoordChange = (e) => {
        const { name, value } = e.target;
        setCoordonnees(prev => ({ ...prev, [name]: value }));
    };

    // ⚡️ Gestionnaire de saisie dynamique par service
    const handleInputChange = (serviceId, champId, valeur) => {
        setFormulaires(prev => ({
            ...prev,
            [serviceId]: {
                ...prev[serviceId],
                [champId]: valeur
            }
        }));
    };

    // 🧮 Calcul du montant total estimé
    const montantTotal = services.reduce((acc, s) => acc + (parseFloat(s.prix) || 0), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 🏗️ Formate le Payload pour correspondre exactement à `createGlobalReservation`
        const reservationPayload = {
            clientNom: coordonnees.clientNom,
            telephone: coordonnees.telephone,
            adresse: coordonnees.adresse,
            dateIntervention: coordonnees.dateIntervention,
            heureIntervention: coordonnees.heureIntervention,
            commentaireGlobal: coordonnees.commentaireGlobal,
            fournisseurId: location.state?.fournisseurId || null,
            montantTotal: montantTotal,
            services: services.map(service => {
                const sId = service.id || service._id;
                return {
                    serviceId: String(sId),
                    nom: service.nom || service.titre,
                    prix: parseFloat(service.prix) || 0,
                    detailsParticuliers: formulaires[sId] || {}
                };
            })
        };

        console.log("🚀 PAYLOAD MULTI-SERVICES GÉNÉRÉ :", reservationPayload);
        localStorage.setItem('reservationPayload', JSON.stringify(reservationPayload));

        // Redirection vers la page de paiement
        navigate('/paiement', { state: { reservation: reservationPayload } });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#050608] text-white flex justify-center items-center font-sans">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-400 font-medium">Analyse et préparation des formulaires...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050608] text-slate-100 font-sans p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                <header className="text-center space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                        Détails de votre demande
                    </h1>
                    <p className="text-slate-400 text-sm md:text-base">
                        Veuillez préciser vos coordonnées et répondre aux détails de chaque prestation ({services.length})
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* 👤 SECTION 1 : COORDONNÉES ET DATE D'INTERVENTION */}
                    <div className="bg-[#131921] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                            <span className="text-2xl">📍</span>
                            <div>
                                <h2 className="text-xl font-bold text-white">Lieu & Date d'intervention</h2>
                                <p className="text-xs text-slate-400">Où et quand les prestataires doivent-ils intervenir ?</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                    Nom complet <span className="text-indigo-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="clientNom"
                                    required
                                    value={coordonnees.clientNom}
                                    onChange={handleCoordChange}
                                    placeholder="Ex: Jean Dupont"
                                    className="w-full bg-[#0a0f16] border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                    Téléphone de contact <span className="text-indigo-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="telephone"
                                    required
                                    value={coordonnees.telephone}
                                    onChange={handleCoordChange}
                                    placeholder="Ex: +227 90 00 00 00"
                                    className="w-full bg-[#0a0f16] border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                    Adresse exacte d'intervention <span className="text-indigo-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="adresse"
                                    required
                                    value={coordonnees.adresse}
                                    onChange={handleCoordChange}
                                    placeholder="Quartier, Rue, Repère à proximité..."
                                    className="w-full bg-[#0a0f16] border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                    Date souhaitée <span className="text-indigo-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="dateIntervention"
                                    required
                                    value={coordonnees.dateIntervention}
                                    onChange={handleCoordChange}
                                    className="w-full bg-[#0a0f16] border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                    Heure approximative
                                </label>
                                <input
                                    type="time"
                                    name="heureIntervention"
                                    value={coordonnees.heureIntervention}
                                    onChange={handleCoordChange}
                                    className="w-full bg-[#0a0f16] border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 🔄 SECTION 2 : BOUCLE SUR CHAQUE SERVICE */}
                    {services.map((service, index) => {
                        const sId = service.id || service._id;
                        const serviceType = service.type || 'rendez_vous'; 
                        const config = CONFIG_SERVICES[serviceType] || CONFIG_SERVICES.rendez_vous;

                        return (
                            <div key={sId || index} className="bg-[#131921] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
                                <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-black text-white shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold text-white">{service.nom || service.titre}</h2>
                                        <span className="text-xs text-indigo-400 uppercase tracking-wider font-semibold">
                                            {config.titre || 'Détails du service'}
                                        </span>
                                    </div>
                                    {service.prix > 0 && (
                                        <div className="text-right">
                                            <span className="text-xs text-slate-400 block">Tarif estimé</span>
                                            <span className="text-lg font-black text-emerald-400">
                                                {Number(service.prix).toLocaleString()} FCFA
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* 🎛️ GÉNÉRATION DES CHAMPS SPÉCIFIQUES POUR CE SERVICE */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {config.champs?.map((champ) => {
                                        const isVisible = champ.conditionAffiche 
                                            ? champ.conditionAffiche(formulaires[sId]) 
                                            : true;
                                        
                                        if (!isVisible) return null;

                                        return (
                                            <div key={champ.id} className={champ.demiLargeur ? "" : "md:col-span-2"}>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                                                    {champ.label} {champ.requis && <span className="text-indigo-500">*</span>}
                                                </label>

                                                {champ.type === 'select' ? (
                                                    <select 
                                                        required={champ.requis} 
                                                        value={formulaires[sId]?.[champ.id] || ''}
                                                        onChange={(e) => handleInputChange(sId, champ.id, e.target.value)} 
                                                        className="w-full bg-[#0a0f16] border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors"
                                                    >
                                                        <option value="">Sélectionnez...</option>
                                                        {champ.options?.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : champ.type === 'textarea' ? (
                                                    <textarea 
                                                        required={champ.requis} 
                                                        placeholder={champ.placeholder} 
                                                        value={formulaires[sId]?.[champ.id] || ''}
                                                        onChange={(e) => handleInputChange(sId, champ.id, e.target.value)} 
                                                        className="w-full bg-[#0a0f16] border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-indigo-500 h-24 transition-colors resize-none"
                                                    ></textarea>
                                                ) : (
                                                    <input 
                                                        type={champ.type || 'text'} 
                                                        required={champ.requis} 
                                                        placeholder={champ.placeholder} 
                                                        value={formulaires[sId]?.[champ.id] || ''}
                                                        onChange={(e) => handleInputChange(sId, champ.id, e.target.value)} 
                                                        className="w-full bg-[#0a0f16] border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* 📝 COMMENTAIRE GLOBAL OPTIONNEL */}
                    <div className="bg-[#131921] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                            Instructions ou consignes particulières (Optionnel)
                        </label>
                        <textarea
                            name="commentaireGlobal"
                            value={coordonnees.commentaireGlobal}
                            onChange={handleCoordChange}
                            placeholder="Informations complémentaires pour le ou les prestataires..."
                            className="w-full bg-[#0a0f16] border border-slate-700 p-4 rounded-xl text-white outline-none focus:border-indigo-500 h-20 transition-colors resize-none"
                        ></textarea>
                    </div>

                    {/* 💳 BOUTON STICKY DE VALIDATION */}
                    <div className="sticky bottom-4 z-10 p-4 md:p-5 bg-[#131921]/95 backdrop-blur-md border border-slate-800 rounded-2xl flex justify-between items-center shadow-2xl">
                        <div>
                            <p className="text-slate-400 text-xs md:text-sm">Total estimé ({services.length} prestation{services.length > 1 ? 's' : ''})</p>
                            <p className="text-white font-black text-xl md:text-2xl text-emerald-400">
                                {montantTotal > 0 ? `${montantTotal.toLocaleString()} FCFA` : 'Sur devis'}
                            </p>
                        </div>
                        <button 
                            type="submit" 
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 md:px-8 py-3.5 md:py-4 rounded-xl font-black text-base md:text-lg shadow-lg shadow-indigo-900/50 transition-all active:scale-95"
                        >
                            Passer au Paiement →
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default ReservationPage;