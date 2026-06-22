import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; 
import App from './App.jsx';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('❌ Élément #root introuvable dans index.html');

// Gestion des Service Workers
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.getRegistrations()
            .then((registrations) => {
                for (const registration of registrations) {
                    registration.unregister();
                }
            });
    });
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <BrowserRouter> {/* C'est l'unique routeur ici */}
            <App />
        </BrowserRouter>
    </React.StrictMode>
);