import React, { useState } from 'react';

const SERVICES_DISPONIBLES = [
    {
        code: 'ELECTRICITE',
        nom: 'Électricité',
        description: 'Dépannage et installation électrique',
        image: '/backgrounds/electricite.png',
    },
    {
        code: 'PLOMBERIE',
        nom: 'Plomberie',
        description: 'Fuites et installations sanitaires',
        image: '/backgrounds/plomberie.png',
    },
    {
        code: 'MECANIQUE',
        nom: 'Mécanique',
        description: 'Réparation de tous engins et véhicules',
        image: '/backgrounds/mecanique.jpg',
    },
    {
        code: 'CLIMATISATION',
        nom: 'Climatisation',
        description: 'Installation et maintenance',
        image: '/backgrounds/climatisation.png',
    },
    {
        code: 'TRANSPORTS',
        nom: 'Transports / Taxi',
        description: 'Déplacement, livraison, taxi',
        image: '/backgrounds/transport.png',
    },
];

export default function ServiceSelectionPage({ handleRetour, handleContinue }) {
    const [selectedServices, setSelectedServices] = useState([]);
    const [showWarning, setShowWarning] = useState(false);

    const toggleService = (service) => {
        if (selectedServices.find((s) => s.code === service.code)) {
            setSelectedServices(selectedServices.filter((s) => s.code !== service.code));
            setShowWarning(false);
        } else if (selectedServices.length < 5) {
            setSelectedServices([...selectedServices, service]);
            setShowWarning(false);
        } else {
            setShowWarning(true);
        }
    };

    const handleNext = () => {
        if (selectedServices.length > 0) handleContinue(selectedServices);
    };

    const isSelected = (code) => selectedServices.some((s) => s.code === code);

    return (
        <div className="relative min-h-screen px-4 md:px-8 py-12 text-white overflow-hidden">
            <div className="fixed inset-0 -z-10 bg-gradient-to-br from-black via-[#12081f] to-[#1a0f2e]" />

            <div className="max-w-5xl mx-auto">
                <div className="mb-10">
                    <button
                        onClick={handleRetour}
                        className="mb-6 inline-flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all text-sm"
                    >
                        ← Retour
                    </button>

                    <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/70 mb-3">
                        Nouvelle réservation
                    </p>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                        Choisissez <span className="text-purple-300">vos services</span>
                    </h1>

                    <p className="mt-2 text-sm text-white/60 max-w-xl">
                        Sélectionnez de 1 à 5 services. Nos prestataires qualifiés interviendront rapidement.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                    {SERVICES_DISPONIBLES.map((service) => (
                        <button
                            key={service.code}
                            onClick={() => toggleService(service)}
                            className={`group relative overflow-hidden rounded-2xl h-56 flex flex-col items-center justify-end text-center transition-all duration-300 border-2
                ${isSelected(service.code)
                                    ? 'border-purple-400 shadow-xl shadow-purple-500/25'
                                    : 'border-white/10 hover:border-purple-400/50'
                                }`}
                        >
                            <img
                                src={service.image}
                                alt={service.nom}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

                            <div className="relative z-10 w-full p-4">
                                <h3 className="text-lg font-bold text-white">{service.nom}</h3>
                                <p className="text-xs text-white/80 mt-1">{service.description}</p>
                            </div>

                            {isSelected(service.code) && (
                                <div className="absolute top-3 right-3 z-20 bg-purple-500 rounded-full w-7 h-7 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                    ✓
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {showWarning && (
                    <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl p-4 mb-6 text-amber-200 flex items-center gap-3 text-sm">
                        <span>⚠️</span>
                        <p>Maximum 5 services sélectionnables.</p>
                    </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-white">Services sélectionnés</h3>
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${selectedServices.length > 0
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/10 text-white/50'
                                }`}
                        >
                            {selectedServices.length}/5
                        </span>
                    </div>

                    {selectedServices.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {selectedServices.map((service) => (
                                <div
                                    key={service.code}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/40 border border-purple-400/40 rounded-full text-sm"
                                >
                                    <span className="text-white">{service.nom}</span>
                                    <button
                                        onClick={() => toggleService(service)}
                                        className="text-white/50 hover:text-white ml-1 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-white/40 text-sm italic">Aucun service sélectionné</p>
                    )}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleRetour}
                        className="flex-1 px-6 py-3 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 font-semibold transition-all text-sm"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={selectedServices.length === 0}
                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all text-sm flex items-center justify-center gap-2 ${selectedServices.length > 0
                                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:scale-[1.02]'
                                : 'bg-white/10 text-white/30 cursor-not-allowed'
                            }`}
                    >
                        Continuer vers la réservation →
                    </button>
                </div>
            </div>
        </div>
    );
}