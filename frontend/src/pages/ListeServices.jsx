import React, { useEffect, useState } from 'react';

export default function ListeServices() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/services`)
            .then(r => r.json())
            .then(data => {
                setServices(Array.isArray(data?.data) ? data.data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Erreur services:', err);
                setServices([]);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-white text-center py-12 text-xl animate-fadeIn">Chargement...</div>;
    if (!services.length) return <div className="text-white text-center py-12 text-xl">Aucun service disponible.</div>;

    return (
        <div className="relative px-6 py-12 text-white animate-fadeIn">
            <div className="fixed top-0 left-0 w-full h-full bg-cover bg-center z-[-1] opacity-30 blur-sm" style={{ backgroundImage: `url('/backgrounds/kiki2.jpg')` }} />
            <div className="max-w-5xl mx-auto bg-black/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
                <h2 className="text-4xl font-bold text-center mb-8">🌍 Nos Services</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {services.map(service => (
                        <div key={service.id || service.nom} className="bg-white/10 p-6 rounded-xl hover:bg-white/20 transition-transform hover:scale-105 shadow-md">
                            <h3 className="text-2xl font-semibold mb-2">{service.emoji || '🛠️'} {service.nom}</h3>
                            <p className="text-white/70">{service.description || 'Aucune description.'}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}