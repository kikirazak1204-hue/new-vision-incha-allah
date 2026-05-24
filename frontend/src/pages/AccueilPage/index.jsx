import React from 'react';
import BoutonDashboard from '../../components/BoutonDashboard';

const TagService = ({ emoji, label }) => (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white/80">
        <span className="text-base">{emoji}</span>
        <span className="text-xs truncate">{label}</span>
    </div>
);

const getDescriptionService = (nom = '') => {
    const n = nom.toLowerCase();
    if (n.includes('plomberie')) return 'Fuite, robinet, tuyauterie, installation sanitaire.';
    if (n.includes('électricité') || n.includes('electricite')) return 'Panne de courant, installation, tableau électrique.';
    if (n.includes('transport') || n.includes('taxi')) return 'Déplacement, livraison, taxi à domicile.';
    if (n.includes('mécanique') || n.includes('mecanique')) return 'Panne de voiture, entretien, réparation moteur.';
    if (n.includes('climatisation') || n.includes('clim')) return 'Installation, entretien et dépannage de climatiseur.';
    if (n.includes('restauration') || n.includes('cuisine')) return 'Cuisine à domicile, traiteur, livraison de repas.';
    return 'Trouvez rapidement un prestataire qualifié près de vous.';
};

const AccueilPage = ({
    services = [],
    setSelectedService,
    setCurrentView,
    onReservationDirecte,
    onReservationServices,
}) => {
    const isValidArray = Array.isArray(services) && services.length > 0;

    const plomberieService = isValidArray
        ? services.find((s) =>
            (s.nom || s.name || '').toString().toLowerCase().includes('plomberie')
        )
        : null;

    const servicesVedettes = isValidArray ? services.slice(0, 8) : [];

    return (
        <div className="space-y-8 px-4 md:px-8 pb-10">
            <BoutonDashboard />

            <section className="max-w-5xl mx-auto mt-4 grid md:grid-cols-2 gap-8 items-center">
                <div>
                    <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/70 mb-3">
                        <span className="text-green-400 text-base">●</span>
                        Réservation rapide de services
                    </p>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                        Réserve <span className="text-purple-300">tes services</span>
                        <br />
                        rapidement et simplement.
                    </h1>

                    <p className="mt-3 text-sm md:text-base text-white/70 max-w-md">
                        Choisissez le service dont vous avez besoin et réservez un prestataire
                        qualifié près de vous en quelques minutes.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                        <button
                            onClick={() => {
                                if (onReservationServices) { onReservationServices(); return; }
                                if (onReservationDirecte) { onReservationDirecte(); return; }
                                if (plomberieService && setSelectedService && setCurrentView) {
                                    setSelectedService(plomberieService);
                                    setCurrentView('reservation');
                                    return;
                                }
                                if (setCurrentView) setCurrentView('services');
                            }}
                            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-sm md:text-base font-semibold text-white shadow-lg shadow-purple-900/40 transition-transform hover:scale-[1.02]"
                        >
                            🔧 Réserver un service
                        </button>

                        <button
                            onClick={() => setCurrentView && setCurrentView('services')}
                            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-sm md:text-base text-white/80 border border-white/10 transition-colors"
                        >
                            Voir les autres services
                        </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/60">
                        <span>🌍 Afrique de l'Ouest</span>
                        <span>•</span>
                        <span>🛡️ Prestataires évalués</span>
                        <span>•</span>
                        <span>💳 Paiement en confiance</span>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute -inset-4 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />
                    <div className="relative bg-white/10 border border-white/15 backdrop-blur-xl rounded-3xl p-4 md:p-5 shadow-2xl">
                        <p className="text-xs uppercase tracking-wide text-white/50 mb-2">
                            Services disponibles
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <TagService emoji="🔌" label="Électricité" />
                            <TagService emoji="🚰" label="Plomberie" />
                            <TagService emoji="🚗" label="Mécanique" />
                            <TagService emoji="🍽️" label="Restauration" />
                            <TagService emoji="❄️" label="Climatisation" />
                            <TagService emoji="🚚" label="Transports" />
                        </div>
                        <p className="mt-4 text-[11px] text-white/50">
                            Et plus d'autres services à découvrir.
                        </p>
                    </div>
                </div>
            </section>

            <section className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg md:text-xl font-semibold text-white">
                        Services disponibles
                    </h2>
                    {isValidArray && (
                        <span className="text-xs text-white/50">
                            {services.length} service{services.length > 1 ? 's' : ''} au total
                        </span>
                    )}
                </div>

                {!isValidArray ? (
                    <div className="text-white/70 text-center py-10 text-sm md:text-base bg-black/30 rounded-2xl border border-white/10">
                        Aucun service disponible pour le moment.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {servicesVedettes.map((service) => (
                            <button
                                key={service.id || service.nom}
                                onClick={() => {
                                    if (setSelectedService) setSelectedService(service);
                                    if (setCurrentView) setCurrentView('serviceDetail');
                                }}
                                className="group relative overflow-hidden rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-purple-400/40 backdrop-blur-md text-left transition-all duration-200"
                            >
                                {service.image && (
                                    <div className="w-full h-32 overflow-hidden rounded-t-2xl">
                                        <img
                                            src={service.image}
                                            alt={service.nom}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                )}
                                <div className="p-3 md:p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-2xl">{service.emoji || '🛠️'}</span>
                                        {service.premium && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-200 border border-yellow-400/40">
                                                Premium
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-sm md:text-base font-semibold text-white line-clamp-1">
                                        {service.nom || 'Service'}
                                    </h3>
                                    <p className="mt-1 text-[11px] text-white/60 line-clamp-2">
                                        {getDescriptionService(service.nom)}
                                    </p>
                                    <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-purple-200/90 group-hover:text-purple-100">
                                        Voir les prestataires
                                        <span className="transition-transform group-hover:translate-x-0.5">→</span>
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            <section className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4 text-xs md:text-sm text-white/80">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-lg mb-1">🛡️ Sécurité</p>
                    <p>Réservation validée seulement avec identité ou paiement sécurisé.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-lg mb-1">🤝 Confiance</p>
                    <p>Prestataires évalués par la communauté, statut mis en avant.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-lg mb-1">📱 Pensé pour l'Afrique</p>
                    <p>Fonctionne en PWA, adapté aux connexions limitées et aux paiements mobiles.</p>
                </div>
            </section>
        </div>
    );
};

export default AccueilPage;