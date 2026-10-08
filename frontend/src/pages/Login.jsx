import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL =
    import.meta.env.VITE_API_URL || 'https://newvision-backend.onrender.com';

const Login = () => {
    const [identifiant, setIdentifiant] = useState('');
    const [password, setPassword] = useState('');
    const [erreur, setErreur] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        setErreur('');
        setLoading(true);

        const cleanInput = identifiant.trim();

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/auth/login`,
                {
                    identifiant: cleanInput,
                    email: cleanInput, // Compatibilité backend (recherche par req.body.email ou req.body.identifiant)
                    password,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                }
            );

            const { token, user } = response.data || {};

            if (!token || !user) {
                throw new Error('Réponse de connexion invalide.');
            }

            // Authentification globale
            login(token, user);

            // Détection du profil
            const role = String(
                user?.role ||
                user?.typeProfil ||
                user?.type ||
                ''
            ).toLowerCase();

            // Redirection selon le profil
            if (role.includes('admin')) {
                navigate('/admin', { replace: true });
            } else if (
                role.includes('fournisseur') ||
                role.includes('prestataire')
            ) {
                navigate('/dashboard-fournisseur', { replace: true });
            } else {
                navigate('/dashboard-client', { replace: true });
            }

        } catch (err) {
            console.error('Erreur connexion:', err);

            if (err.code === 'ECONNABORTED') {
                setErreur(
                    'Le serveur met trop de temps à répondre. Veuillez réessayer.'
                );
            } else if (!err.response) {
                setErreur(
                    'Impossible de contacter le serveur. Vérifiez votre connexion.'
                );
            } else {
                setErreur(
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    'Identifiants incorrects.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center px-4 py-10">

            <div className="w-full max-w-md">

                {/* Logo / marque */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#061a3a] shadow-lg mb-4">
                        <span className="text-2xl font-black text-white">
                            K
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#061a3a]">
                        Bienvenue sur{' '}
                        <span className="text-[#2563eb]">Kanari</span>
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Connectez-vous pour accéder à votre espace
                    </p>
                </div>

                {/* Carte connexion */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/60 p-6 sm:p-8">

                    {/* Message erreur */}
                    {erreur && (
                        <div
                            role="alert"
                            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            <span className="mt-0.5 font-bold">!</span>

                            <span>{erreur}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">

                        {/* Identifiant */}
                        <div>
                            <label
                                htmlFor="identifiant"
                                className="block mb-2 text-sm font-bold text-[#061a3a]"
                            >
                                Email ou numéro de téléphone
                            </label>

                            <input
                                id="identifiant"
                                type="text"
                                value={identifiant}
                                onChange={(e) =>
                                    setIdentifiant(e.target.value)
                                }
                                placeholder="Ex. contact@email.com ou 90000000"
                                autoComplete="username"
                                required
                                disabled={loading}
                                className="
                                    w-full
                                    h-12
                                    px-4
                                    rounded-xl
                                    border border-slate-200
                                    bg-slate-50
                                    text-slate-900
                                    placeholder:text-slate-400
                                    outline-none
                                    transition-all
                                    focus:bg-white
                                    focus:border-[#2563eb]
                                    focus:ring-4
                                    focus:ring-blue-100
                                    disabled:opacity-60
                                "
                            />
                        </div>

                        {/* Mot de passe */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-bold text-[#061a3a]"
                                >
                                    Mot de passe
                                </label>
                            </div>

                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Votre mot de passe"
                                    autoComplete="current-password"
                                    required
                                    disabled={loading}
                                    className="
                                        w-full
                                        h-12
                                        px-4
                                        pr-12
                                        rounded-xl
                                        border border-slate-200
                                        bg-slate-50
                                        text-slate-900
                                        placeholder:text-slate-400
                                        outline-none
                                        transition-all
                                        focus:bg-white
                                        focus:border-[#2563eb]
                                        focus:ring-4
                                        focus:ring-blue-100
                                        disabled:opacity-60
                                    "
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    disabled={loading}
                                    aria-label={
                                        showPassword
                                            ? 'Masquer le mot de passe'
                                            : 'Afficher le mot de passe'
                                    }
                                    className="
                                        absolute
                                        right-3
                                        top-1/2
                                        -translate-y-1/2
                                        w-9
                                        h-9
                                        rounded-lg
                                        text-slate-400
                                        hover:text-[#2563eb]
                                        hover:bg-blue-50
                                        transition
                                    "
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {/* Connexion */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="
                                w-full
                                h-12
                                rounded-xl
                                bg-[#061a3a]
                                hover:bg-[#0b2858]
                                active:scale-[0.99]
                                text-white
                                font-bold
                                text-sm
                                shadow-lg
                                shadow-blue-950/10
                                transition-all
                                disabled:cursor-not-allowed
                                disabled:opacity-60
                            "
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Connexion en cours...
                                </span>
                            ) : (
                                'Se connecter'
                            )}
                        </button>
                    </form>

                    {/* Séparation */}
                    <div className="flex items-center gap-4 my-7">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs text-slate-400">
                            Nouveau sur Kanari ?
                        </span>
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    {/* Inscription */}
                    <Link
                        to="/register"
                        className="
                            flex
                            items-center
                            justify-center
                            w-full
                            h-12
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            text-[#061a3a]
                            font-bold
                            text-sm
                            hover:border-[#2563eb]
                            hover:text-[#2563eb]
                            hover:bg-blue-50/50
                            transition-all
                        "
                    >
                        Créer un compte
                    </Link>
                </div>

                {/* Bas de page */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    © {new Date().getFullYear()} Kanari — Services à portée de main
                </p>
            </div>
        </main>
    );
};

export default Login;