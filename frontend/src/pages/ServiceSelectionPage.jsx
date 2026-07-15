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
            s.nom?.toLowerCase().includes(recherche.toLowerCase())
        );
    }, [recherche, allServices]);

    const toggleService = (service) => {
        const estDejaSelectionne = selectedServices.find(s => s.id === service.id);
        if (estDejaSelectionne) {
            setSelectedServices(selectedServices.filter(s => s.id !== service.id));
        } else if (selectedServices.length < 5) {
            setSelectedServices([...selectedServices, service]);
        }
    };

    // ✅ Transmet la sélection via location.state vers ReservationPage
    const handleValider = () => {
        if (selectedServices.length === 0) return;
        // ReservationPage attend { service, fournisseur } dans son state
        // On transmet le premier service sélectionné (V1 = un seul service par réservation)
        navigate('/reservation', { state: { service: selectedServices[0] } });
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 pb-24">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate('/')} className="mb-6 text-slate-500 hover:text-white transition flex items-center gap-2">
                    ← Retour à l'accueil
                </button>

                <h1 className="text-3xl font-black mb-6">Sélectionnez votre service</h1>

                <input
                    type="text"
                    placeholder="Rechercher un service..."
                    className="w-full p-4 mb-8 bg-slate-900 border border-slate-800 rounded-2xl outline-none focus:border-indigo-500"
                    onChange={(e) => setRecherche(e.target.value)}
                />

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Chargement...</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {filteredServices.length > 0 ? (
                            filteredServices.map((service) => (
                                <button
                                    key={service.id}
                                    onClick={() => toggleService(service)}
                                    className={`p-4 rounded-xl border text-sm font-medium transition-all ${
                                        selectedServices.some(s => s.id === service.id)
                                        ? 'bg-indigo-600 border-indigo-400 text-white'
                                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    {service.nom}
                                </button>
                            ))
                        ) : (
                            <p className="col-span-full text-center text-slate-500">Aucun service trouvé.</p>
                        )}
                    </div>
                )}
            </div>

            <div className="fixed bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 p-4 flex justify-between items-center px-8">
                <p className="text-sm font-bold">{selectedServices.length} / 5 sélectionnés</p>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/')} className="text-slate-400">Annuler</button>
                    <button
                        onClick={handleValider}
                        disabled={selectedServices.length === 0}
                        className="bg-indigo-600 px-6 py-3 rounded-xl font-black disabled:opacity-30"
                    >
                        Continuer
                    </button>
                </div>
            </div>
        </div>
    );
}