import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext'; // Import de ton contexte
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* 👈 C'est ici qu'il doit envelopper l'application */}
      <App />
    </AuthProvider>
  </React.StrictMode>
);