import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
            <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
                <h1 className="text-3xl font-black text-center mb-2">Rejoignez Kanari</h1>
                <p className="text-slate-400 text-center mb-8">Choisissez votre profil pour continuer</p>

                <div className="space-y-4">
                    <button onClick={() => navigate('/register-utilisateur')} 
                        className="w-full p-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl transition text-left">
                        <h3 className="font-bold text-lg">Je suis un Client</h3>
                        <p className="text-xs text-slate-400">Pour réserver vos services rapidement.</p>
                    </button>

                    <button onClick={() => navigate('/register-prestataire')} 
                        className="w-full p-6 bg-slate-800 hover:bg-indigo-900/30 border border-slate-700 hover:border-indigo-500 transition text-left">
                        <h3 className="font-bold text-lg">Je suis un Prestataire</h3>
                        <p className="text-xs text-slate-400">Pour proposer vos services et être suivi.</p>
                    </button>
                </div>
            </div>
        </div>
    );
}