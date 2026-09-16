import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices } from '../util/api';
import AccueilPage from './AccueilPage';
import { useNavigation } from '../context/NavigationContext';

export default function Accueil() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { navigateTo } = useNavigation();

    const fetchAllServices = async () => {
        try {
            setLoading(true);
            const data = await getServices();
            const normalizedData = Array.isArray(data) ? data : (data?.data || []);
            setServices(normalizedData);
        } catch (err) {
            console.error('Erreur de chargement des services:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllServices();
        const interval = setInterval(fetchAllServices, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleServiceSelection = (service) => {
        const id = service?.id || service?._id;
        if (!id) return;
        console.log('🚀 [ACCUEIL] Clic sur le service ID :', id);
        localStorage.setItem('selectedService', JSON.stringify(service));
        localStorage.setItem('selectedServiceId', String(id));
        navigate(`/service/${id}`);
    };

    return (
        <AccueilPage
            services={services}
            loading={loading}
            setSelectedService={handleServiceSelection}
            navigateTo={navigateTo}
        />
    );
}