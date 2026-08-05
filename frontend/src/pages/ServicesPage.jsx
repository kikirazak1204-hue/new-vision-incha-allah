import React from 'react';

const SERVICES_FIXES = [
    { code: 'ELECTRICITE', nom: 'Électricité', image: '/backgrounds/electricite.png', description: 'Installation, dépannage et maintenance électrique à domicile ou en entreprise.' },
    { code: 'PLOMBERIE', nom: 'Plomberie', image: '/backgrounds/plomberie.png', description: 'Fuites, évacuations bouchées, installation de sanitaires et robinets.' },
    { code: 'MECANIQUE', nom: 'Mécanique', image: '/backgrounds/mecanique.jpg', description: 'Réparation et entretien de véhicules, assistance dépannage.' },
    { code: 'FLEURISTE', nom: 'Fleuriste', description: 'Bouquets, décorations florales pour événements, livraisons.' },
    { code: 'ARTISANAT', nom: 'Artisanat', description: 'Créations artisanales, objets décoratifs, cadeaux personnalisés.' },
    { code: 'TRANSPORTS', nom: 'Transports', image: '/backgrounds/transport.png', description: 'Livraisons, déménagements, transport de personnes ou de marchandises.' },
    { code: 'MEDECINE', nom: 'Médecine', description: 'Consultations, téléconsultations, services de santé partenaires.' },
    { code: 'MENAGE', nom: 'Ménage', description: 'Nettoyage à domicile, bureaux, fin de chantier.' },
    { code: 'EDUCTION', nom: 'Éducation', description: 'Cours particuliers, soutien scolaire, formations.' },
    { code: 'SECURITE', nom: 'Sécurité', description: 'Gardiennage, sécurité d’événements, systèmes de surveillance.' },
    { code: 'ALIMENTATION', nom: 'Alimentation', description: 'Produits alimentaires, épiceries, grossistes.' },
    { code: 'ACCESOIRE', nom: 'Accessoires', description: 'Accessoires de mode, téléphones, maison et plus.' },
    { code: 'FOURNISSEUR_PRODUIT', nom: 'Fournisseur de produits', description: 'Grossistes, distributeurs et vendeurs de produits variés.' },
    { code: 'COUTURE', nom: 'Couture', image: '/backgrounds/couture.jpg', description: 'Couturiers, retouches, créations sur mesure.' },
    { code: 'MISSION', nom: 'Mission / Freelance', description: 'Prestataires pour missions ponctuelles ou projets spécifiques.' },
    { code: 'DIVERTISSEMENT', nom: 'Divertissement', description: 'DJ, animation, événementiel et loisirs.' },
    { code: 'HOTELLERIE', nom: 'Hôtellerie', description: 'Hôtels, maisons d’hôtes, hébergements partenaires.' },
    { code: 'LOCATION', nom: 'Location', description: 'Location de maisons, salles, véhicules, matériels.' },
    { code: 'REPARATION', nom: 'Réparation', description: 'Réparation d’appareils, téléphones, équipements divers.' },
    { code: 'RENCONTRE', nom: 'Rencontre / Réseau', description: 'Mise en relation, réseautage professionnel ou thématique.' },
    { code: 'ASSSURENCE', nom: 'Assurance', description: 'Assureurs et conseillers pour la protection et les risques.' },
    { code: 'PRISE', nom: 'Prise de rendez-vous', description: 'Rendez-vous pour salons, cabinets, ateliers, etc.' },
    { code: 'AVOCAT', nom: 'Avocat / Juridique', description: 'Conseils juridiques, avocats, assistance légale.' },
    { code: 'COUIFFURE', nom: 'Coiffure / Beauté', image: '/backgrounds/coiffure.jpg', description: 'Coiffure, esthétique, soin du corps et du visage.' },
    { code: 'LIVRAISION', nom: 'Livraison', description: 'Livreurs indépendants et partenaires logistiques.' },
    { code: 'BENEVOLLA', nom: 'Bénévolat', description: 'Actions solidaires, entraide, missions bénévoles.' },
    { code: 'CAISSE', nom: 'Caisse / Paiement', description: 'Solutions de caisse, encaissement et gestion de paiement.' },
    { code: 'SPORT', nom: 'Sport', description: 'Coachs sportifs, activités et clubs partenaires.' },
    { code: 'BATIMENT', nom: 'Bâtiment', description: 'Maçons, peintres, électriciens du bâtiment, gros œuvre et finitions.' },
];

