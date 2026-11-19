import React, { useState } from 'react';

import ValidationsAdmin from '../components/admin/ValidationsAdmin';
import UtilisateursAdmin from '../components/admin/UtilisateursAdmin';
import ProduitsAdmin from '../components/admin/ProduitsAdmin';
import ReservationsAdmin from '../components/admin/ReservationsAdmin';
import ParametresAdmin from '../components/admin/ParametresAdmin';
import AbonnementsAdmin from '../components/admin/AbonnementsAdmin';
import AdminLiveDispatch from './AdminLiveDispatch';
import PaiementAdmin from '../components/admin/PaiementAdmin';
import ServicesAdmin from '../components/admin/ServicesAdmin';
import FinancesAdmin from '../components/admin/FinancesAdmin';

export default function AdminDashboard() {
  const [tab, setTab] = useState('reservations');

  const menuItems = [
    { id: 'reservations', label: 'Missions' },
    { id: 'abonnements', label: 'Abonnements' },
    { id: 'services', label: 'Services' },
    { id: 'live-gps', label: 'Tour de Contrôle' },
    { id: 'validations', label: 'Validations' },
    { id: 'utilisateurs', label: 'Utilisateurs' },
    { id: 'paiements', label: 'Paiements' },
    { id: 'finances', label: 'Finances' },
    { id: 'produits', label: 'Produits' },
    { id: 'parametres', label: 'Paramètres' },
  ];

  const getTitle = () => {
    switch (tab) {
      case 'reservations': return 'Missions';
      case 'abonnements': return 'Abonnements';
      case 'live-gps': return 'Tour de Contrôle GPS';
      case 'validations': return 'Validations';
      case 'utilisateurs': return 'Utilisateurs';
      case 'paiements': return 'Paiements';
      case 'finances': return 'Finances Kanari';
      case 'produits': return 'Produits';
      case 'parametres': return 'Paramètres';
      case 'services': return 'Services et branches';
      default: return 'Administration';
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#061A3A] flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-[#061A3A] text-white border-r border-white/10 p-6 flex flex-col shadow-lg">
        <div className="mb-10 px-2">
          <h1 className="text-2xl font-black tracking-tight text-white">
            PANEL <span className="text-[#F2B632]">ADMIN</span>
          </h1>
          <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-bold mt-1">
            Kanari Service
          </p>
        </div>

        <nav className="space-y-1.5 flex-1">
          {menuItems.map((item) => {
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-bold ${
                  isActive
                    ? 'bg-[#F2B632] text-[#061A3A] shadow-md'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {item.id === 'live-gps' && !isActive && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-[#F2B632] animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={() => { localStorage.clear(); window.location.href = '/'; }}
            className="w-full py-2.5 px-3 text-sm font-bold text-amber-300 hover:bg-white/10 rounded-xl transition-colors"
          >
            Quitter l&apos;Admin
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-[#061A3A]">{getTitle()}</h2>
              <p className="text-slate-500 text-sm mt-1">
                {tab === 'live-gps'
                  ? 'Suivi en temps réel des prestataires et livreurs'
                  : 'Gestion des données de la plateforme'}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white border border-indigo-200/80 rounded-xl px-4 py-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span className="text-sm font-bold text-[#061A3A]">Administration</span>
            </div>
          </div>
        </header>

        <div className="bg-white border border-slate-200 rounded-2xl p-2 md:p-4 shadow-sm">
          {tab === 'reservations' && <ReservationsAdmin />}
          {tab === 'abonnements' && <AbonnementsAdmin />}
          {tab === 'live-gps' && <AdminLiveDispatch />}
          {tab === 'validations' && <ValidationsAdmin />}
          {tab === 'utilisateurs' && <UtilisateursAdmin />}
          {tab === 'paiements' && <PaiementAdmin />}
          {tab === 'finances' && <FinancesAdmin />}
          {tab === 'produits' && <ProduitsAdmin />}
          {tab === 'parametres' && <ParametresAdmin />}
          {tab === 'services' && <ServicesAdmin />}
        </div>
      </main>
    </div>
  );
}