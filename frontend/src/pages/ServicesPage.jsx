import React, { useMemo, useState } from 'react';

const SERVICES_FIXES = [
    { code:'ELECTRICITE', nom:'Électricité', image:'/backgrounds/electricite.png', description:'Installation, dépannage et maintenance électrique à domicile ou en entreprise.' },
    { code:'PLOMBERIE', nom:'Plomberie', image:'/backgrounds/plomberie.png', description:'Fuites, évacuations bouchées, installation de sanitaires et robinets.' },
    { code:'MECANIQUE', nom:'Mécanique', image:'/backgrounds/mecanique.jpg', description:'Réparation et entretien de véhicules, assistance dépannage.' },
    { code:'FLEURISTE', nom:'Fleuriste', description:'Bouquets, décorations florales pour événements, livraisons.' },
    { code:'ARTISANAT', nom:'Artisanat', description:'Créations artisanales, objets décoratifs, cadeaux personnalisés.' },
    { code:'TRANSPORTS', nom:'Transports', image:'/backgrounds/transport.png', description:'Livraisons, déménagements, transport de personnes ou de marchandises.' },
    { code:'MEDECINE', nom:'Médecine', description:'Consultations, téléconsultations, services de santé partenaires.' },
    { code:'MENAGE', nom:'Ménage', description:'Nettoyage à domicile, bureaux, fin de chantier.' },
    { code:'EDUCTION', nom:'Éducation', description:'Cours particuliers, soutien scolaire, formations.' },
    { code:'SECURITE', nom:'Sécurité', description:'Gardiennage, sécurité d’événements, systèmes de surveillance.' },
    { code:'ALIMENTATION', nom:'Alimentation', description:'Produits alimentaires, épiceries, grossistes.' },
    { code:'ACCESOIRE', nom:'Accessoires', description:'Accessoires de mode, téléphones, maison et plus.' },
    { code:'FOURNISSEUR_PRODUIT', nom:'Fournisseur de produits', description:'Grossistes, distributeurs et vendeurs de produits variés.' },
    { code:'COUTURE', nom:'Couture', image:'/backgrounds/couture.jpg', description:'Couturiers, retouches, créations sur mesure.' },
    { code:'MISSION', nom:'Mission / Freelance', description:'Prestataires pour missions ponctuelles ou projets spécifiques.' },
    { code:'DIVERTISSEMENT', nom:'Divertissement', description:'DJ, animation, événementiel et loisirs.' },
    { code:'HOTELLERIE', nom:'Hôtellerie', description:'Hôtels, maisons d’hôtes, hébergements partenaires.' },
    { code:'LOCATION', nom:'Location', description:'Location de maisons, salles, véhicules, matériels.' },
    { code:'REPARATION', nom:'Réparation', description:'Réparation d’appareils, téléphones, équipements divers.' },
    { code:'RENCONTRE', nom:'Rencontre / Réseau', description:'Mise en relation, réseautage professionnel ou thématique.' },
    { code:'ASSSURENCE', nom:'Assurance', description:'Assureurs et conseillers pour la protection et les risques.' },
    { code:'PRISE', nom:'Prise de rendez-vous', description:'Rendez-vous pour salons, cabinets, ateliers, etc.' },
    { code:'AVOCAT', nom:'Avocat / Juridique', description:'Conseils juridiques, avocats, assistance légale.' },
    { code:'COUIFFURE', nom:'Coiffure / Beauté', image:'/backgrounds/coiffure.jpg', description:'Coiffure, esthétique, soin du corps et du visage.' },
    { code:'LIVRAISION', nom:'Livraison', description:'Livreurs indépendants et partenaires logistiques.' },
    { code:'BENEVOLLA', nom:'Bénévolat', description:'Actions solidaires, entraide, missions bénévoles.' },
    { code:'CAISSE', nom:'Caisse / Paiement', description:'Solutions de caisse, encaissement et gestion de paiement.' },
    { code:'SPORT', nom:'Sport', description:'Coachs sportifs, activités et clubs partenaires.' },
    { code:'BATIMENT', nom:'Bâtiment', description:'Maçons, peintres, électriciens du bâtiment, gros œuvre et finitions.' },
];

