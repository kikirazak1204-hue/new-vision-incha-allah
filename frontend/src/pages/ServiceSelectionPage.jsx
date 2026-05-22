import React, { useState } from 'react';

const SERVICES_DISPONIBLES = [
    { code: 'ELECTRICITE', nom: 'Electricite', image: '/backgrounds/electricite.jpg' },
    { code: 'PLOMBERIE', nom: 'Plomberie', image: '/backgrounds/plomberie.jpg' },
    { code: 'MECANIQUE', nom: 'Mecanique', image: '/backgrounds/mecanique.jpg' },
    { code: 'RESTAURATION', nom: 'Restauration', image: '/backgrounds/restauration.jpg' },
    { code: 'CLIMATISATION', nom: 'Climatisation', image: '/backgrounds/peinture.jpg' },
    { code: 'TRANSPORTS', nom: 'Transports', emoji: '🚚', image: '/backgrounds/transport.jpg' },
];

export default function ServiceSelectionPage({ handleRetour, handleContinue }) {
    const [selectedServices, setSelectedServices] = useState([]);
    const [showWarning, setShowWarning] = useState(false);

    const toggleService = (service) => {
        if (selectedServices.find(s => s.code === service.code)) {
            setSelectedServices(selectedServices.filter(s => s.code !== service.code));
            setShowWarning(false);
        } else {
            if (selectedServices.length < 5) {
                setSelectedServices([...selectedServices, service]);
                setShowWarning(false);
            } else {
                setShowWarning(true);
            }
        }
    };

    const handleNext = () => {
        if (selectedServices.length > 0) {
            handleContinue(selectedServices);
        }
    };

    const isSelected = (serviceCode) => selectedServices.some(s => s.code === serviceCode);

    return (
        <div className="relative min-h-screen px-6 py-12 text-white">
            <div
                className="fixed inset-0 w-full h-full bg-cover bg-center -z-10"
                style={{ backgroundImage: 'url(/earth-rotating.svg)', backgroundColor: '#000814' }}
            />
            <div className="fixed inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50 -z-10" />

            <div className="max-w-4xl mx-auto">
                <div className="mb-10">
                    <button
                        onClick={handleRetour}
                        className="mb-4 inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                    >
                        &larr; Retour
                    </button>
                    <h1 className="text-5xl font-bold mb-3 flex items-center gap-3">
                        <img src="/jupiter-logo.svg" alt="New Vision" className="w-12 h-12" />
                        Selectionner vos services
                    </h1>
                    <p className="text-white/70 text-lg">
                        Choisissez 1 a 5 services pour votre reservation NEW VISION
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-xl">
                    <p className="text-white/60 mb-6 text-center">Cliquez sur les services souhaites</p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                        {SERVICES_DISPONIBLES.map((service) => (
                            <button
                                key={service.code}
                                onClick={() => toggleService(service)}
                                className={`relative h-56 rounded-xl overflow-hidden transition-colors duration-200 border-2 ${isSelected(service.code)
                                    ? 'border-purple-400 shadow-lg shadow-purple-500/40'
                                    : 'border-white/30 hover:border-purple-400/60'
                                    }`}
                            >
                                <img
                                    src={service.image}
                                    alt={service.nom}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    loading="lazy"
                                />
                                <div className={`absolute inset-0 ${isSelected(service.code)
                                    ? 'bg-purple-900/80'
                                    : 'bg-black/50'
                                    }`} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                                    <div className="text-5xl mb-2">{service.emoji}</div>
                                    <h3 className="text-lg font-bold text-white text-center">
                                        {service.nom}
                                    </h3>
                                </div>
                                {isSelected(service.code) && (
                                    <div className="absolute top-2 right-2 bg-purple-500 rounded-full w-8 h-8 flex items-center justify-center text-white text-2xl">
                                        ✓
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {showWarning && (
                        <div className="bg-orange-500/20 border border-orange-400/50 rounded-lg p-4 mb-8 text-orange-200">
                            Maximum 5 services autorises
                        </div>
                    )}

                    <div className="bg-purple-900/30 border border-purple-400/30 rounded-xl p-6 mb-8">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold">Services selectionnes</h3>
                            <span className="bg-purple-600 px-3 py-1 rounded-full text-sm font-bold">
                                {selectedServices.length}/5
                            </span>
                        </div>
                        {selectedServices.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {selectedServices.map((service) => (
                                    <div key={service.code} className="bg-purple-600/60 px-4 py-2 rounded-full flex items-center gap-2">
                                        <span>{service.emoji} {service.nom}</span>
                                        <button onClick={() => toggleService(service)} className="ml-1 text-white/60 hover:text-white">
                                            &#x2715;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-white/50 text-sm">Aucun service selectionne</p>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleRetour}
                            className="flex-1 px-6 py-3 rounded-lg border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={selectedServices.length === 0}
                            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${selectedServices.length > 0
                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Continuer vers la reservation &rarr;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 