import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getService, getFournisseursParService } from '../util/api';

export default function FournisseursParService() {
    const { id } = useParams();
    const serviceId = parseInt(id);
    const navigate = useNavigate();

    const [service, setService] = useState(null);
    const [fournisseurs, setFournisseurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [serviceData, fournisseursData] = await Promise.all([
                    getService(serviceId),
                    getFournisseursParService(serviceId)
                ]);
                if (!serviceData.success) throw new Error('Service introuvable');
                setService(serviceData.data);
                setFournisseurs(fournisseursData.success ? fournisseursData.data : []);
            } catch (err) {
                console.error('❌ Erreur chargement :', err);
                setError("Impossible de charger ce service.");
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [serviceId]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900 text-white text-xl animate-pulse">
            ⏳ Chargement...
        </div>
    );
    if (error || !service) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900 text-white gap-4">
            <p className="text-xl">❌ {error || "Service introuvable."}</p>
            <button onClick={() => navigate('/accueil')} className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl">
                ← Retour à l'accueil
            </button>
        </div>
    );

    return (
        <div
            className="min-h-screen p-6 text-white bg-cover bg-center"
            style={{ backgroundImage: `url(${service.image || '/backgrounds/default.jpg'})` }}
        >
            <div className="bg-black/70 backdrop-blur-md p-6 rounded-xl max-w-4xl mx-auto shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate('/accueil')}
                        className="text-white/60 hover:text-white transition-colors"
                    >
                        ← Retour
                    </button>
                    <h1 className="text-3xl font-bold">
                        {service.emoji} {service.nom}
                    </h1>
                </div>

                {fournisseurs.length === 0 ? (
                    <p className="text-white/80 text-center py-8">
                        Aucun fournisseur pour ce service pour le moment.
                    </p>
                ) : (
                    <ul className="space-y-6">
                        {fournisseurs.map(f => (
                            <li key={f.id} className="bg-white/10 p-4 rounded-xl shadow-md">
                                <p className="text-xl font-bold">{f.nomEntreprise}</p>
                                <p className="text-sm text-white/70">📍 {f.secteur}</p>
                                <p className="text-sm text-white/60">🏠 {f.adresse}</p>

                                {f.produitsFournisseur?.length > 0 ? (
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {f.produitsFournisseur.map(p => (
                                            <div key={p.id} className="bg-white/20 p-3 rounded-lg">
                                                <p className="font-semibold">{p.nom}</p>
                                                <p className="text-sm text-white/70">{p.description}</p>
                                                <p className="text-sm font-bold text-green-300">{p.prix?.toLocaleString()} FCFA</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-white/50 mt-2 text-sm">Aucun produit pour ce fournisseur.</p>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}