const SERVICE_BACKGROUND_IMAGES = {
    electricite:'/backgrounds/electricite.png', plomberie:'/backgrounds/plomberie.png',
    transports:'/backgrounds/transport.png', transport:'/backgrounds/transport.png',
    mecanique:'/backgrounds/mecanique.jpg', coiffure:'/backgrounds/coiffure.jpg',
    couture:'/backgrounds/couture.jpg', sante:'/backgrounds/sante.png',
    restauration:'/backgrounds/restauration.png', peinture:'/backgrounds/peinture.jpg',
    maconnerie:'/backgrounds/maconnerie.jpg', agriculture:'/backgrounds/agriculture.png',
    livraison:'/backgrounds/transport.png', location:'/backgrounds/transport.png',
    hotellerie:'/backgrounds/transport.png', assurance:'/backgrounds/transport.png',
    avocat:'/backgrounds/transport.png', sport:'/backgrounds/transport.png',
    entretien:'/backgrounds/transport.png', menage:'/backgrounds/transport.png',
    securite:'/backgrounds/transport.png', menuiserie:'/backgrounds/maconnerie.jpg',
    climatisation:'/backgrounds/sante.png', reparation:'/backgrounds/mecanique.jpg',
    beaute:'/backgrounds/coiffure.jpg', alimentation:'/backgrounds/restauration.png',
    artisanat:'/backgrounds/couture.jpg', fleuriste:'/backgrounds/peinture.jpg',
};

const normalizeKey = (value='') => String(value).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'_').replace(/_+/g,'_')
    .replace(/^_|_$/g,'');

const getServiceImage = (service) => {
    if (service?.image) return service.image;
    return SERVICE_BACKGROUND_IMAGES[normalizeKey(service?.code || service?.nom)] || '/backgrounds/transport.png';
};

const ServicesPage = ({ setSelectedService, setCurrentView }) => {
    const [recherche, setRecherche] = useState('');
    const [afficherTout, setAfficherTout] = useState(false);

    const services = useMemo(() => SERVICES_FIXES.filter((s) => {
        const q = recherche.trim().toLowerCase();
        return !q || `${s.nom} ${s.description}`.toLowerCase().includes(q);
    }), [recherche]);

    return (
        <div className="min-h-screen bg-slate-50 text-[#061a3a] px-4 md:px-8 pb-12">
            <section className="max-w-7xl mx-auto pt-6 md:pt-8">
                <div className="bg-[#061a3a] rounded-[2rem] p-6 md:p-9 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(245,158,11,.22),transparent_30%)]" />
                    <div className="relative">
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
                            <div>
                                <p className="text-amber-400 text-xs font-black uppercase tracking-[.18em] mb-2">Catalogue Kanari</p>
                                <h1 className="text-3xl md:text-4xl font-black">Tous les services</h1>
                                <p className="mt-2 text-slate-300 max-w-2xl text-sm md:text-base">
                                    Explorez les domaines disponibles, consultez les informations essentielles et choisissez une prestation.
                                </p>
                            </div>
                            <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3">
                                <div className="text-2xl font-black text-amber-400">{SERVICES_FIXES.length}</div>
                                <div className="text-xs text-slate-300">services répertoriés</div>
                            </div>
                        </div>
                        <div className="relative mt-6">
                            <input
                                value={recherche}
                                onChange={(e) => setRecherche(e.target.value)}
                                placeholder="Rechercher : plomberie, transport, santé..."
                                className="w-full bg-white !text-[#061a3a] placeholder:!text-slate-400 rounded-xl px-4 py-3.5 outline-none border border-white/10 focus:ring-4 focus:ring-amber-400/20"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-7 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black">Choisissez votre domaine</h2>
                        <p className="text-sm text-slate-500 mt-1">Des informations claires avant de continuer.</p>
                    </div>
                    {recherche && <button onClick={() => setRecherche('')} className="text-xs font-bold text-amber-600">Effacer</button>}
                </div>

                <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {services.map((service) => {
                        const image = getServiceImage(service);
                        return (
                            <button key={service.code} type="button"
                                onClick={() => {
                                    setSelectedService?.({ id:service.code, code:service.code, nom:service.nom, image });
                                    setCurrentView?.('serviceDetail');
                                }}
                                className="group text-left bg-white border border-slate-200 hover:border-amber-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="relative h-32 md:h-36 bg-slate-100 overflow-hidden">
                                    <img src={image} alt={service.nom} loading="lazy"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => { e.currentTarget.onerror=null; e.currentTarget.src='/backgrounds/transport.png'; }} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                                    <span className="absolute left-3 bottom-2 text-[10px] text-white font-bold bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">Explorer</span>
                                </div>
                                <div className="p-3.5">
                                    <h3 className="font-black text-sm md:text-base line-clamp-1">{service.nom}</h3>
                                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1 line-clamp-3">{service.description}</p>
                                    <div className="mt-3 text-[11px] font-black text-amber-600 flex items-center justify-between">
                                        <span>Prestataires disponibles</span><span>→</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {services.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center mt-5">
                        <div className="text-3xl">🔎</div>
                        <h3 className="font-black mt-2">Aucun domaine trouvé</h3>
                        <p className="text-sm text-slate-500 mt-1">Essayez un autre mot-clé.</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ServicesPage;
