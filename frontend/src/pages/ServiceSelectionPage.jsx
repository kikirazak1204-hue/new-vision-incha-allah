import React, { useState, useCallback } from 'react';

const Icons = {
    Menuiserie: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <path d="M3 7h18M3 12h18M3 17h18" />
            <rect x="2" y="4" width="20" height="16" rx="2" />
        </svg>
    ),
    Plomberie: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <path d="M12 2v6m0 0c-2.5 0-5 2-5 5v4a2 2 0 002 2h6a2 2 0 002-2v-4c0-3-2.5-5-5-5z" />
            <path d="M9 21v1m6-1v1" />
        </svg>
    ),
    Electricite: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    Transport: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <path d="M16 8h4l3 5v4h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
    ),
    Securite: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    Menage: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
};

// Images Unsplash choisies pour correspondre exactement à chaque métier
const SERVICES_DISPONIBLES = [
    {
        code: 'MENUISERIE',
        nom: 'Menuiserie',
        description: 'Portes, fenêtres, meubles sur mesure',
        // Menuisier qui travaille le bois avec des outils
        image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80&fit=crop',
        accent: 'bg-amber-500',
        border: 'border-amber-400',
        shadow: 'shadow-amber-500/30',
        IconComponent: Icons.Menuiserie,
    },
    {
        code: 'PLOMBERIE',
        nom: 'Plomberie',
        description: 'Fuites, robinetterie et installations sanitaires',
        image: 'https://images.unsplash.com/photo-pfyRJmmnBnE?w=600&q=80&fit=crop',
        accent: 'bg-blue-500',
        border: 'border-blue-400',
        shadow: 'shadow-blue-500/30',
        IconComponent: Icons.Plomberie,
    },
    {
        code: 'ELECTRICITE',
        nom: 'Électricité',
        description: 'Dépannage, câblage et installation électrique',
        // Électricien qui travaille sur un tableau électrique
        image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&fit=crop',
        accent: 'bg-yellow-500',
        border: 'border-yellow-400',
        shadow: 'shadow-yellow-500/30',
        IconComponent: Icons.Electricite,
    },
    {
        code: 'TRANSPORT',
        nom: 'Transport / Taxi',
        description: 'Déplacement, livraison et taxi',
        // Taxi / voiture en ville
        image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80&fit=crop',
        accent: 'bg-green-500',
        border: 'border-green-400',
        shadow: 'shadow-green-500/30',
        IconComponent: Icons.Transport,
    },
    {
        code: 'SECURITE',
        nom: 'Sécurité',
        description: 'Gardiennage, surveillance et protection',
        // Agent de sécurité en uniforme
        image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&q=80&fit=crop',
        accent: 'bg-red-500',
        border: 'border-red-400',
        shadow: 'shadow-red-500/30',
        IconComponent: Icons.Securite,
    },
    {
        code: 'MENAGE',
        nom: 'Ménage',
        description: 'Nettoyage, entretien et désinfection',
        // Personne qui fait le ménage / nettoyage
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80&fit=crop',
        accent: 'bg-teal-500',
        border: 'border-teal-400',
        shadow: 'shadow-teal-500/30',
        IconComponent: Icons.Menage,
    },
];

