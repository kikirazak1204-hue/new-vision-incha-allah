import React, { useState } from 'react';

import ValidationsAdmin from '../components/admin/ValidationsAdmin';
import UtilisateursAdmin from '../components/admin/UtilisateursAdmin';
import ProduitsAdmin from '../components/admin/ProduitsAdmin';
import ReservationsAdmin from '../components/admin/ReservationsAdmin';
import ParametresAdmin from '../components/admin/ParametresAdmin';

// Vérifie que ce fichier existe bien.
// Si le nom ou le chemin est différent, adapte uniquement cette ligne.


export default function AdminDashboard() {
  const [tab, setTab] = useState('reservations');

  const menuItems = [
    {
      id: 'reservations',
      label: 'Missions',
      color: 'from-pink-600 to-rose-500',
    },
    {
      id: 'validations',
      label: 'Validations',
      color: 'from-blue-600 to-cyan-500',
    },
    {
      id: 'utilisateurs',
      label: 'Utilisateurs',
      color: 'from-purple-600 to-indigo-500',
    },
    {
      id: 'paiements',
      label: 'Paiements',
      color: 'from-emerald-600 to-teal-500',
    },
    {
      id: 'produits',
      label: 'Produits',
      color: 'from-orange-600 to-red-500',
    },
    {
      id: 'parametres',
      label: 'Paramètres',
      color: 'from-slate-600 to-slate-500',
    },
  ];

  const activeItem = menuItems.find((item) => item.id === tab);

  const getTitle = () => {
    switch (tab) {
      case 'reservations':
        return 'Missions';
      case 'validations':
        return 'Validations';
      case 'utilisateurs':
        return 'Utilisateurs';
      case 'paiements':
        return 'Paiements';
      case 'produits':
        return 'Produits';
      case 'parametres':
        return 'Paramètres';
      default:
        return 'Administration';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#061a3a] flex flex-col md:flex-row font-sans">

      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col shadow-sm">

        {/* LOGO / TITRE */}
        <div className="mb-10 px-2">
          <h1 className="text-2xl font-black text-[#061a3a]">
            PANEL ADMIN
          </h1>

          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
            Kanari Service
          </p>
        </div>

        {/* MENU */}
        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-300 font-semibold ${
                tab === item.id
                  ? `bg-gradient-to-r ${item.color} shadow-lg shadow-slate-300/40 text-white translate-x-1`
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#061a3a]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* QUITTER */}
        <div className="mt-auto pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            className="w-full p-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            Quitter l'Admin
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">

        {/* HEADER */}
        <header className="mb-8">
          <div className="flex items-center justify-between gap-4">

            <div>
              <h2 className="text-3xl font-black text-[#061a3a]">
                {getTitle()}
              </h2>

              <p className="text-slate-500 text-sm mt-1">
                Gestion des données de la plateforme
              </p>
            </div>

            {/* INDICATEUR SECTION */}
            {activeItem && (
              <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
                <span
                  className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${activeItem.color}`}
                />
                <span className="text-sm font-semibold text-slate-600">
                  Administration
                </span>
              </div>
            )}
          </div>
        </header>

        {/* CONTENU */}
        <div className="bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">

          {tab === 'reservations' && (
            <ReservationsAdmin />
          )}

          {tab === 'validations' && (
            <ValidationsAdmin />
          )}

          {tab === 'utilisateurs' && (
            <UtilisateursAdmin />
          )}

          {tab === 'paiements' && (
            <PaiementAdmin />
          )}

          {tab === 'produits' && (
            <ProduitsAdmin />
          )}

          {tab === 'parametres' && (
            <ParametresAdmin />
          )}

        </div>
      </main>
    </div>
  );
}