import React, { useState, useEffect } from 'react';

const SERVICES_DISPONIBLES = [
    { code: 'ELECTRICITE', nom: 'Électricité', emoji: '🔌' },
    { code: 'PLOMBERIE', nom: 'Plomberie', emoji: '🚰' },
    { code: 'MECANIQUE', nom: 'Mécanique', emoji: '🚗' },
    { code: 'RESTAURATION', nom: 'Restauration', emoji: '🍽️' },
    { code: 'CLIMATISATION', nom: 'Climatisation', emoji: '❄️' },
    { code: 'TRANSPORTS', nom: 'Transports', emoji: '🚚' },
];

export default function ServiceSelectionPage({ handleRetour, handleContinue }) {
    const [selectedServices, setSelectedServices] = useState([]);
    const [showWarning, setShowWarning] = useState(false);

    const toggleService = (service) => {
        if (selectedServices.find(s => s.code === service.code)) {
            // Retirer le service
            setSelectedServices(selectedServices.filter(s => s.code !== service.code));
            setShowWarning(false);
        } else {
            // Ajouter le service (max 5)
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

    const isSelected = (serviceCode) => {
        return selectedServices.some(s => s.code === serviceCode);
    };

    return (
        <div className="relative min-h-screen px-6 py-12 text-white">
            <div
                className="fixed inset-0 w-full h-full bg-cover bg-center -z-10"
                style={{
                    backgroundImage: 'url(/backgrounds/kiki1.jpg)',
                    backgroundColor: '#0A0A0F',
                }}
            />
            <div className="fixed inset-0 bg-black/50 -z-10" />

            <div className="max-w-4xl mx-auto">
                {/* En-tête */}
                <div className="mb-10">
                    <button
                        onClick={handleRetour}
                        className="mb-4 inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                    >
                        ← Retour
                    </button>

                    <h1 className="text-4xl font-bold mb-3">
                        🔧 Sélectionner vos services
                    </h1>
                    <p className="text-white/70 text-lg">
                        Choisissez 1 à 5 services pour votre réservation
                    </p>
                </div>

                {/* Zone de sélection */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-xl">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                        {SERVICES_DISPONIBLES.map((service) => (
                            <button
                                key={service.code}
                                onClick={() => toggleService(service)}
                                className={`relative p-4 rounded-xl transition-all duration-200 border-2 ${
                                    isSelected(service.code)
                                        ? 'bg-purple-600/40 border-purple-400 shadow-lg shadow-purple-500/30'
                                        : 'bg-white/5 border-white/20 hover:border-purple-400/50 hover:bg-white/10'
                                }`}
                            >
                                <div className="text-4xl mb-2">{service.emoji}</div>
                                <div className="text-sm font-semibold line-clamp-2">
                                    {service.nom}
                                </div>

                                {/* Checkmark pour services sélectionnés */}
                                {isSelected(service.code) && (
                                    <div className="absolute top-2 right-2 bg-purple-500 rounded-full w-6 h-6 flex items-center justify-center">
                                        <span className="text-white font-bold">✓</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Avertissement */}
                    {showWarning && (
                        <div className="bg-orange-500/20 border border-orange-400/50 rounded-lg p-4 mb-8 text-orange-200">
                            ⚠️ Maximum 5 services autorisés
                        </div>
                    )}

                    {/* Récapitulatif */}
                    <div className="bg-purple-900/30 border border-purple-400/30 rounded-xl p-6 mb-8">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold">Services sélectionnés</h3>
                            <span className="bg-purple-600 px-3 py-1 rounded-full text-sm font-bold">
                                {selectedServices.length}/5
                            </span>
                        </div>

                        {selectedServices.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {selectedServices.map((service) => (
                                    <div
                                        key={service.code}
                                        className="bg-purple-600/60 px-4 py-2 rounded-full flex items-center gap-2"
                                    >
                                        <span>{service.emoji} {service.nom}</span>
                                        <button
                                            onClick={() => toggleService(service)}
                                            className="ml-1 text-white/60 hover:text-white"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-white/50 text-sm">Aucun service sélectionné</p>
                        )}
                    </div>

                    {/* Boutons d'action */}
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
                            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                                selectedServices.length > 0
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            Continuer vers la réservation →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
