import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AccueilPage = ({ services, loading, setSelectedService }) => {
    const navigate = useNavigate();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

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

    const serviceIcons = {
        'Accessoires': '💍', 'Alimentation': '🍎', 'Artisanat': '🎨', 'Assurance': '🛡️',
        'Avocat et Juridique': '⚖️', 'Benevolat': '🤝', 'Climatisation': '❄️', 'Coiffure et Beaute': '💇',
        'Couture': '🧵', 'Divertissement': '🎬', 'Education': '📚', 'Electricite': '⚡',
        'Fleuriste': '💐', 'Fournisseur de produits': '📦', 'Hotellerie': '🏨', 'Jardinage': '🌱',
        'Livraison': '🚚', 'Location': '🔑', 'Maconnerie': '🧱', 'Mecanique': '🔧',
        'Medecine': '🩺', 'Menage': '🧹', 'Menuiserie': '🪑', 'Mission et Freelance': '💼',
        'Plomberie': '🚰', 'Prise de rendez-vous': '📅', 'Reparation': '🛠️', 'Securite': '🔒',
        'Sport et Fitness': '🏋️', 'Transport': '🚗'
    };

    return (
        <div className="min-h-screen bg-[#0f1111] text-slate-100 font-sans selection:bg-purple-500/30">
            
            {/* 🌐 NAVBAR MODERNE (100% ton design d'origine) */}
            <nav className="sticky top-0 z-50 bg-[#131921] border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="text-2xl font-black tracking-tighter">
                        KANARI<span className="text-purple-500">SERVICE</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                    
                    {/* 📱 Bouton d'installation : Petit cercle sur mobile / Mini pilule sur PC */}
                    {isInstallable && (
                        <button 
                            onClick={handleInstallClick}
                            title="Installer l'application Kanari"
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/60 p-2 sm:px-3 sm:py-1.5 rounded-full transition-all duration-200"
                        >
                            <svg className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            <span className="hidden sm:inline">Installer l'app</span>
                        </button>
                    )}

                    <button onClick={() => navigate('/login')} className="text-sm font-medium hover:text-purple-400 transition">Connexion</button>
                    <button onClick={() => navigate('/register')} className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-full font-bold text-sm transition-all shadow-lg shadow-purple-900/20">S'inscrire</button>
                </div>
            </nav>

            {/* 🚀 HERO SECTION (Intact) */}
            <header className="px-6 py-12">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex-1 text-left">
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.1]">
                            L'excellence au <span className="text-purple-500">quotidien</span>
                        </h1>
                        <p className="text-slate-400 text-lg mb-8 max-w-lg">
                            Des experts certifiés, une qualité garantie. Trouvez tout ce dont vous avez besoin en un seul endroit.
                        </p>
                    </div>
                    <div className="flex-shrink-0 w-64 h-64 md:w-80 md:h-80 bg-[#131921] rounded-3xl border border-slate-800 flex items-center justify-center p-6 shadow-2xl">
                        <img src="/logo.png" alt="Logo Kanari" className="w-full h-full object-contain" />
                    </div>
                </div>
            </header>

            {/* 🛠️ SECTION SERVICES (Intact) */}
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
                        {services.map((service) => (
                            <button
                                key={service.id}
                                onClick={() => setSelectedService(service)}
                                className="bg-[#131921] border border-slate-800 hover:border-purple-500/50 hover:bg-[#1b232e] p-6 rounded-2xl transition-all duration-300 group flex flex-col items-center text-center gap-3"
                            >
                                <span className="text-4xl">{serviceIcons[service.nom] || '✨'}</span>
                                <span className="font-semibold text-sm group-hover:text-purple-400">{service.nom}</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold italic">Expertise certifiée</span>
                            </button>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AccueilPage;