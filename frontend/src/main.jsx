import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('❌ Élément #root introuvable dans index.html');

// ✅ Enregistrement du Service Worker — condition obligatoire
// pour que le navigateur propose le bouton "Installer l'app" (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker enregistré avec succès :', registration.scope);
            })
            .catch((error) => {
                console.error('❌ Échec de l\'enregistrement du Service Worker :', error);
            });
    });
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);