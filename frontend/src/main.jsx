// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('❌ Élément #root introuvable dans index.html');

// ✅ Désinstalle l'ancien Service Worker qui bloque tout
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
            registration.unregister();
            console.log('[PWA] Service Worker désinstallé ✅');
        }
    });
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);