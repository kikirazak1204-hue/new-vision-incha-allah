import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, ShieldCheck, ArrowLeft, Briefcase, Calendar } from 'lucide-react';
import { getService, getFournisseursParService } from "../../util/api";

export default function ServiceDetailPage({
    setCurrentView = () => {},
    setSelectedFournisseur = () => {}
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

    // 🚀 GESTIONNAIRE DE COMMANDES / RÉSERVATIONS SÉCURISÉ
    const handleAction = (type, fournisseur) => {
        const fId = fournisseur.id || fournisseur._id;

        // On met le fournisseur cliqué dans le coffre-fort du navigateur
        localStorage.setItem('selectedFournisseur', JSON.stringify(fournisseur));
        setSelectedFournisseur(fournisseur); // Rétrocompatibilité

        if (type === 'commander') {
            navigate(`/produits/${fId}`); // Ouvre la route déclarée dans App.jsx !
        } else if (type === 'reserver') {
            // ✅ Transmet service + fournisseur via location.state pour ReservationPage
            navigate('/reservation', { state: { service, fournisseur } });
        }
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
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
            <div className="max-w-6xl mx-auto">

                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-all hover:translate-x-[-5px]"
                >
                    <ArrowLeft size={20} /> Retour au catalogue
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
                    <div>
                        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2">
                            {service?.nom || "Service d'expertise"}
                        </h1>
                        <p className="text-slate-400 text-lg">Choisissez le meilleur expert pour votre besoin.</p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            className="w-full bg-slate-900 border border-slate-800 p-4 pl-12 rounded-2xl text-white outline-none focus:border-purple-500 transition-all"
                            placeholder="Rechercher un prestataire..."
                            value={recherche}
                            onChange={(e) => setRecherche(e.target.value)}
                        />
                    </div>
                </div>

                {fournisseursFiltres.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800">
                        <p className="text-slate-500 text-lg">Aucun expert ne correspond à votre recherche pour ce service.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {fournisseursFiltres.map((f) => (
                            <div key={f.id || f._id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-purple-500/50 transition-all flex flex-col shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner">
                                        {f.nomEntreprise?.charAt(0).toUpperCase() || 'P'}
                                    </div>
                                    {f.statut === 'CONFORME' && (
                                        <span className="flex items-center gap-1 text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded-full border border-green-500/20 font-bold uppercase">
                                            <ShieldCheck size={12} /> Certifié
                                        </span>
                                    )}
                                </div>

                                <h3 className="font-bold text-xl text-white mb-2">{f.nomEntreprise || "Prestataire"}</h3>
                                <p className="text-sm text-slate-400 mb-6 flex items-center gap-2">
                                    <MapPin size={16} className="text-purple-500 shrink-0" /> {f.adresse || "Adresse non précisée"}
                                </p>

                                <div className="mt-auto flex gap-3">
                                    <button
                                        onClick={() => handleAction('commander', f)}
                                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
                                    >
                                        <Briefcase size={16} /> Commander
                                    </button>
                                    <button
                                        onClick={() => handleAction('reserver', f)}
                                        className="flex-1 py-3 bg-white hover:bg-purple-500 text-slate-900 hover:text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
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