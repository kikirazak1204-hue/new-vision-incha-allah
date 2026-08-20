import { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

export const NavigationContext = createContext(null);

export const NavigationProvider = ({ children }) => {
    const navigate = useNavigate();

    /**
     * Navigue vers une vue centralisée avec gestion de state et paramètres.
     * @param {string} viewName - Nom de la vue ou chemin URL direct (ex: '/mon-profil')
     * @param {object} [options] - Options de navigation { state, params, replace }
     */
    const navigateTo = (viewName, options = {}) => {
        const { state, params, replace } = options;

        switch (viewName) {
            case 'login':
                navigate('/login', { state, replace });
                break;
            case 'register-utilisateur':
                navigate('/register-utilisateur', { state, replace });
                break;
            case 'register-prestataire':
                navigate('/register-prestataire', { state, replace });
                break;
            case 'dashboard-client':
                navigate('/dashboard-client', { state, replace });
                break;
            case 'dashboard-fournisseur':
                navigate('/dashboard-fournisseur', { state, replace });
                break;
            case 'admin':
                navigate('/admin', { state, replace });
                break;
            case 'reservation':
                navigate('/reservation', { state, replace });
                break;
            case 'paiement':
                navigate('/paiement', { state, replace });
                break;
            case 'historique-paiements':
                navigate('/historique-paiements', { state, replace });
                break;
            case 'serviceDetail': {
                const id = params?.id || localStorage.getItem('selectedServiceId');
                if (id) {
                    localStorage.setItem('selectedServiceId', id);
                    navigate(`/service/${id}`, { state, replace });
                } else {
                    navigate('/');
                }
                break;
            }
            case 'accueil':
                navigate('/', { state, replace });
                break;
            default:
                // Si la chaîne commence par un slash, c'est un chemin direct
                if (typeof viewName === 'string' && viewName.startsWith('/')) {
                    navigate(viewName, { state, replace });
                } else {
                    navigate('/');
                }
                break;
        }
    };

    return (
        <NavigationContext.Provider value={{ navigateTo }}>
            {children}
        </NavigationContext.Provider>
    );
};

// Hook personnalisé sécurisé
export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error("useNavigation doit être utilisé au sein d'un NavigationProvider.");
    }
    return context;
};