import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
    const token = localStorage.getItem('token');
    // On parse l'utilisateur stocké (si tu le stockes dans le localStorage)
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        // Pas connecté -> Redirection vers login
        return <Navigate to="/login" replace />;
    }

    if (role && user.role !== role) {
        // Connecté mais rôle insuffisant -> Redirection accueil
        return <Navigate to="/" replace />;
    }

    return children;
}