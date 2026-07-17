import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, ShieldCheck, ArrowLeft, Briefcase, Calendar, Package, ArrowRight } from 'lucide-react';
import { getService, getFournisseursParService } from "../../util/api";

export default function ServiceDetailPage({
    setCurrentView = () => { },
    setSelectedFournisseur = () => { }
}) {
    const { id: urlId } = useParams();
    const navigate = useNavigate();

    const activeServiceId = urlId || localStorage.getItem('selectedServiceId');

    const [service, setService] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('selectedService')) || null;
        } catch {
            return null;
        }
    });

    const [fournisseurs, setFournisseurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recherche, setRecherche] = useState('');

    useEffect(() => {
        const fetchAll = async () => {
            if (!activeServiceId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const [serviceData, fournisseursData] = await Promise.all([
                    getService(activeServiceId),
                    getFournisseursParService(activeServiceId)
                ]);

                const fetchedService = serviceData.data || serviceData;
                if (fetchedService && !fetchedService.error) {
                    setService(fetchedService);
                    localStorage.setItem('selectedService', JSON.stringify(fetchedService));
                }

                setFournisseurs(fournisseursData.data || (Array.isArray(fournisseursData) ? fournisseursData : []));
            } catch (err) {
                console.error('Erreur lors du chargement des experts:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [activeServiceId]);

    // 🚀 GESTION DES CLICS SUR UNE CARTE PRESTATAIRE
    const handleAction = (type, fournisseur) => {
        const fId = fournisseur.id || fournisseur._id;
        localStorage.setItem('selectedFournisseur', JSON.stringify(fournisseur));
        setSelectedFournisseur(fournisseur);

        if (type === 'commander') {
            // Ouvre les produits de CE prestataire uniquement
            navigate(`/produits/${fId}`, { state: { service, fournisseur } });
        } else if (type === 'reserver') {
            navigate('/reservation', { state: { service, fournisseur } });
        }
    };

    // 🌟 GESTION DU CLIC GLOBAL : VOIR TOUS LES PRODUITS DU SERVICE
    const handleVoirTousLesProduitsDuService = () => {
        // Redirige vers une route qui affichera tous les produits du service
        navigate(`/produits/service/${activeServiceId}`, { state: { service, vueGlobale: true } });
    };

    const fournisseursFiltres = fournisseurs.filter((f) =>
        (f.nomEntreprise || '').toLowerCase().includes(recherche.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-purple-400">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-xl tracking-widest uppercase">Chargement des experts...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans selection:bg-purple-500/30">
            <div className="max-w-6xl mx-auto">

                {/* BOUTON RETOUR */}
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-all hover:translate-x-[-5px] font-medium"
                >
                    <ArrowLeft size={20} /> Retour au catalogue
                </button>

                {/* EN-TÊTE DU SERVICE + BOUTON GLOBAL PRODUITS */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12 bg-slate-900/40 p-8 rounded-3xl border border-slate-800/80 backdrop-blur-sm">
                    <div className="flex-1">
                        <span className="text-xs font-black tracking-widest text-purple-400 uppercase bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 mb-3 inline-block">
                            Service Spécialisé
                        </span>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
                            {service?.nom || "Service d'expertise"}
                        </h1>
                        <p className="text-slate-400 text-base md:text-lg mb-6 max-w-2xl">
                            Choisissez un expert certifié ci-dessous pour une intervention, ou parcourez directement tous les produits et matériels disponibles pour ce service.
                        </p>

                        {/* ⭐ LE BOUTON UNIQUE POUR VOIR TOUS LES PRODUITS DU SERVICE ⭐ */}
                        <button
                            onClick={handleVoirTousLesProduitsDuService}
                            className="inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-purple-900/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm md:text-base group border border-purple-400/20"
                        >
                            <Package className="text-purple-200" size={20} />
                            <span>Voir tous les produits : <strong className="underline decoration-wavy decoration-purple-300">{service?.nom}</strong></span>
                            <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* BARRE DE RECHERCHE */}
                    <div className="relative w-full lg:w-80 shrink-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            className="w-full bg-slate-900/90 border border-slate-700/80 p-3.5 pl-12 rounded-2xl text-white outline-none focus:border-purple-500 transition-all text-sm shadow-inner"
                            placeholder="Filtrer par nom d'expert..."
                            value={recherche}
                            onChange={(e) => setRecherche(e.target.value)}
                        />
                    </div>
                </div>

                {/* LISTE DES PRESTATAIRES */}
                <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span>Experts disponibles</span>
                        <span className="text-sm font-semibold text-slate-500 bg-slate-900 px-3 py-0.5 rounded-full border border-slate-800">
                            {fournisseursFiltres.length}
                        </span>
                    </h2>
                </div>

                {fournisseursFiltres.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800">
                        <p className="text-slate-500 text-lg">Aucun expert ne correspond à votre recherche pour ce service.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {fournisseursFiltres.map((f) => (
                            <div key={f.id || f._id} className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl hover:border-purple-500/50 transition-all flex flex-col shadow-xl group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner text-white">
                                        {f.nomEntreprise?.charAt(0).toUpperCase() || 'P'}
                                    </div>
                                    {f.statut === 'CONFORME' && (
                                        <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider">
                                            <ShieldCheck size={12} /> Certifié
                                        </span>
                                    )}
                                </div>

                                <h3 className="font-bold text-xl text-white mb-1 group-hover:text-purple-400 transition-colors">{f.nomEntreprise || "Prestataire"}</h3>
                                <p className="text-xs text-slate-400 mb-6 flex items-center gap-1.5">
                                    <MapPin size={14} className="text-purple-500 shrink-0" /> {f.adresse || "Adresse non précisée"}
                                </p>

                                <div className="mt-auto flex gap-3 pt-4 border-t border-slate-800/80">
                                    {/* ⭐ BOUTON COMMANDER (Chez ce prestataire uniquement) */}
                                    <button
                                        onClick={() => handleAction('commander', f)}
                                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 border border-slate-700/50"
                                    >
                                        <Briefcase size={16} className="text-purple-400" /> Commander
                                    </button>

                                    {/* ⭐ BOUTON RÉSERVER */}
                                    <button
                                        onClick={() => handleAction('reserver', f)}
                                        className="flex-1 py-3 bg-white hover:bg-purple-500 text-slate-950 hover:text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                                    >
                                        <Calendar size={16} /> Réserver
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}