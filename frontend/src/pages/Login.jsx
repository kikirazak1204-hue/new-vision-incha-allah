import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './context/AuthContext';

const Login = () => {
    // On utilise "identifiant" qui peut être l'email OU le numéro
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
            // Envoi des données au backend
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                identifiant,
                password
            });

            const { token, user } = response.data;

            // Enregistrement sécurisé dans le contexte
            login(token, user);

            // Redirection stricte selon le rôle
            const role = String(user?.role || user?.typeProfil || user?.type || '').toLowerCase();

            if (role.includes('admin')) {
                navigate('/admin');
            } else if (role.includes('fournisseur') || role.includes('prestataire')) {
                navigate('/fournisseur');
            } else {
                navigate('/dashboard'); // Client classique
            }

        } catch (err) {
            // Message générique pour des raisons de sécurité (ne pas dire si c'est l'email ou le mot de passe qui est faux)
            setErreur(err.response?.data?.message || 'Identifiants incorrects.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Connexion à Kanari</h2>
            {erreur && <div className="error-message">{erreur}</div>}
            
            <form onSubmit={handleLogin}>
                <div>
                    <label>Email ou Numéro de téléphone</label>
                    <input 
                        type="text" 
                        value={identifiant} 
                        onChange={(e) => setIdentifiant(e.target.value)} 
                        placeholder="Ex: contact@email.com ou 90000000"
                        required 
                    />
                </div>
                <div>
                    <label>Mot de passe</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Connexion en cours...' : 'Se connecter'}
                </button>
            </form>
        </div>
    );
};

export default Login;