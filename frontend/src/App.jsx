// ============================================================
// Fichier : src/App.jsx
// ============================================================

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Providers et Contexts
import { PanierProvider } from './context/PanierContext';
import { NavigationProvider } from './context/NavigationContext';

// Composants de protection
import ProtectedRoute from './components/ProtectedRoute';

// Importations des pages
import Accueil from './pages/Accueil';
import ServiceSelectionPage from './pages/ServiceSelectionPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import Register from './pages/Register';
import RegisterPrestataire from './pages/RegisterPrestataire';
import RegisterUtilisateur from './pages/RegisterUtilisateur';
import Login from './pages/Login';
import DashboardClient from './pages/DashboardClient';
import DashboardFournisseur from './pages/DashboardFournisseur';
import DashboardAdmin from './pages/AdminDashboard';
import ReservationPage from './pages/ReservationPage';
import PaiementPage from './pages/PaiementPage';
import HistoriquePaiements from './pages/HistoriquePaiements'; // ⭐ ROUTE HISTORIQUE AJOUTÉE
import ProduitsParFournisseur from './pages/Produitsparfournisseur';
import PanierPage from './pages/PanierPage';
import ProduitsParService from './pages/ProduitsParService';
import VoirProduits from './pages/VoirProduitsPage';

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
        <PanierProvider>
            <NavigationProvider>
                <div className="min-h-screen bg-slate-950 font-sans text-slate-100 relative">

                    {showInstallBtn && (
                        <div className="fixed bottom-4 left-4 right-4 z-50 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-2xl flex items-center justify-between max-w-md mx-auto animate-bounce">
                            <div>
                                <p className="font-bold text-sm text-white">Installer l'application Kanari</p>
                                <p className="text-xs text-slate-400">Pour recevoir vos notifications en temps réel.</p>
                            </div>
                            <button
                                onClick={handleInstallApp}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition-all"
                            >
                                Installer
                            </button>
                        </div>
                    )}

                    <Routes>
                        {/* Pages Publiques */}
                        <Route path="/" element={<Accueil />} />
                        <Route path="/produits" element={<VoirProduits />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/register-utilisateur" element={<RegisterUtilisateur />} />
                        <Route path="/register-prestataire" element={<RegisterPrestataire />} />
                        <Route path="/selection" element={<ServiceSelectionPage />} />

                        {/* Pages dynamiques publiques */}
                        <Route path="/service/:id" element={<ServiceDetailPage />} />
                        <Route path="/produits/:fournisseurId" element={<ProduitsParFournisseur />} />
                        <Route path="/produits/service/:serviceId" element={<ProduitsParService />} />
                        <Route path="/reservation" element={<ReservationPage />} />
                        <Route path="/paiement" element={<PaiementPage />} />
                        <Route path="/historique-paiements" element={<HistoriquePaiements />} /> {/* ⭐ ROUTE HISTORIQUE PAIEMENTS ACTIVE */}
                        <Route path="/panier" element={<PanierPage />} />

                        {/* 🛡️ DASHBOARDS */}
                        <Route path="/dashboard-client" element={
                            <ProtectedRoute role="client">
                                <DashboardClient />
                            </ProtectedRoute>
                        } />
                        <Route path="/dashboard/client" element={
                            <ProtectedRoute role="client">
                                <DashboardClient />
                            </ProtectedRoute>
                        } />

                        <Route path="/dashboard-fournisseur" element={
                            <ProtectedRoute role="fournisseur">
                                <DashboardFournisseur />
                            </ProtectedRoute>
                        } />
                        <Route path="/dashboard/fournisseur" element={
                            <ProtectedRoute role="fournisseur">
                                <DashboardFournisseur />
                            </ProtectedRoute>
                        } />

                        <Route path="/admin" element={
                            <ProtectedRoute role="admin">
                                <DashboardAdmin />
                            </ProtectedRoute>
                        } />

                        {/* Redirection par défaut */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </NavigationProvider>
        </PanierProvider>
    );
}