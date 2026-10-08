import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://newvision-backend.onrender.com';

const Login = () => {
    const [identifiant, setIdentifiant] = useState('');
    const [password, setPassword] = useState('');
    const [erreur, setErreur] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErreur('');
        setLoading(true);

        try {
            // ✅ Appel vers l'API Render
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                identifiant,
                password
            });

            const { token, user } = response.data;
            login(token, user);

            // ✅ Redirection alignée sur les routes de App.jsx
            const role = String(user?.role || user?.typeProfil || user?.type || '').toLowerCase();

            if (role.includes('admin')) {
                navigate('/admin');
            } else if (role.includes('fournisseur') || role.includes('prestataire')) {
                navigate('/dashboard-fournisseur');
            } else {
                navigate('/dashboard-client');
            }

        } catch (err) {
            setErreur(err.response?.data?.message || 'Identifiants incorrects.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 bg-slate-950">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6">

                {/* En-tête */}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                        Connexion à <span className="text-[#13d484]">Kanari</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400">
                        Entrez vos identifiants pour accéder à votre espace
                    </p>
                </div>

                {/* Message d'erreur */}
                {erreur && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm p-3 rounded-xl text-center">
                        {erreur}
                    </div>
                )}

                {/* Formulaire */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                            Email ou Numéro de téléphone
                        </label>
                        <input
                            type="text"
                            value={identifiant}
                            onChange={(e) => setIdentifiant(e.target.value)}
                            placeholder="Ex: contact@email.com ou 90000000"
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#13d484] transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#13d484] transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#13d484] hover:bg-emerald-400 text-slate-950 font-black text-sm py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-[#13d484]/10 disabled:opacity-50"
                    >
                        {loading ? 'Connexion en cours...' : 'Se connecter'}
                    </button>
                </form>

                {/* Liens d'inscription */}
                <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800">
                    Pas encore de compte ?{' '}
                    <Link to="/register" className="text-[#13d484] font-bold hover:underline">
                        S'inscrire
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;