const ServiceCard = React.memo(({ service, selected, onToggle }) => {
    const { nom, description, image, accent, border, shadow, IconComponent } = service;
    const [imgError, setImgError] = useState(false);

    return (
        <button
            type="button"
            onClick={() => onToggle(service)}
            aria-pressed={selected}
            aria-label={`${selected ? 'Désélectionner' : 'Sélectionner'} ${nom}`}
            className={[
                'group relative overflow-hidden rounded-2xl h-48 w-full',
                'flex flex-col items-center justify-end text-center',
                'transition-all duration-200 border-2',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                selected
                    ? `${border} shadow-xl ${shadow}`
                    : 'border-white/10 hover:border-white/30 active:scale-[0.98]',
            ].join(' ')}
        >
            {/* Image de fond */}
            {!imgError ? (
                <img
                    src={image}
                    alt=""
                    aria-hidden="true"
                    onError={() => setImgError(true)}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                />
            ) : (
                // Fallback SVG si l'image ne charge pas
                <div className={`absolute inset-0 bg-gradient-to-br ${accent === 'bg-amber-500' ? 'from-amber-700 to-amber-900' :
                    accent === 'bg-blue-500' ? 'from-blue-700 to-blue-900' :
                        accent === 'bg-yellow-500' ? 'from-yellow-600 to-yellow-900' :
                            accent === 'bg-green-500' ? 'from-green-700 to-green-900' :
                                accent === 'bg-red-500' ? 'from-red-700 to-red-900' :
                                    'from-teal-700 to-teal-900'
                    } flex items-center justify-center`}>
                    <div className="text-white/30">
                        <IconComponent />
                    </div>
                </div>
            )}

            {/* Overlay dégradé pour lisibilité du texte */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />

            {/* Overlay sélection */}
            {selected && (
                <div className="absolute inset-0 bg-purple-600/20" />
            )}

            {/* Texte en bas */}
            <div className="relative z-10 w-full p-4 text-left">
                <h3 className="text-base font-bold text-white leading-tight">{nom}</h3>
                <p className="text-xs text-white/80 mt-0.5 leading-snug">{description}</p>
            </div>

            {/* Badge check */}
            {selected && (
                <div className={`absolute top-3 right-3 z-20 ${accent} rounded-full w-6 h-6 flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                    ✓
                </div>
            )}
        </button>
    );
});

ServiceCard.displayName = 'ServiceCard';

export default function ServiceSelectionPage({ handleRetour, handleContinue }) {
    const [selectedServices, setSelectedServices] = useState([]);
    const [showWarning, setShowWarning] = useState(false);

    const toggleService = useCallback((service) => {
        setSelectedServices((prev) => {
            const alreadySelected = prev.some((s) => s.code === service.code);
            if (alreadySelected) {
                setShowWarning(false);
                return prev.filter((s) => s.code !== service.code);
            }
            if (prev.length >= 5) {
                setShowWarning(true);
                return prev;
            }
            setShowWarning(false);
            return [...prev, service];
        });
    }, []);

    const removeService = useCallback((code) => {
        setSelectedServices((prev) => prev.filter((s) => s.code !== code));
        setShowWarning(false);
    }, []);

    const handleNext = useCallback(() => {
        if (selectedServices.length > 0 && typeof handleContinue === 'function') {
            handleContinue(selectedServices);
        }
    }, [selectedServices, handleContinue]);

    const handleBack = useCallback(() => {
        if (typeof handleRetour === 'function') handleRetour();
    }, [handleRetour]);

    const canContinue = selectedServices.length > 0;

    return (
        <div className="relative min-h-screen px-4 md:px-8 py-10 text-white overflow-x-hidden">
            {/* Fond fixe */}
            <div
                className="fixed inset-0 -z-10"
                style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #12081f 50%, #1a0f2e 100%)' }}
                aria-hidden="true"
            />

            <div className="max-w-5xl mx-auto">
                {/* En-tête */}
                <header className="mb-8">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="mb-5 inline-flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                    >
                        ← Retour
                    </button>

                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/70 mb-3 select-none">
                        Nouvelle réservation
                    </span>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                        Choisissez{' '}
                        <span className="text-purple-300">vos services</span>
                    </h1>

                    <p className="mt-2 text-sm text-white/60 max-w-xl">
                        Sélectionnez de 1 à 5 services. Nos prestataires qualifiés interviennent rapidement.
                    </p>
                </header>

                {/* Grille des services */}
                <div
                    role="group"
                    aria-label="Services disponibles"
                    className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6"
                >
                    {SERVICES_DISPONIBLES.map((service) => (
                        <ServiceCard
                            key={service.code}
                            service={service}
                            selected={selectedServices.some((s) => s.code === service.code)}
                            onToggle={toggleService}
                        />
                    ))}
                </div>

                {/* Alerte max */}
                {showWarning && (
                    <div
                        role="alert"
                        className="bg-amber-500/15 border border-amber-500/40 rounded-xl p-4 mb-5 text-amber-200 flex items-center gap-3 text-sm"
                    >
                        <span aria-hidden="true">⚠️</span>
                        <p>Vous avez atteint la limite de 5 services sélectionnables.</p>
                    </div>
                )}

                {/* Récapitulatif */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-sm font-semibold text-white">Services sélectionnés</h2>
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${canContinue ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/50'
                                }`}
                        >
                            {selectedServices.length}/5
                        </span>
                    </div>

                    {canContinue ? (
                        <ul className="flex flex-wrap gap-2" aria-label="Services choisis">
                            {selectedServices.map((service) => (
                                <li key={service.code}>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/40 border border-purple-400/40 rounded-full text-sm">
                                        <span className="text-white">{service.nom}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeService(service.code)}
                                            aria-label={`Retirer ${service.nom}`}
                                            className="text-white/50 hover:text-white transition-colors focus:outline-none focus-visible:text-white"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-white/40 text-sm italic">Aucun service sélectionné</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 px-6 py-3 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 font-semibold transition-all text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={!canContinue}
                        aria-disabled={!canContinue}
                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all text-sm flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${canContinue
                            ? 'bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white shadow-lg'
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