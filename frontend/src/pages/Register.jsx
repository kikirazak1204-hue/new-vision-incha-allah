import React from 'react';
import { Link } from 'react-router-dom';

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="p-8 bg-black/60 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-2">Inscription (temporaire)</h1>
        <p className="text-sm text-white/70">Page d'inscription remplacée temporairement pour réparer la build.</p>
        <div className="mt-4">
          <Link to="/login" className="text-blue-400 hover:underline">Se connecter</Link>
        </div>
      </div>
    </div>
  );
}
