import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
            <div className="max-w-xl w-full bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
                <h1 className="text-3xl font-black text-center mb-2">Rejoignez Kanari</h1>
                <p className="text-slate-400 text-center mb-8">Choisissez votre profil exact pour continuer</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => navigate('/register-utilisateur')} 
                        className="p-5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl transition text-left">
                        <span className="text-2xl mb-2 block">👤</span>
                        <h3 className="font-bold text-base">Client</h3>
                        <p className="text-xs text-slate-400 mt-1">Pour réserver vos prestations et commander.</p>
                    </button>

                    <button onClick={() => navigate('/register-prestataire')} 
                        className="p-5 bg-slate-800 hover:bg-amber-500/10 border border-slate-700 hover:border-amber-400 transition text-left">
                        <span className="text-2xl mb-2 block">⚡</span>
                        <h3 className="font-bold text-base">Prestataire</h3>
                        <p className="text-xs text-slate-400 mt-1">Pour proposer vos services techniques et interventions.</p>
                    </button>

                    <button onClick={() => navigate('/register-prestataire')} 
                        className="p-5 bg-slate-800 hover:bg-amber-500/10 border border-slate-700 hover:border-amber-400 transition text-left">
                        <span className="text-2xl mb-2 block">🤝</span>
                        <h3 className="font-bold text-base">Partenaire</h3>
                        <p className="text-xs text-slate-400 mt-1">Pour structurer une collaboration commerciale.</p>
                    </button>

                    <button onClick={() => navigate('/register-prestataire')} 
                        className="p-5 bg-slate-800 hover:bg-amber-500/10 border border-slate-700 hover:border-amber-400 transition text-left">
                        <span className="text-2xl mb-2 block">📦</span>
                        <h3 className="font-bold text-base">Fournisseur</h3>
                        <p className="text-xs text-slate-400 mt-1">Pour approvisionner en produits et ressources.</p>
                    </button>

                    <button onClick={() => navigate('/register-prestataire')} 
                        className="p-5 bg-slate-800 hover:bg-amber-500/10 border border-slate-700 hover:border-amber-400 transition text-left">
                        <span className="text-2xl mb-2 block">🛍️</span>
                        <h3 className="font-bold text-base">Commerçant</h3>
                        <p className="text-xs text-slate-400 mt-1">Pour vendre vos articles sur la boutique.</p>
                    </button>

                    <button onClick={() => navigate('/register-prestataire')} 
                        className="p-5 bg-slate-800 hover:bg-amber-500/10 border border-slate-700 hover:border-amber-400 transition text-left">
                        <span className="text-2xl mb-2 block">🛡️</span>
                        <h3 className="font-bold text-base">Agent / Stagiaire</h3>
                        <p className="text-xs text-slate-400 mt-1">Pour l'équipe de terrain et la tour de contrôle.</p>
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <button onClick={() => navigate('/login')} className="text-xs text-slate-400 hover:text-amber-400 transition">
                        Vous avez déjà un compte ? <span className="underline font-bold">Connectez-vous</span>
                    </button>
                </div>
            </div>
        </div>
    );
}