// ============================================================
// Fichier : src/pages/ServiceSelectionPage.jsx
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ServiceSelectionPage() {
    const navigate = useNavigate();
    const [selectedServices, setSelectedServices] = useState([]);
    const [recherche, setRecherche] = useState('');
    const [allServices, setAllServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/services`);
                const data = await res.json();
                const servicesArray = Array.isArray(data) ? data : (data.services || data.data || []);
                setAllServices(servicesArray);
            } catch (error) {
                console.error("Erreur lors du chargement des services:", error);
                setAllServices([]);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    const filteredServices = useMemo(() => {
        if (!Array.isArray(allServices)) return [];
        return allServices.filter(s =>
            (s.nom || s.titre)?.toLowerCase().includes(recherche.toLowerCase())
        );
    }, [recherche, allServices]);

    const toggleService = (service) => {
        const serviceId = service.id || service._id;
        const estDejaSelectionne = selectedServices.find(s => (s.id || s._id) === serviceId);
        
        if (estDejaSelectionne) {
            setSelectedServices(selectedServices.filter(s => (s.id || s._id) !== serviceId));
        } else if (selectedServices.length < 5) {
            setSelectedServices([...selectedServices, service]);
        }
    };

    const handleValider = () => {
        if (selectedServices.length === 0) return;
        localStorage.setItem('selectedServices', JSON.stringify(selectedServices));
        navigate('/reservation', { state: { services: selectedServices } });
    };

    return (
        <div className="min-h-screen bg-[#0f1111] text-slate-100 font-sans pb-32">
            
            <header className="bg-[#131921] border-b border-slate-800 px-6 py-5 sticky top-0 z-40 shadow-lg">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <button 
                        onClick={() => navigate('/')} 
                        className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition flex items-center gap-2"
                    >
                        ← Retour à l'accueil
                    </button>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                        Sélection des services
                    </span>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
                <h1 className="text-2xl sm:text-3xl font-black mb-2">Choisissez vos services</h1>
                <p className="text-sm text-slate-400 mb-8">Sélectionnez les services dont vous avez besoin pour votre demande.</p>

                <input
                    type="text"
                    placeholder="Rechercher un service..."
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    className="w-full p-4 mb-8 bg-[#131921] border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all shadow-xl"
                />

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Chargement...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredServices.map((service) => {
                            const serviceId = service.id || service._id;
                            const estSelectionne = selectedServices.some(s => (s.id || s._id) === serviceId);

                            return (
                                <button
                                    key={serviceId}
                                    type="button"
                                    onClick={() => toggleService(service)}
                                    className={`p-5 rounded-2xl border text-left transition-all flex flex-col gap-3 shadow-lg ${
                                        estSelectionne
                                            ? 'bg-indigo-600/10 border-indigo-500'
                                            : 'bg-[#131921] border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg text-white">{service.nom || service.titre}</h3>
                                        {estSelectionne && <span className="text-indigo-400 font-bold">✓</span>}
                                    </div>
                                    
                                    {/* Bloc de détails ajoutés */}
                                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Détails de la prestation</h4>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            {service.description || "Aucune description spécifique fournie pour ce service. Vous pourrez ajouter vos précisions lors de la validation."}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </main>

            <div className="fixed bottom-0 left-0 w-full bg-[#131921]/95 backdrop-blur-xl border-t border-slate-800 p-4 z-40">
                <div className="max-w-5xl mx-auto flex justify-between items-center px-6">
                    <p className="text-sm font-bold">{selectedServices.length} sélectionné(s)</p>
                    <button
                        onClick={handleValider}
                        disabled={selectedServices.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black transition-all disabled:opacity-30"
                    >
                        Continuer
                    </button>
                </div>
            </div>
        </div>
    );
}