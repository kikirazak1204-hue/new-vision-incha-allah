import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePanier } from '../../context/PanierContext';
import BoutonDashboard from '../../components/BoutonDashboard';

const ServiceSkeleton = () => (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm animate-pulse flex flex-col justify-between">
        <div className="h-36 bg-slate-200/60 w-full" />
        <div className="p-4 space-y-3">
            <div className="h-4 bg-slate-200/70 rounded-md w-3/4" />
            <div className="h-3 bg-slate-200/50 rounded-md w-full" />
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <div className="h-4 bg-slate-200/70 rounded-md w-1/3" />
                <div className="h-3 bg-slate-200/40 rounded-md w-1/4" />
            </div>
        </div>
    </div>
);

const AccueilPage = ({ services = [], loading, setSelectedService, navigateTo }) => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('Tous');
    const [sortBy, setSortBy] = useState('recommande');
    const [showAllServices, setShowAllServices] = useState(false);
    
    // États Design & Navigation
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const { nombreArticles = 0 } = usePanier() || {};

    const heroImages = [
        '/backgrounds/mecanique.jpg',
        '/backgrounds/electricite.png',
        '/backgrounds/coiffure.jpg',
        '/backgrounds/plomberie.png',
        '/backgrounds/restauration.png'
    ];

    const SERVICE_BACKGROUND_IMAGES = {
        electricite: '/backgrounds/electricite.png', plomberie: '/backgrounds/plomberie.png',
        transports: '/backgrounds/transport.png', transport: '/backgrounds/transport.png',
        mecanique: '/backgrounds/mecanique.jpg', coiffure: '/backgrounds/coiffure.jpg',
        couture: '/backgrounds/couture.jpg', sante: '/backgrounds/sante.png',
        restauration: '/backgrounds/restauration.png', peinture: '/backgrounds/peinture.jpg',
    };

    const normalizeKey = (value = '') => String(value || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

    // Carrousel héroïque automatique
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [heroImages.length]);

    // Détection du scroll
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const getServiceImage = (service) => {
        if (!service) return '/backgrounds/transport.png';
        if (service.image) return service.image;
        const key = normalizeKey(service.code || service.nom || 'transport');
        return SERVICE_BACKGROUND_IMAGES[key] || '/backgrounds/transport.png';
    };

    const categoryOf = (s) => s?.categorie || s?.category || s?.type || 'Services';
    const processedServices = services.filter((s) => {
        const text = [s?.nom, s?.description, s?.categorie].filter(Boolean).join(' ').toLowerCase();
        return (!search.trim() || text.includes(search.trim().toLowerCase())) && (activeCategory === 'Tous' || categoryOf(s) === activeCategory);
    }).sort((a, b) => sortBy === 'prix-asc' ? (a.prix || 0) - (b.prix || 0) : sortBy === 'prix-desc' ? (b.prix || 0) - (a.prix || 0) : 0);

    const visibleServices = showAllServices ? processedServices : processedServices.slice(0, 12);
    const categories = ['Tous', ...Array.from(new Set(services.map(categoryOf).filter(Boolean))).slice(0, 8)];

    const navItems = [
        { label: 'Accueil', icon: '🏠', path: '/', active: true },
        { label: 'Services', icon: '⚡', path: '/selection', active: false },
        { label: 'Boutique', icon: '🛍️', path: '/produits', active: false },
        { label: 'Panier', icon: '🛒', path: '/panier', badge: nombreArticles, active: false }
    ];

    const handleNavigation = (path) => {
        if (navigateTo) navigateTo(path);
        else navigate(path);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-[#061a3a] font-sans antialiased pb-32 relative">
            
            {/* 1. NAVBAR SUPÉRIEURE */}
            <nav className={`fixed top-0 left-0 w-full z-40 transition-all duration-500 ease-in-out px-4 sm:px-8 flex items-center justify-between ${
                scrolled ? 'bg-[#061a3a]/95 backdrop-blur-xl py-3 shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent py-5'
            }`}>
                <button type="button" onClick={() => handleNavigation('/')} className="flex items-center gap-3 outline-none">
                    <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-2xl" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <div className="hidden sm:block text-xl font-black tracking-tight drop-shadow-md text-white">
                        KANARI<span className="text-amber-500">SERVICE</span>
                    </div>
                </button>

                {/* MENU DROPDOWN */}
                <div className="relative">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all backdrop-blur-md shadow-lg ${
                            scrolled ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-black/30 border-white/20 text-white hover:bg-black/50'
                        }`}
                    >
                        <span className="text-xs font-bold hidden sm:block">Mon Compte</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-2xl border border-slate-200/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col origin-top-right animate-in fade-in zoom-in-95 duration-200 z-50">
                            <div className="px-5 py-3 hover:bg-slate-50 transition-colors">
                                <BoutonDashboard />
                            </div>
                            <div className="h-px bg-slate-200/80 my-1 mx-4" />
                            <button onClick={() => { handleNavigation('/login'); setIsMenuOpen(false); }} className="text-left px-5 py-3.5 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors flex items-center gap-3">
                                <span>👤</span> Connexion
                            </button>
                            <button onClick={() => { handleNavigation('/register'); setIsMenuOpen(false); }} className="text-left px-5 py-3.5 bg-slate-50 hover:bg-amber-50 text-xs font-black text-amber-600 transition-colors flex items-center gap-3">
                                <span>✨</span> Créer un compte
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* 2. HERO ANIMÉ */}
            <header className="relative w-full h-[60vh] min-h-[480px] bg-slate-900 rounded-b-[2.5rem] overflow-hidden shadow-2xl">
                {heroImages.map((src, index) => (
                    <div 
                        key={src}
                        className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                            index === currentHeroIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                        }`}
                    >
                        <img src={src} alt="Background" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/backgrounds/transport.png'; }} />
                    </div>
                ))}
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061a3a] via-[#061a3a]/60 to-transparent opacity-90" />

                <div className="absolute bottom-12 left-0 w-full px-6 sm:px-12 lg:px-16 z-10">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 text-[10px] font-black text-amber-300 uppercase tracking-widest border border-amber-400/30 rounded-full bg-black/30 backdrop-blur-md shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Disponible 24/7
                        </span>
                        
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-[1.05] text-white mb-4 drop-shadow-lg">
                            Votre quotidien, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">Sublimé.</span>
                        </h1>

                        <p className="text-slate-200 text-sm mb-6 max-w-lg font-medium leading-relaxed drop-shadow-md">
                            L'excellence à portée de main. Des experts certifiés et une boutique exclusive.
                        </p>
                    </div>
                </div>
            </header>

            {/* 3. CATALOGUE */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
                    <h2 className="text-2xl sm:text-3xl font-black text-[#061a3a] tracking-tight">Nos Prestations</h2>
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
                        <input 
                            value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Que recherchez-vous ?"
                            className="w-full sm:w-64 bg-white text-[#061a3a] border border-slate-200 focus:border-amber-400 rounded-xl px-4 py-2.5 outline-none text-xs font-medium shadow-sm" 
                        />
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-auto bg-white text-xs font-bold text-slate-700 border border-slate-200 rounded-xl px-3 py-2.5 outline-none shadow-sm cursor-pointer">
                            <option value="recommande">✨ Recommandations</option>
                            <option value="prix-asc">💰 Prix croissant</option>
                            <option value="prix-desc">💎 Prix décroissant</option>
                        </select>
                    </div>
                </div>

                {/* Filtres Catégories */}
                {categories.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none">
                        {categories.map((category) => (
                            <button 
                                key={category} onClick={() => { setActiveCategory(category); setShowAllServices(false); }}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                    activeCategory === category ? 'bg-[#061a3a] text-white border-[#061a3a] shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-[#061a3a]'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                )}

                {/* Grille */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
                        {Array.from({ length: 6 }).map((_, idx) => <ServiceSkeleton key={idx} />)}
                    </div>
                ) : processedServices.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
                        <div className="text-3xl mb-2">🔎</div>
                        <h3 className="font-extrabold text-base text-[#061a3a]">Aucun résultat</h3>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
                            {visibleServices.map((service) => (
                                <button 
                                    key={service.id || service._id} 
                                    onClick={() => setSelectedService(service)}
                                    className="group bg-white border border-slate-200/80 hover:border-amber-400 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-xl text-left flex flex-col h-full"
                                >
                                    <div className="relative h-32 w-full bg-slate-100 overflow-hidden">
                                        <img src={getServiceImage(service)} alt={service.nom} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent" />
                                    </div>
                                    <div className="p-3 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-xs font-black text-[#061a3a] line-clamp-1">{service.nom}</h3>
                                            <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{service.categorie || 'Service pro'}</p>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-slate-100">
                                            <p className="text-xs font-black text-amber-600">{service.prix ? `${Number(service.prix).toLocaleString()} F` : 'Devis'}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {processedServices.length > 12 && (
                            <div className="flex justify-center mt-8">
                                <button onClick={() => setShowAllServices(v => !v)} className="bg-white hover:bg-slate-50 border border-slate-200 text-[#061a3a] px-6 py-2.5 rounded-xl font-black text-xs shadow-sm transition">
                                    {showAllServices ? 'Voir moins' : 'Tout afficher'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* 4. BARRE DE NAVIGATION INFÉRIEURE SEPARÉE (Boutons flottants individuels) */}
            <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center items-center px-4 pointer-events-none">
                <nav className="pointer-events-auto flex items-center gap-2 sm:gap-3 bg-[#061a3a]/90 backdrop-blur-2xl p-2 rounded-full border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => handleNavigation(item.path)}
                            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 group ${
                                item.active
                                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 scale-105'
                                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <span className="text-lg leading-none transition-transform group-hover:scale-110">{item.icon}</span>
                            <span className="text-xs font-bold tracking-tight whitespace-nowrap">{item.label}</span>
                            
                            {item.badge > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-extrabold border-2 border-[#061a3a] animate-pulse">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

        </div>
    );
};

export default AccueilPage;