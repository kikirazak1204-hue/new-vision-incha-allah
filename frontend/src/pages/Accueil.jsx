import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices } from '../util/api';
import { usePanier } from '../context/PanierContext';

import ServiceDetailPage from './ServiceDetailPage';
import FournisseurProfilePage from './FournisseurProfilePage';
import PanierPage from './PanierPage';
import VoirProduitsPage from './VoirProduitsPage';
import AccueilPage from './AccueilPage';
import ServicesPage from './ServicesPage';
import LoginPage from './Login.jsx';
import RegisterFournisseurPage from './Register.jsx';
import RegisterUtilisateurPage from './RegisterUtilisateur.jsx';
import CommandePage from './CommandePage';
import ReservationPage from './ReservationPage';
import ServiceSelectionPage from './ServiceSelectionPage';

function RegisterChoicePage({ onBack, onSelect }) {
    return (
        <div className="max-w-4xl mx-auto rounded-3xl bg-black/60 border border-white/10 p-8 shadow-2xl">
            <div className="text-center space-y-4 mb-8">
                <h2 className="text-4xl font-bold">S'inscrire</h2>
                <p className="text-white/70 text-base">Choisissez votre profil pour continuer : client ou fournisseur.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 mb-6">
                <button
                    onClick={() => onSelect('registerUtilisateur')}
                    className="rounded-3xl border border-blue-500/30 bg-blue-500/10 px-8 py-6 text-left text-white transition hover:bg-blue-500/15"
                >
                    <p className="text-2xl font-bold">Utilisateur</p>
                    <p className="text-sm text-white/60 mt-2">Créer un compte client pour réserver des services et accéder à votre espace personnel.</p>
                </button>
                <button
                    onClick={() => onSelect('registerFournisseur')}
                    className="rounded-3xl border border-green-500/30 bg-emerald-500/10 px-8 py-6 text-left text-white transition hover:bg-emerald-500/15"
                >
                    <p className="text-2xl font-bold">Fournisseur</p>
                    <p className="text-sm text-white/60 mt-2">Créer un compte prestataire pour proposer vos services et soumettre un dossier.</p>
                </button>
            </div>
            <button
                onClick={onBack}
                className="w-full rounded-3xl border border-white/20 bg-white/5 py-4 text-sm font-semibold text-white/80 transition hover:bg-white/10"
            >
                Retour à l'accueil
            </button>
        </div>
    );
}

