import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Providers et Contexts
import { PanierProvider } from './context/PanierContext';
import { NavigationProvider } from './context/NavigationContext';

// Composants de protection
import ProtectedRoute from './components/ProtectedRoute';

// Importations des pages
import Accueil from './pages/Accueil';
import ServiceDetailPage from './pages/ServiceDetailPage';
import Register from './pages/Register';
import RegisterPrestataire from './pages/RegisterPrestataire';
import RegisterUtilisateur from './pages/RegisterUtilisateur';
import Login from './pages/Login';
import DashboardClient from './pages/DashboardClient';
import DashboardFournisseur from './pages/DashboardFournisseur';
import DashboardAdmin from './pages/AdminDashboard';
import ReservationPage from './pages/ReservationPage';
import ProduitsParFournisseur from './pages/Produitsparfournisseur';

export default function App() {
    return (
        <PanierProvider>
            <NavigationProvider>
                <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
                    <Routes>
                        {/* Pages Publiques */}
                        <Route path="/" element={<Accueil />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/register-utilisateur" element={<RegisterUtilisateur />} />
                        <Route path="/register-prestataire" element={<RegisterPrestataire />} />
                        
                        {/* Pages dynamiques publiques */}
                        <Route path="/service/:id" element={<ServiceDetailPage />} />
                        <Route path="/produits/:fournisseurId" element={<ProduitsParFournisseur />} />
                        
                        {/* Dashboards Sécurisés par Rôle */}
                        <Route path="/dashboard-client" element={
                            <ProtectedRoute role="client">
                                <DashboardClient />
                            </ProtectedRoute>
                        } />
                        <Route path="/dashboard-fournisseur" element={
                            <ProtectedRoute role="fournisseur">
                                <DashboardFournisseur />
                            </ProtectedRoute>
                        } />
                        <Route path="/admin" element={
                            <ProtectedRoute role="admin">
                                <DashboardAdmin />
                            </ProtectedRoute>
                        } />
                        
                        {/* ✅ CORRIGÉ : Route sans ProtectedRoute pour préserver l'état de navigation (service/fournisseur) */}
                        <Route path="/reservation" element={<ReservationPage />} />
                        
                        {/* Redirection par défaut */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
            </NavigationProvider>
        </PanierProvider>
    );
}