import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PanierProvider } from './context/PanierContext';

import Accueil from './pages/Accueil';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterUtilisateur from './pages/RegisterUtilisateur';
import FournisseursParService from './pages/FournisseursParService';
import PaiementPage from './pages/PaiementPage';
import DashboardFournisseur from './pages/DashboardFournisseur';
import DashboardClient from './pages/DashboardClient';
import AjouterProduit from './pages/AjouterProduit';
import VoirProduits from './pages/VoirProduitsPage';
import HistoriquePaiements from './pages/HistoriquePaiements';
import ModifierProduit from './pages/ModifierProduit';
import AdminDashboard from './pages/AdminDashboard';
import WhatsAppSetup from './pages/WhatsAppSetup';

function PrivateRoute({ children, role }) {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;
    if (role) {
        try {
            const user = JSON.parse(localStorage.getItem('user')) || {};
            if (user.role !== role) return <Navigate to="/accueil" replace />;
        } catch {
            return <Navigate to="/login" replace />;
        }
    }
    return children;
}

export default function App() {
    return (
        <Router>
            <PanierProvider>
                <Routes>
                    {/* Publiques */}
                    <Route path="/accueil" element={<Accueil />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/register-utilisateur" element={<RegisterUtilisateur />} />
                    <Route path="/services/:id" element={<FournisseursParService />} />
                    <Route path="/voir-produitsPage" element={<VoirProduits />} />

                    {/* Client */}
                    <Route path="/dashboard-client" element={<PrivateRoute role="utilisateur"><DashboardClient /></PrivateRoute>} />
                    <Route path="/mes-paiements" element={<PrivateRoute><HistoriquePaiements /></PrivateRoute>} />
                    <Route path="/paiement" element={<PrivateRoute><PaiementPage /></PrivateRoute>} />

                    {/* Fournisseur */}
                    <Route path="/dashboard-fournisseur" element={<PrivateRoute role="fournisseur"><DashboardFournisseur /></PrivateRoute>} />
                    <Route path="/ajouter-produit" element={<PrivateRoute role="fournisseur"><AjouterProduit /></PrivateRoute>} />
                    <Route path="/modifier-produit/:id" element={<PrivateRoute role="fournisseur"><ModifierProduit /></PrivateRoute>} />

                    {/* ✅ Admin protégé — role admin uniquement */}
                    <Route path="/admin" element={
                        <PrivateRoute role="admin">
                            <AdminDashboard />
                        </PrivateRoute>
                    } />

                    {/* WhatsApp Setup */}
                    <Route path="/whatsapp-setup" element={<WhatsAppSetup />} />

                    <Route path="/" element={<Navigate to="/accueil" replace />} />
                    <Route path="*" element={<Navigate to="/accueil" replace />} />
                </Routes>
            </PanierProvider>
        </Router>
    );
}