export default function Accueil() {
    const [services, setServices] = useState([]);
    const [currentView, setCurrentView] = useState('accueil');
    const [selectedService, setSelectedService] = useState(null);
    const [selectedFournisseur, setSelectedFournisseur] = useState(null);
    const [selectedServices, setSelectedServices] = useState([]);
    const { nombreArticles } = usePanier();
    const navigate = useNavigate();

    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(
        window.matchMedia('(display-mode: standalone)').matches
    );
    const [showInstallBanner, setShowInstallBanner] = useState(true);

    // FOND DYNAMIQUE JOUR/NUIT
    const [fondStyle, setFondStyle] = useState(() => {
        const h = new Date().getHours();
        return h >= 8 && h < 16 ? 'jour' : 'nuit';
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const h = new Date().getHours();
            setFondStyle(h >= 8 && h < 16 ? 'jour' : 'nuit');
        }, 8 * 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
        const installedHandler = () => { setIsInstalled(true); setInstallPrompt(null); };
        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', installedHandler);
        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    const installerApp = async () => {
        if (!installPrompt) return;
        await installPrompt.prompt();
        const result = await installPrompt.userChoice;
        if (result.outcome === 'accepted') {
            setIsInstalled(true);
            setInstallPrompt(null);
        }
    };

    useEffect(() => {
        getServices()
            .then((res) => setServices(res.data || []))
            .catch((err) => { console.error('Erreur chargement services:', err); setServices([]); });
    }, []);

    const ouvrirReservationPlombier = () => {
        const servicePlomberie = services.find((s) =>
            (s.nom || s.name || '').toString().toLowerCase().includes('plomberie')
        );
        if (servicePlomberie) {
            setSelectedService(servicePlomberie);
            setSelectedFournisseur(null);
            setCurrentView('reservation');
        } else {
            setCurrentView('accueil');
        }
    };

    const ouvrirSelectionServices = () => {
        setSelectedServices([]);
        setCurrentView('serviceSelection');
    };

    const handleContinueReservation = (selectedServicesList) => {
        setSelectedServices(selectedServicesList);
        setSelectedFournisseur(null);
        setCurrentView('reservation');
    };

    const renderMainView = () => {
        switch (currentView) {
            case 'services':
                return <ServicesPage setSelectedService={setSelectedService} setCurrentView={setCurrentView} />;
            case 'serviceSelection':
                return <ServiceSelectionPage handleRetour={() => setCurrentView('accueil')} handleContinue={handleContinueReservation} />;
            case 'serviceDetail':
                if (!selectedService) return <div className="p-4">Service introuvable.</div>;
                return (
                    <ServiceDetailPage
                        selectedService={selectedService}
                        handleFournisseurClick={(f) => { setSelectedFournisseur(f); setCurrentView('fournisseurProfile'); }}
                        handleCommanderClick={(f) => { setSelectedFournisseur(f); setCurrentView('reservation'); }}
                        handleVoirProduitsClick={(f) => { setSelectedFournisseur(f || null); setCurrentView('voirProduits'); }}
                    />
                );
            case 'fournisseurProfile':
                return (
                    <FournisseurProfilePage
                        fournisseur={selectedFournisseur}
                        handleRetour={() => setCurrentView('serviceDetail')}
                        handleCommanderClick={(f) => { setSelectedFournisseur(f); setCurrentView('reservation'); }}
                        handleVoirProduitsClick={() => setCurrentView('voirProduits')}
                    />
                );
            case 'reservation':
                return (
                    <ReservationPage
                        fournisseur={selectedFournisseur}
                        service={selectedService}
                        selectedServices={selectedServices}
                        handleRetour={() => setCurrentView('accueil')}
                        setCurrentView={setCurrentView}
                    />
                );
            case 'voirProduits':
                return <VoirProduitsPage service={selectedService} fournisseur={selectedFournisseur} handleRetour={() => setCurrentView('serviceDetail')} />;
            case 'panier':
                return <PanierPage setCurrentView={setCurrentView} />;
            case 'commande':
                return <CommandePage />;
            case 'login':
                return <LoginPage />;
            case 'registerChoice':
                return <RegisterChoicePage onBack={() => setCurrentView('accueil')} onSelect={setCurrentView} />;
            case 'registerFournisseur':
                return <RegisterFournisseurPage />;
            case 'registerUtilisateur':
                return <RegisterUtilisateurPage />;
            case 'accueil':
            default:
                return (
                    <AccueilPage
                        services={services}
                        setSelectedService={setSelectedService}
                        setCurrentView={setCurrentView}
                        onReservationDirecte={ouvrirReservationPlombier}
                        onReservationServices={ouvrirSelectionServices}
                    />
                );
        }
    };

    const token = localStorage.getItem('token');
    try { } catch { }

    const handleDeconnexion = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCurrentView('accueil');
    };

    const isJour = fondStyle === 'jour';

    return (
        <div className={`relative min-h-screen p-6 transition-colors duration-1000 ${isJour ? 'text-gray-800' : 'text-white'}`}>

            {/* FOND DYNAMIQUE JOUR/NUIT */}
            <div className="fixed inset-0 -z-10 transition-all duration-[3000ms]" style={{
                background: isJour
                    ? 'linear-gradient(135deg, #fefefe 0%, #dbeafe 30%, #f3e8ff 60%, #fef9c3 100%)'
                    : 'linear-gradient(135deg, #0a0a1a 0%, #1a1000 30%, #0d0800 60%, #050d1f 100%)',
            }} />
            <div className="fixed inset-0 -z-10 transition-all duration-[3000ms]" style={{
                background: isJour
                    ? 'radial-gradient(ellipse at 20% 20%, rgba(139,92,246,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(59,130,246,0.15) 0%, transparent 50%)'
                    : 'radial-gradient(ellipse at 20% 20%, rgba(212,160,23,0.2) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(180,120,10,0.15) 0%, transparent 50%)',
            }} />

            {!isOnline && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 text-sm font-semibold animate-pulse">
                    📵 Mode Hors ligne — Les images et services sont limités
                </div>
            )}

            {installPrompt && !isInstalled && showInstallBanner && (
                <div className="fixed bottom-4 left-4 right-4 z-50 bg-purple-700/95 backdrop-blur rounded-2xl p-4 flex items-center justify-between shadow-2xl border border-purple-500/30">
                    <div>
                        <p className="font-bold text-white text-sm">📱 Installer Kanari Service</p>
                        <p className="text-white/60 text-xs mt-0.5">Accès rapide depuis votre écran d'accueil</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowInstallBanner(false)} className="text-white/40 hover:text-white text-xs px-2">✕</button>
                        <button onClick={installerApp} className="bg-white text-purple-700 font-bold px-4 py-2 rounded-xl text-sm hover:scale-105 transition-all">Installer</button>
                    </div>
                </div>
            )}

            <header className={`flex justify-between items-center mb-8 flex-wrap gap-3 ${!isOnline ? 'mt-8' : ''}`}>
                <h1
                    className={`text-2xl font-bold cursor-pointer flex items-center gap-2 transition-colors ${isJour ? 'hover:text-purple-700' : 'hover:text-yellow-400'}`}
                    onClick={() => setCurrentView('accueil')}
                >
                    <img src="/logo.png" alt="Kanari Service" className="w-10 h-10 object-contain rounded-full" />
                    Kanari Service
                </h1>
                <nav className="flex items-center gap-4 flex-wrap">
                    <button onClick={() => setCurrentView('accueil')} className={`transition-colors ${isJour ? 'hover:text-purple-700' : 'hover:text-yellow-400'}`}>Accueil</button>
                    <button onClick={() => setCurrentView('services')} className={`transition-colors ${isJour ? 'hover:text-purple-700' : 'hover:text-yellow-400'}`}>Services</button>
                    <button onClick={() => setCurrentView('panier')} className={`relative transition-colors ${isJour ? 'hover:text-purple-700' : 'hover:text-yellow-400'}`}>
                        🛒 Panier
                        {nombreArticles > 0 && (
                            <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{nombreArticles}</span>
                        )}
                    </button>
                    {!token ? (
                        <>
                            <button onClick={() => setCurrentView('login')} className="hover:underline">Connexion</button>
                            <button onClick={() => setCurrentView('registerChoice')} className={`px-3 py-1 rounded-lg transition-colors ${isJour ? 'bg-black/10 hover:bg-black/20' : 'bg-white/10 hover:bg-white/20'}`}>
                                S'inscrire
                            </button>
                        </>
                    ) : (
                        <button onClick={handleDeconnexion} className="bg-red-600/80 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition-all">Déconnexion</button>
                    )}
                </nav>
            </header>

            <main className="relative z-10">{renderMainView()}</main>

            <footer className={`mt-12 text-center text-xs pb-6 ${isJour ? 'text-gray-400' : 'text-white/40'}`}>
                🌍 KANARI SERVICE — Services de confiance en Afrique de l'Ouest
                {isInstalled && <span className="ml-2 text-green-500">● Application installée</span>}
            </footer>
        </div>
    );
}