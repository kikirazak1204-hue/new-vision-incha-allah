import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // 1. Importation du router
import { loginUser } from "../util/api";

export default function Login() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const navigate = useNavigate(); // 2. Initialisation de la navigation

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (message) setMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const result = await loginUser(form);
            
            if (result.success && result.token) {
                // Sauvegarde
                localStorage.setItem("token", result.token);
                localStorage.setItem("user", JSON.stringify(result.user));
                
                // Normalisation du rôle
                const role = result.user?.role?.toLowerCase();

                // 3. Logique de redirection avec navigate
                if (role === 'prestataire' || role === 'fournisseur') {
                    navigate('/dashboard-fournisseur');
                } else if (role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/dashboard-client');
                }
            } else {
                setMessage(result.message || "Identifiants incorrects.");
            }
        } catch (err) {
            console.error("Erreur de connexion :", err);
            setMessage("Erreur serveur. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-4 shadow-lg shadow-purple-900/20">
                        K
                    </div>
                    <h2 className="text-2xl font-bold">Connexion</h2>
                    <p className="text-slate-500 text-sm mt-1">Accédez à votre espace Kanari</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange}
                        required
                        className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 outline-none transition"
                    />
                    
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} name="password" placeholder="Mot de passe" value={form.password} onChange={handleChange}
                            required
                            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 outline-none transition"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-4 text-slate-500 hover:text-white cursor-pointer">
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                    </div>

                    {message && <p className="text-red-400 text-sm text-center">{message}</p>}

                    <button type="submit" disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 cursor-pointer">
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-800 text-center space-y-4">
                    <p className="text-slate-500 text-sm">Pas encore de compte ?</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            type="button"
                            onClick={() => navigate('/register-utilisateur')} 
                            className="py-3 rounded-xl border border-slate-800 hover:border-slate-700 text-sm font-semibold transition cursor-pointer block w-full">
                            Client
                        </button>
                        <button 
                            type="button"
                            onClick={() => navigate('/register-prestataire')} 
                            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold transition cursor-pointer block w-full">
                            Prestataire
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}