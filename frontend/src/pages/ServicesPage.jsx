import React from 'react';

const SERVICES_FIXES = [
    { code: 'ELECTRICITE', nom: 'Électricité', emoji: '🔌', image: '/backgrounds/electricite.jpg', description: 'Installation, dépannage et maintenance électrique à domicile ou en entreprise.' },
    { code: 'PLOMBERIE', nom: 'Plomberie', emoji: '🚰', description: 'Fuites, évacuations bouchées, installation de sanitaires et robinets.' },
    { code: 'MECANIQUE', nom: 'Mécanique', emoji: '🚗', description: 'Réparation et entretien de véhicules, assistance dépannage.' },
    { code: 'FLEURISTE', nom: 'Fleuriste', emoji: '🌸', description: 'Bouquets, décorations florales pour événements, livraisons.' },
    { code: 'ARTISANAT', nom: 'Artisanat', emoji: '🧵', description: 'Créations artisanales, objets décoratifs, cadeaux personnalisés.' },
    { code: 'TRANSPORTS', nom: 'Transports', emoji: '🚚', description: 'Livraisons, déménagements, transport de personnes ou de marchandises.' },
    { code: 'MEDECINE', nom: 'Médecine', emoji: '🏥', description: 'Consultations, téléconsultations, services de santé partenaires.' },
    { code: 'MENAGE', nom: 'Ménage', emoji: '🧹', description: 'Nettoyage à domicile, bureaux, fin de chantier.' },
    { code: 'EDUCTION', nom: 'Éducation', emoji: '📚', description: 'Cours particuliers, soutien scolaire, formations.' },
    { code: 'SECURITE', nom: 'Sécurité', emoji: '🛡️', description: 'Gardiennage, sécurité d’événements, systèmes de surveillance.' },
    { code: 'ALIMENTATION', nom: 'Alimentation', emoji: '🛒', description: 'Produits alimentaires, épiceries, grossistes.' },
    { code: 'ACCESOIRE', nom: 'Accessoires', emoji: '🎒', description: 'Accessoires de mode, téléphones, maison et plus.' },
    { code: 'FOURNISSEUR_PRODUIT', nom: 'Fournisseur de produits', emoji: '📦', description: 'Grossistes, distributeurs et vendeurs de produits variés.' },
    { code: 'COUTURE', nom: 'Couture', emoji: '👗', description: 'Couturiers, retouches, créations sur mesure.' },
    { code: 'MISSION', nom: 'Mission / Freelance', emoji: '💼', description: 'Prestataires pour missions ponctuelles ou projets spécifiques.' },
    { code: 'DIVERTISSEMENT', nom: 'Divertissement', emoji: '🎉', description: 'DJ, animation, événementiel et loisirs.' },
    { code: 'HOTELLERIE', nom: 'Hôtellerie', emoji: '🏨', description: 'Hôtels, maisons d’hôtes, hébergements partenaires.' },
    { code: 'LOCATION', nom: 'Location', emoji: '🔑', description: 'Location de maisons, salles, véhicules, matériels.' },
    { code: 'REPARATION', nom: 'Réparation', emoji: '🛠️', description: 'Réparation d’appareils, téléphones, équipements divers.' },
    { code: 'RENCONTRE', nom: 'Rencontre / Réseau', emoji: '🤝', description: 'Mise en relation, réseautage professionnel ou thématique.' },
    { code: 'ASSSURENCE', nom: 'Assurance', emoji: '📄', description: 'Assureurs et conseillers pour la protection et les risques.' },
    { code: 'PRISE', nom: 'Prise de rendez-vous', emoji: '📅', description: 'Rendez-vous pour salons, cabinets, ateliers, etc.' },
    { code: 'AVOCAT', nom: 'Avocat / Juridique', emoji: '⚖️', description: 'Conseils juridiques, avocats, assistance légale.' },
    { code: 'COUIFFURE', nom: 'Coiffure / Beauté', emoji: '💇‍♀️', description: 'Coiffure, esthétique, soin du corps et du visage.' },
    { code: 'LIVRAISION', nom: 'Livraison', emoji: '🚴‍♂️', description: 'Livreurs indépendants et partenaires logistiques.' },
    { code: 'BENEVOLLA', nom: 'Bénévolat', emoji: '🤲', description: 'Actions solidaires, entraide, missions bénévoles.' },
    { code: 'CAISSE', nom: 'Caisse / Paiement', emoji: '💳', description: 'Solutions de caisse, encaissement et gestion de paiement.' },
    { code: 'SPORT', nom: 'Sport', emoji: '🏋️‍♂️', description: 'Coachs sportifs, activités et clubs partenaires.' },
    { code: 'BATIMENT', nom: 'Bâtiment', emoji: '🏗️', description: 'Maçons, peintres, électriciens du bâtiment, gros œuvre et finitions.' },
];

const ServicesPage = ({ setSelectedService, setCurrentView }) => {
    return (
        <div className="space-y-8 px-4 md:px-8 pb-10">
            <section className="max-w-5xl mx-auto mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                        Tous les services New Vision
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
                    {SERVICES_FIXES.map((service) => (
                        <button
                            key={service.code}
                            onClick={() => {
                                if (setSelectedService) {
                                    setSelectedService({
                                        id: service.code,
                                        code: service.code,
                                        nom: service.nom,
                                        emoji: service.emoji,
                                    });
                                }
                                if (setCurrentView) setCurrentView('serviceDetail');
                            }}
                            className="group relative overflow-hidden rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-purple-400/40 backdrop-blur-md p-3 md:p-4 text-left transition-all duration-200"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl">{service.emoji}</span>
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
                    ))}
                </div>
            </section>
        </div>
    );
};

export default ServicesPage;
