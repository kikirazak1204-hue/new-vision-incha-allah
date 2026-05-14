import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../util/api';

export default function RegisterUtilisateur() {
    const [form, setForm] = useState({ nom: '', ville: '', telephone: '', email: '', password: '' });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!form.nom || !form.email || !form.password) {
            setMessage('❌ Nom, email et mot de passe sont obligatoires.');
            return;
        }

        setLoading(true);
        try {
            const data = await registerUser({ ...form, role: 'utilisateur' });

            if (!data.success || !data.token) {
                setMessage('❌ ' + (data.message || 'Erreur lors de l\'inscription.'));
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setMessage('✅ Bienvenue ' + data.user.nom + ' !');
            setTimeout(() => navigate('/dashboard-client'), 1200);

        } catch (err) {
            console.error('Erreur inscription utilisateur :', err);
            setMessage('❌ Erreur serveur. Réessayez plus tard.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen px-6 py-12 text-white">
            <div
                className="fixed top-0 left-0 w-full h-full bg-cover bg-center z-[-1] opacity-30 blur-sm"
                style={{ backgroundImage: `url('/backgrounds/kiki3.jpg')` }}
            />
            <div className="max-w-md mx-auto bg-black/70 backdrop-blur-lg rounded-2xl p-8 space-y-8 shadow-xl">
                <h2 className="text-4xl font-bold text-center">Inscription Utilisateur</h2>

                {message && (
                    <div className={`text-center font-semibold p-3 rounded-lg ${message.startsWith('✅') ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'
                        }`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {[
                        { name: 'nom', placeholder: 'Nom *', type: 'text' },
                        { name: 'ville', placeholder: 'Ville', type: 'text' },
                        { name: 'telephone', placeholder: 'Téléphone', type: 'tel' },
                        { name: 'email', placeholder: 'Email *', type: 'email' },
                        { name: 'password', placeholder: 'Mot de passe *', type: 'password' },
                    ].map(field => (
                        <input
                            key={field.name}
                            type={field.type}
                            name={field.name}
                            placeholder={field.placeholder}
                            value={form[field.name]}
                            onChange={handleChange}
                            className="w-full p-4 rounded-xl bg-white/10 text-white placeholder-white/60"
                        />
                    ))}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full font-bold py-4 rounded-xl text-white transition-all
                            ${loading ? 'bg-white/20 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-indigo-700 hover:scale-105'}`}
                    >
                        {loading ? '⏳ Inscription...' : "S'inscrire"}
                    </button>
                </form>

                <p className="text-center text-white/60 text-sm">
                    Déjà un compte ?{' '}
                    <Link to="/login" className="text-blue-400 hover:underline">Se connecter</Link>
                </p>
            </div>
        </div>
    );
}