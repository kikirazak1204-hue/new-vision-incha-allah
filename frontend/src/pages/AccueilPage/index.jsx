// ============================================================
// Fichier : src/pages/AccueilPage/index.jsx
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePanier } from '../../context/PanierContext';
import BoutonDashboard from '../../components/BoutonDashboard'; // Import du bouton dashboard

const AccueilPage = ({ services, loading, setSelectedService }) => {
    const navigate = useNavigate();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    const SERVICE_BACKGROUND_IMAGES = {
        electricite: '/backgrounds/electricite.png',
        plomberie: '/backgrounds/plomberie.png',
        transports: '/backgrounds/transport.png',
        transport: '/backgrounds/transport.png',
        mecanique: '/backgrounds/mecanique.jpg',
        coiffure: '/backgrounds/coiffure.jpg',
        couture: '/backgrounds/couture.jpg',
        sante: '/backgrounds/sante.png',
        restauration: '/backgrounds/restauration.png',
        peinture: '/backgrounds/peinture.jpg',
        maconnerie: '/backgrounds/maconnerie.jpg',
        jardinage: '/backgrounds/agriculture.png',
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
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');


    // Récupération sécurisée des données du panier
    const { nombreArticles = 0, totalPanier = 0 } = usePanier() || {};

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstallable(false);
        }
        setDeferredPrompt(null);
    };

    const getServiceImage = (service) => {
        if (!service) return '/backgrounds/transport.png';
        if (service.image) return service.image;
        const key = normalizeKey(service.code || service.nom || 'transport');
        return SERVICE_BACKGROUND_IMAGES[key] || '/backgrounds/transport.png';
    };

    return (
        <div className="min-h-screen bg-[#0f1111] text-slate-100 font-sans selection:bg-purple-500/30">

            {/* 🌐 NAVBAR */}
            <nav className="sticky top-0 z-50 bg-[#131921] border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="text-2xl font-black tracking-tighter">
                        KANARI<span className="text-purple-500">SERVICE</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">

                    {/* ACCÈS DASHBOARD */}
                    <BoutonDashboard />

                    {/* 🛒 BOUTON PANIER */}
                    <button
                        onClick={() => navigate('/panier')}
                        className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/50 px-3 py-1.5 rounded-xl transition-all duration-200 group"
                    >
                        <div className="relative">
                            <svg className="w-5 h-5 text-slate-300 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {nombreArticles > 0 && (
                                <span className="absolute -top-2 -right-2 bg-purple-600 text-[10px] font-black text-white w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
                                    {nombreArticles}
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-bold text-slate-200 group-hover:text-white hidden sm:inline">
                            {nombreArticles > 0 ? `${totalPanier.toLocaleString()} FCFA` : 'Panier'}
                        </span>
                    </button>

                    {isInstallable && (
                        <button
                            onClick={handleInstallClick}
                            className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/60 px-3 py-1.5 rounded-full transition-all"
                        >
                            Installer l'app
                        </button>
                    )}

                    <button onClick={() => navigate('/login')} className="text-sm font-medium hover:text-purple-400 transition">Connexion</button>
                    <button onClick={() => navigate('/register')} className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-full font-bold text-sm transition-all shadow-lg shadow-purple-900/20">S'inscrire</button>
                </div>
            </nav>

            {/* 🚀 HERO SECTION */}
            <header className="px-6 py-12">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex-1 text-left">
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.1]">
                            L'excellence au <span className="text-purple-500">quotidien</span>
                        </h1>
                        <p className="text-slate-400 text-lg mb-8 max-w-lg">
                            Des experts certifiés, une qualité garantie. Trouvez tout ce dont vous avez besoin en un seul endroit.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={() => navigate('/selection')}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 px-7 py-3.5 rounded-2xl font-black text-sm sm:text-base shadow-lg shadow-purple-900/30 transition-all active:scale-95"
                            >
                                🔧 Réserver un service
                            </button>
                            <button
                                onClick={() => navigate('/produits')}
                                className="px-7 py-3.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 text-white font-bold rounded-2xl transition-all text-sm sm:text-base"
                            >
                                🛍️ Voir tous les produits
                            </button>
                        </div>
                    </div>

                    <div className="flex-shrink-0 w-full md:w-80 max-h-64 bg-[#131921]/50 rounded-3xl border border-slate-800/80 flex items-center justify-center p-8 shadow-2xl backdrop-blur-sm">
                        <img
                            src="/logo.png"
                            alt="Logo Kanari"
                            className="w-full h-auto max-h-48 object-contain drop-shadow-[0_0_15px_rgba(147,51,234,0.15)]"
                        />
                    </div>
                </div>
            </header>

            {/* 🛠️ SECTION SERVICES */}
            <main className="max-w-7xl mx-auto px-6 pb-20">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold">Explorer nos expertises</h2>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="relative w-16 h-16">
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-900/30 rounded-full animate-ping"></div>
                            <div className="absolute top-0 left-0 w-full h-full border-t-4 border-purple-500 rounded-full animate-spin"></div>
                        </div>
                        <p className="mt-4 text-slate-500 animate-pulse font-medium">Chargement des services...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {services.map((service) => {
                            const imageUrl = getServiceImage(service);
                            return (
                                <button
                                    key={service.id}
                                    onClick={() => setSelectedService(service)}
                                    className="bg-[#131921] border border-slate-800 hover:border-purple-500/50 hover:bg-[#1b232e] p-0 rounded-2xl transition-all duration-300 group overflow-hidden text-left"
                                >
                                    <div className="h-40 w-full overflow-hidden bg-slate-950">
                                        <img
                                            src={imageUrl}
                                            alt={service.nom}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            onError={(e) => { e.target.onerror = null; e.target.src = '/backgrounds/transport.png'; }}
                                        />
                                    </div>
                                    <div className="p-5 space-y-2 text-left">
                                        <h3 className="text-sm font-semibold text-white line-clamp-1">{service.nom}</h3>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold italic">Expertise certifiée</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AccueilPage;