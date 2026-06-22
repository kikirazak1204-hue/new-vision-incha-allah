import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../util/api'; // Assure-toi que cette fonction existe

export default function RegisterUtilisateur() {
    const [form, setForm] = useState({ nom: '', ville: '', telephone: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Appel à ton API
            const result = await registerUser(form);

            if (result.success) {
                // Si l'API renvoie un token directement après inscription, tu peux le stocker
                if (result.token) {
                    localStorage.setItem("token", result.token);
                    localStorage.setItem("user", JSON.stringify(result.user));
                    navigate('/dashboard-client'); // Redirection vers le Dashboard
                } else {
                    // Sinon, redirection vers login avec un message
                    alert("Inscription réussie ! Vous pouvez vous connecter.");
                    navigate('/login');
                }
            } else {
                setError(result.message || "Une erreur est survenue");
            }
        } catch (err) {
            setError("Erreur de connexion au serveur.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
                <h2 className="text-3xl font-black text-white mb-6 text-center">Inscription Client</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="nom" placeholder="Nom complet" required onChange={(e) => setForm({...form, nom: e.target.value})} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white" />
                    <input name="ville" placeholder="Ville" required onChange={(e) => setForm({...form, ville: e.target.value})} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white" />
                    <input name="telephone" placeholder="Téléphone" required onChange={(e) => setForm({...form, telephone: e.target.value})} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white" />
                    <input name="email" type="email" placeholder="Email" required onChange={(e) => setForm({...form, email: e.target.value})} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white" />
                    <input name="password" type="password" placeholder="Mot de passe" required onChange={(e) => setForm({...form, password: e.target.value})} className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white" />
                    
                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-4 rounded-xl font-bold text-white hover:opacity-90 transition disabled:opacity-50">
                        {loading ? "Inscription en cours..." : "S'inscrire comme Client"}
                    </button>
                </form>

                <p className="mt-6 text-center text-slate-500">
                    Déjà un compte ? <Link to="/login" className="text-purple-400 hover:underline">Se connecter</Link>
                </p>
            </div>
        </div>
    );
}