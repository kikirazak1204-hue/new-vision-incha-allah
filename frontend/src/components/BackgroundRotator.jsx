import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackgroundRotator from '../components/BackgroundRotator'; // ✅ Assure-toi que le chemin est bon

export default function RegisterUtilisateur() {
    const [nom, setNom] = useState('');
    const [ville, setVille] = useState('');
    const [telephone, setTelephone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nomInscrit, setNomInscrit] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nom || !email || !password) {
            alert('Tous les champs sont obligatoires.');
            return;
        }

        const nouvelUtilisateur = {
            nom,
            ville,
            telephone,
            email,
            password,
            role: 'utilisateur',
        };

        try {
            const apiRoot = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiRoot}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nouvelUtilisateur),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                setNomInscrit(data.user.nom);
                setTimeout(() => navigate('/dashboard-client'), 1500);
            } else {
                alert('❌ Erreur : ' + data.message);
            }
        } catch (err) {
            alert('❌ Erreur serveur : ' + err.message);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden px-6 py-12 text-white">
            <BackgroundRotator /> {/* ✅ Fond dynamique */}

            <div className="relative z-10 max-w-3xl mx-auto bg-black/70 backdrop-blur-lg rounded-2xl p-8 space-y-8 shadow-xl animate-fadeIn">
                <h2 className="text-4xl font-bold text-center">Inscription Utilisateur</h2>

                {nomInscrit && (
                    <div className="text-center text-green-400 text-xl font-semibold">
                        ✅ Bienvenue {nomInscrit} ! Votre inscription est confirmée.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <input
                        type="text"
                        placeholder="Nom"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        className="w-full p-4 rounded-xl bg-white/10 text-white placeholder-white/60"
                    />
                    <input
                        type="text"
                        placeholder="Ville"
                        value={ville}
                        onChange={(e) => setVille(e.target.value)}
                        className="w-full p-4 rounded-xl bg-white/10 text-white placeholder-white/60"
                    />
                    <input
                        type="tel"
                        placeholder="Téléphone"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        className="w-full p-4 rounded-xl bg-white/10 text-white placeholder-white/60"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-4 rounded-xl bg-white/10 text-white placeholder-white/60"
                    />
                    <input
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-4 rounded-xl bg-white/10 text-white placeholder-white/60"
                    />

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-700 text-white font-bold py-4 rounded-xl hover:scale-105 transition-transform"
                    >
                        S’inscrire
                    </button>
                </form>
            </div>
        </div>
    );
}
