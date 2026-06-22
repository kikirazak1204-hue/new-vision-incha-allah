import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices } from '../util/api';
import AccueilPage from './AccueilPage';
import { useNavigation } from '../context/NavigationContext'; // 1. Import du nouveau hook

export default function Accueil() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const navigate = useNavigate(); // Gardé pour la navigation dynamique interne
    const { navigateTo } = useNavigation(); // 2. Utilisation du contexte de navigation

    useEffect(() => {
        const fetchAllServices = async () => {
            try {
                const data = await getServices();
                const normalizedData = Array.isArray(data) ? data : (data?.data || []);
                setServices(normalizedData);
            } catch (err) {
                console.error("Erreur de chargement des services:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllServices();
    }, []);

    const handleServiceSelection = (service) => {
        const id = service.id || service._id;
        console.log("🚀 [ACCUEIL] Clic sur le service ID :", id);

        // Stockage local
        localStorage.setItem('selectedService', JSON.stringify(service));
        localStorage.setItem('selectedServiceId', id);

        // Navigation vers le détail
        navigate(`/service/${id}`);
    };

    return (
        <AccueilPage
            services={services}
            loading={loading}
            setSelectedService={handleServiceSelection} 
            // 3. On passe navigateTo si AccueilPage en a besoin pour des boutons (ex: "Aller au login")
            navigateTo={navigateTo} 
        />
    );
}