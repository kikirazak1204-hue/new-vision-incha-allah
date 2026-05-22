import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ListeServices() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/services`)
            .then(r => r.json())
            .then(data => {
                setServices(Array.isArray(data?.data) ? data.data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Erreur services:', err);
                setError('Impossible de charger les services');
                setServices([]);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-xl font-semibold">Chargement des services...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center max-w-md">
                    <p className="text-red-200 text-lg">⚠️ {error}</p>
                </div>
            </div>
        );
    }

    if (!services.length) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <p className="text-xl">Aucun service disponible pour le moment.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-4 py-12">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-12">
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        🌟 Nos Services
                    </h1>
                    <p className="text-white/70 text-lg max-w-2xl mx-auto">
                        Découvrez notre large gamme de services professionnels pour tous vos besoins
                    </p>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map(service => (
                        <div
                            key={service.id || service.nom}
                            onClick={() => navigate(`/fournisseurs/${service.id}`)}
                            className="group cursor-pointer"
                        >
                            <div className="relative h-64 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/5">
                                {/* Image ou Placeholder */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                                    style={{
                                        backgroundImage: service.image
                                            ? `url('${service.image}')`
                                            : `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
                                    }}
                                >
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-300" />
                                </div>

                                {/* Content */}
                                <div className="relative h-full flex flex-col justify-end p-6 text-white">
                                    {/* Emoji Icon */}
                                    <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                                        {service.emoji || '🛠️'}
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-2xl font-bold mb-2 group-hover:translate-y-0 transition-transform">
                                        {service.nom}
                                    </h3>

                                    {/* Description - visible on hover on mobile, always visible on larger screens */}
                                    <p className="text-white/80 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 lg:opacity-100 transition-opacity duration-300">
                                        {service.description || 'Service professionnel de qualité'}
                                    </p>

                                    {/* Arrow - visible on hover */}
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <svg className="w-6 h-6 text-white transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Info Bar */}
                            <div className="mt-3 px-2 text-white/70 text-sm">
                                <p className="font-semibold text-white">{service.nom}</p>
                                <p className="truncate hover:text-white transition-colors">
                                    Voir les fournisseurs →
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Section */}
            <div className="max-w-6xl mx-auto mt-16">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Besoin d'aide ?</h2>
                    <p className="text-white/70 mb-4">
                        Sélectionnez un service pour découvrir nos prestataires professionnels
                    </p>
                    <p className="text-white/60 text-sm">
                        Tous nos services sont garantis avec des experts qualifiés et expérimentés
                    </p>
                </div>
            </div>
        </div>
    );
}