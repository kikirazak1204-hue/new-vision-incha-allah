// ============================================================
// Fichier : frontend/src/App.jsx — Complet avec Connexion & Déconnexion
// ============================================================

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Briefcase, ShoppingBag, ShoppingCart, User, LogIn, LogOut,
  Menu, X, Download
} from 'lucide-react';

// Providers & Contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { PanierProvider, usePanier } from './context/PanierContext';
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

function useSessionState() {
  const auth = useAuth() || {};
  const location = useLocation();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick(t => t + 1);
    window.addEventListener('storage', refresh);
    window.addEventListener('auth-change', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('auth-change', refresh);
    };
  }, [location.pathname, tick]);

  const storedUser = (() => {
    try {
      const raw = localStorage.getItem('user') || localStorage.getItem('utilisateur');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const storedToken = localStorage.getItem('token');
  const currentUser = auth.user || auth.utilisateur || auth.currentUser || storedUser;
  const isAuthenticated = Boolean(currentUser || auth.token || storedToken);

  const role = currentUser?.role || currentUser?.type || '';
  const dashboardPath =
    role === 'admin'
      ? '/admin'
      : role === 'fournisseur' || role === 'prestataire'
      ? '/dashboard-fournisseur'
      : '/dashboard-client';

  return { auth, currentUser, isAuthenticated, dashboardPath };
}

function performLogout(auth, navigate) {
  try {
    if (typeof auth.logout === 'function') auth.logout();
    if (typeof auth.deconnexion === 'function') auth.deconnexion();
    if (typeof auth.setUser === 'function') auth.setUser(null);
  } catch (err) {
    console.error('Erreur lors de la déconnexion :', err);
  }

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('utilisateur');
  sessionStorage.clear();
  window.dispatchEvent(new Event('auth-change'));

  navigate('/login', { replace: true });
}

function PremiumNavbar({ showInstallBtn, onInstallApp }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { auth, currentUser, isAuthenticated, dashboardPath } = useSessionState();
  const { panier } = usePanier() || {};

  const nbArticles = Array.isArray(panier)
    ? panier.reduce((acc, item) => acc + (Number(item.quantite) || 1), 0)
    : 0;

  const handleLogout = () => {
    setMobileMenuOpen(false);
    performLogout(auth, navigate);
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition-all ${
      isActive
        ? 'bg-[#F2B632] text-[#061A3A] shadow-sm'
        : 'text-slate-200 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#061A3A]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 lg:px-8">
        {/* Marque Kanari Service */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2B632] font-black text-[#061A3A] shadow">
            K
          </span>
          <div className="leading-tight">
            <span className="block text-sm font-black tracking-wide text-white sm:text-base">
              KANARI <span className="text-[#F2B632]">SERVICE</span>
            </span>
            <span className="hidden text-[10px] font-medium text-blue-200 sm:block">
              Niamey • Services & Boutique
            </span>
          </div>
        </Link>

        {/* Navigation principale desktop */}
        <nav className="hidden items-center gap-1.5 lg:flex" aria-label="Navigation principale">
          <NavLink to="/" end className={navLinkClass}>
            <Home size={16} /> Accueil
          </NavLink>
          <NavLink to="/selection" className={navLinkClass}>
            <Briefcase size={16} /> Services
          </NavLink>
          <NavLink to="/produits" className={navLinkClass}>
            <ShoppingBag size={16} /> Boutique
          </NavLink>
          <NavLink to="/a-propos" className={navLinkClass}>
            À propos
          </NavLink>
        </nav>

        {/* Actions toujours visibles (Panier + Connexion / Espace + Déconnexion) */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            to="/panier"
            className="relative inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-2.5 py-2 text-xs font-bold text-white transition hover:border-[#F2B632] hover:bg-white/15 sm:px-3 sm:text-sm"
            aria-label="Voir le panier"
          >
            <ShoppingCart size={17} className="text-[#F2B632]" />
            <span className="hidden xl:inline">Panier</span>
            {nbArticles > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#F2B632] px-1.5 text-[11px] font-black text-[#061A3A]">
                {nbArticles}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#123D72] px-2.5 py-2 text-xs font-extrabold text-white transition hover:bg-[#1a5299] sm:px-3 sm:text-sm"
              >
                <User size={16} className="text-[#F2B632]" />
                <span>
                  {currentUser?.nom ? currentUser.nom.split(' ')[0] : 'Mon Espace'}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                title="Se déconnecter"
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/50 bg-rose-600 px-2.5 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-rose-700 sm:px-3 sm:text-sm"
              >
                <LogOut size={16} />
                <span>Déconnexion</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F2B632] px-3 py-2 text-xs font-extrabold text-[#061A3A] shadow-sm transition hover:bg-[#E5A91F] sm:px-3.5 sm:text-sm"
            >
              <LogIn size={16} />
              <span>Connexion</span>
            </Link>
          )}

          <div className="hidden xl:block">
            <AutoTranslator />
          </div>

          {showInstallBtn && (
            <button
              type="button"
              onClick={onInstallApp}
              className="hidden items-center gap-1.5 rounded-xl border border-[#F2B632]/50 bg-[#F2B632]/15 px-3 py-2 text-xs font-extrabold text-[#F2B632] transition hover:bg-[#F2B632]/25 2xl:inline-flex"
            >
              <Download size={14} /> Installer
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white lg:hidden"
            aria-label="Ouvrir le menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Menu mobile dépliable */}
      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#061A3A] px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-2">
            <NavLink to="/" end className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
              <Home size={17} /> Accueil
            </NavLink>
            <NavLink to="/selection" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
              <Briefcase size={17} /> Services
            </NavLink>
            <NavLink to="/produits" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
              <ShoppingBag size={17} /> Boutique
            </NavLink>
            <NavLink to="/a-propos" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
              À propos
            </NavLink>

            <div className="my-1 flex flex-col gap-2 border-t border-white/10 pt-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to={dashboardPath}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#123D72] px-4 py-2.5 text-sm font-black text-white"
                  >
                    <User size={17} className="text-[#F2B632]" />
                    Accéder à mon espace
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white"
                  >
                    <LogOut size={17} />
                    Se déconnecter
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F2B632] px-4 py-2.5 text-sm font-black text-[#061A3A]"
                >
                  <LogIn size={17} />
                  Se connecter
                </Link>
              )}
            </div>

            <div className="pt-1">
              <AutoTranslator />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function FloatingAuthDock() {
  const navigate = useNavigate();
  const { auth, isAuthenticated, dashboardPath } = useSessionState();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-2xl border border-white/15 bg-[#061A3A]/95 p-1.5 shadow-2xl backdrop-blur-md">
      {isAuthenticated ? (
        <>
          <Link
            to={dashboardPath}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#123D72] px-3 py-2 text-xs font-extrabold text-white transition hover:bg-[#1a5299]"
          >
            <User size={14} className="text-[#F2B632]" />
            <span>Espace</span>
          </Link>
          <button
            type="button"
            onClick={() => performLogout(auth, navigate)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-rose-700"
          >
            <LogOut size={14} />
            <span>Déconnexion</span>
          </button>
        </>
      ) : (
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#F2B632] px-3.5 py-2 text-xs font-extrabold text-[#061A3A] transition hover:bg-[#E5A91F]"
        >
          <LogIn size={14} />
          <span>Connexion</span>
        </Link>
      )}
    </div>
  );
}

export default function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const registerSW = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js')
          .then(() => console.log('✅ Service Worker Kanari enregistré avec succès !'))
          .catch(err => console.error('❌ Erreur Service Worker:', err));
      }
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }

    const handleBeforeInstallPrompt = e => {
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
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    }
  };

  return (
    <AuthProvider>
      <PanierProvider>
        <NavigationProvider>
          <div className="relative min-h-screen bg-[#F4F6F9] font-sans text-slate-900">
            <PremiumNavbar showInstallBtn={showInstallBtn} onInstallApp={handleInstallApp} />
            <GlobalLocationBar />
            <NotificationsInit />

            <Routes>
              {/* 1. PAGES INSTITUTIONNELLES & PUBLIQUES */}
              <Route path="/" element={<Accueil />} />
              <Route path="/a-propos" element={<AProposPage />} />

              {/* 2. EXPLORATION & CATALOGUE */}
              <Route path="/selection" element={<ServiceSelectionPage />} />
              <Route path="/service/:id" element={<ServiceDetailPage />} />
              <Route path="/produits" element={<VoirProduits />} />
              <Route path="/produits/:fournisseurId" element={<ProduitsParFournisseur />} />
              <Route path="/produits/service/:serviceId" element={<ProduitsParService />} />
              <Route path="/fournisseur-profil/:id?" element={<FournisseurProfilePage />} />

              {/* 3. PARCOURS COMMANDE & SUIVI */}
              <Route path="/panier" element={<PanierPage />} />
              <Route path="/reservation" element={<ReservationPage />} />
              <Route path="/paiement" element={<PaiementPage />} />
              <Route path="/suivi-commande/:missionId" element={<OrderTracking />} />

              {/* 4. AUTHENTIFICATION */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register-utilisateur" element={<RegisterUtilisateur />} />
              <Route path="/register-prestataire" element={<RegisterPrestataire />} />

              {/* 5. ESPACE SÉCURISÉ - CLIENT */}
              <Route
                path="/dashboard-client"
                element={
                  <ProtectedRoute role="client">
                    <DashboardClient />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/historique-paiements"
                element={
                  <ProtectedRoute role="client">
                    <HistoriquePaiements />
                  </ProtectedRoute>
                }
              />
              <Route path="/dashboard/client" element={<Navigate to="/dashboard-client" replace />} />

              {/* 6. ESPACE SÉCURISÉ - PRESTATAIRE / FOURNISSEUR */}
              <Route
                path="/dashboard-fournisseur"
                element={
                  <ProtectedRoute role="fournisseur">
                    <DashboardFournisseur />
                  </ProtectedRoute>
                }
              />
              <Route path="/dashboard/fournisseur" element={<Navigate to="/dashboard-fournisseur" replace />} />

              {/* 7. ESPACE SÉCURISÉ - ADMIN */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute role="admin">
                    <DashboardAdmin />
                  </ProtectedRoute>
                }
              />

              {/* REDIRECTION PAR DÉFAUT */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <FloatingAuthDock />
          </div>
        </NavigationProvider>
      </PanierProvider>
    </AuthProvider>
  );
}