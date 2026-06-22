import { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

export const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
    const navigate = useNavigate();

    const navigateTo = (viewName) => {
        switch (viewName) {
            case 'login': navigate('/login'); break;
            case 'register-utilisateur': navigate('/register-utilisateur'); break;
            case 'register-prestataire': navigate('/register-prestataire'); break;
            case 'dashboard-client': navigate('/dashboard-client'); break;
            case 'dashboard-fournisseur': navigate('/dashboard-fournisseur'); break;
            case 'admin': navigate('/admin'); break;
            case 'serviceDetail':
                const savedId = localStorage.getItem('selectedServiceId');
                savedId ? navigate(`/service/${savedId}`) : navigate('/');
                break;
            case 'accueil':
            default: navigate('/'); break;
        }
    };

    return (
        <NavigationContext.Provider value={{ navigateTo }}>
            {children}
        </NavigationContext.Provider>
    );
};

// Hook personnalisé pour l'utiliser facilement
export const useNavigation = () => useContext(NavigationContext);