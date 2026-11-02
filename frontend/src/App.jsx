// ============================================================
// Fichier : frontend/src/App.jsx
// ============================================================

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Providers & Contexts
import { AuthProvider } from './context/AuthContext';
import { PanierProvider } from './context/PanierContext';
import { NavigationProvider } from './context/NavigationContext';

// Composants de protection & utilitaires globaux
import ProtectedRoute from './components/ProtectedRoute';
import GlobalLocationBar from './components/GlobalLocationBar';
import AutoTranslator from './components/AutoTranslator';
import NotificationsInit from './components/NotificationsInit';
import OrderTracking from './components/OrderTracking';

// Pages Publiques & Institutionnelles
import Accueil from './pages/Accueil';
import AProposPage from './pages/AProposPage';
import ServiceSelectionPage from './pages/ServiceSelectionPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import PanierPage from './pages/PanierPage';
import ReservationPage from './pages/ReservationPage';
import PaiementPage from './pages/PaiementPage';

// Pages Catalogue & Prestataires
import VoirProduits from './pages/VoirProduitsPage';
import ProduitsParFournisseur from './pages/Produitsparfournisseur';
import ProduitsParService from './pages/ProduitsParService';
import FournisseurProfilePage from './pages/FournisseurProfilePage';

// Pages Authentification
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterUtilisateur from './pages/RegisterUtilisateur';
import RegisterPrestataire from './pages/RegisterPrestataire';

// Dashboards & Espace Sécurisés
import DashboardClient from './pages/DashboardClient';
import DashboardFournisseur from './pages/DashboardFournisseur';
import DashboardAdmin from './pages/AdminDashboard';
import HistoriquePaiements from './pages/HistoriquePaiements';

export default function App() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);

    useEffect(() => {
        const registerSW = () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                    .then(() => console.log('✅ Service Worker Kanari enregistré avec succès !'))
                    .catch(err => console.error('❌ Erreur Service Worker:', err));
            }
        };

        if (document.readyState === 'complete') {
            registerSW();
        } else {
            window.addEventListener('load', registerSW);
        }

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('load', registerSW);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallApp = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('🎉 L\'utilisateur a installé Kanari !');
            setDeferredPrompt(null);
            setShowInstallBtn(false);
        }
    };

    return (
        <AuthProvider>
            <PanierProvider>
                <NavigationProvider>
                    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 relative">

                        {/* 🌐 BARRE D'EN-TÊTE GLOBALE COMPACTE */}
                        <div className="bg-[#061a3a] border-b border-white/10 px-4 py-2 flex items-center justify-between sticky top-0 z-40">
                            <div className="flex items-center gap-2">
                                <span className="font-black tracking-wider text-[#13d484] text-sm cursor-pointer" onClick={() => window.location.href = '/'}>
                                    KANARI SERVICE
                                </span>
                            </div>

                            {/* Traduction automatique */}
                            <AutoTranslator />
                        </div>

                        {/* 📍 BARRE DE GÉOLOCALISATION GLOBALE */}
                        <GlobalLocationBar />

                        <NotificationsInit />

                        {/* 📲 BOUTON D'INSTALLATION PWA */}
                        {showInstallBtn && (
                            <div className="fixed bottom-4 left-4 right-4 z-50 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-2xl flex items-center justify-between max-w-md mx-auto animate-bounce">
                                <div>
                                    <p className="font-bold text-sm text-white">Installer l'application Kanari</p>
                                    <p className="text-xs text-slate-400">Pour recevoir vos notifications en temps réel.</p>
                                </div>
                                <button
                                    onClick={handleInstallApp}
                                    className="bg-[#13d484] hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition-all"
                                >
                                    Installer
                                </button>
                            </div>
                        )}

                        <Routes>
                            {/* 🟢 1. PAGES INSTITUTIONNELLES & PUBLIQUES */}
                            <Route path="/" element={<Accueil />} />
                            <Route path="/a-propos" element={<AProposPage />} />

                            {/* 🛍️ 2. EXPLORATION & CATALOGUE */}
                            <Route path="/selection" element={<ServiceSelectionPage />} />
                            <Route path="/service/:id" element={<ServiceDetailPage />} />
                            <Route path="/produits" element={<VoirProduits />} />
                            <Route path="/produits/:fournisseurId" element={<ProduitsParFournisseur />} />
                            <Route path="/produits/service/:serviceId" element={<ProduitsParService />} />
                            <Route path="/fournisseur-profil/:id?" element={<FournisseurProfilePage />} />

                            {/* 🛒 3. PARCOURS COMMANDE & SUIVI */}
                            <Route path="/panier" element={<PanierPage />} />
                            <Route path="/reservation" element={<ReservationPage />} />
                            <Route path="/paiement" element={<PaiementPage />} />
                            <Route path="/suivi-commande/:missionId" element={<OrderTracking />} />

                            {/* 🔑 4. AUTHENTIFICATION */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/register-utilisateur" element={<RegisterUtilisateur />} />
                            <Route path="/register-prestataire" element={<RegisterPrestataire />} />

                            {/* 🟠 5. ESPACE SÉCURISÉ - CLIENT */}
                            <Route path="/dashboard-client" element={
                                <ProtectedRoute role="client">
                                    <DashboardClient />
                                </ProtectedRoute>
                            } />
                            <Route path="/historique-paiements" element={
                                <ProtectedRoute role="client">
                                    <HistoriquePaiements />
                                </ProtectedRoute>
                            } />
                            <Route path="/dashboard/client" element={<Navigate to="/dashboard-client" replace />} />

                            {/* 🔵 6. ESPACE SÉCURISÉ - PRESTATAIRE / FOURNISSEUR */}
                            <Route path="/dashboard-fournisseur" element={
                                <ProtectedRoute role="fournisseur">
                                    <DashboardFournisseur />
                                </ProtectedRoute>
                            } />
                            <Route path="/dashboard/fournisseur" element={<Navigate to="/dashboard-fournisseur" replace />} />

                            {/* 🔴 7. ESPACE SÉCURISÉ - ADMIN */}
                            <Route path="/admin" element={
                                <ProtectedRoute role="admin">
                                    <DashboardAdmin />
                                </ProtectedRoute>
                            } />

                            {/* 🔀 REDIRECTION PAR DÉFAUT */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </div>
                </NavigationProvider>
            </PanierProvider>
        </AuthProvider>
    );
}