const SERVICE_BACKGROUND_IMAGES = {
    electricite: '/backgrounds/electricite.png',
    plomberie: '/backgrounds/plomberie.png',
    transports: '/backgrounds/transport.png',
    mecanique: '/backgrounds/mecanique.jpg',
    coiffure: '/backgrounds/coiffure.jpg',
    couture: '/backgrounds/couture.jpg',
    sante: '/backgrounds/sante.png',
    restauration: '/backgrounds/restauration.png',
    peinture: '/backgrounds/peinture.jpg',
    maconnerie: '/backgrounds/maconnerie.jpg',
    agriculture: '/backgrounds/agriculture.png',
    livraison: '/backgrounds/transport.png',
    location: '/backgrounds/transport.png',
    hotellerie: '/backgrounds/transport.png',
    assurance: '/backgrounds/transport.png',
    avocat: '/backgrounds/transport.png',
    sport: '/backgrounds/transport.png',
    entretien: '/backgrounds/transport.png',
    menage: '/backgrounds/transport.png',
    securite: '/backgrounds/transport.png',
    menuiserie: '/backgrounds/maconnerie.jpg',
    climatisation: '/backgrounds/sante.png',
    reparation: '/backgrounds/mecanique.jpg',
    beaute: '/backgrounds/coiffure.jpg',
    alimentation: '/backgrounds/restauration.png',
    artisanat: '/backgrounds/couture.jpg',
    fleuriste: '/backgrounds/peinture.jpg',
};

const normalizeKey = (value = '') =>
    String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[00-6f]/g, '')
        .replace(/\s+/g, '_');

const getServiceImage = (service) => {
    if (!service) return '/backgrounds/transport.png';
    if (service.image) return service.image;
    const key = normalizeKey(service.code || service.nom || 'transport');
    return SERVICE_BACKGROUND_IMAGES[key] || '/backgrounds/transport.png';
};

const ServicesPage = ({ setSelectedService, setCurrentView }) => {
    return (
        <div className="space-y-8 px-4 md:px-8 pb-10">
            <section className="max-w-5xl mx-auto mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                        Tous les services Kanari Service
                    </h1>
                    <p className="mt-2 text-sm md:text-base text-white/70 max-w-xl">
                        Choisissez un domaine pour voir les prestataires disponibles,
                        leurs produits et réserver une mission en toute confiance.
                    </p>
                </div>
                <p className="text-xs text-white/50">
                    {SERVICES_FIXES.length} services répertoriés
                </p>
            </section>

            <section className="max-w-5xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {SERVICES_FIXES.map((service) => {
                        const cardImage = getServiceImage(service);
                        return (
                            <button
                                key={service.code}
                                onClick={() => {
                                    if (setSelectedService) {
                                        setSelectedService({
                                            id: service.code,
                                            code: service.code,
                                            nom: service.nom,
                                            image: cardImage,
                                        });
                                    }
                                    if (setCurrentView) setCurrentView('serviceDetail');
                                }}
                                className="group relative overflow-hidden rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-purple-400/40 backdrop-blur-md p-3 md:p-4 text-left transition-all duration-200"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <img
                                        src={cardImage}
                                        alt={service.nom}
                                        className="w-12 h-12 rounded-3xl object-cover border border-white/10 shadow-sm"
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/backgrounds/transport.png'; }}
                                    />
                                </div>
                                <h3 className="text-sm md:text-base font-semibold text-white line-clamp-1">
                                    {service.nom}
                                </h3>
                                <p className="mt-1 text-[11px] text-white/65 line-clamp-3">
                                    {service.description}
                                </p>
                                <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-purple-200/90 group-hover:text-purple-100">
                                    Voir les prestataires
                                    <span className="transition-transform group-hover:translate-x-0.5">
                                        →
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default ServicesPage;
