import React, { useEffect, useState } from 'react';

export default function HistoriquePaiements() {
    const [paiements, setPaiements] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) return;
        const fetchPaiements = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/paiement`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                setPaiements(data.data || []);
            } catch (err) {
                console.error('Erreur paiements:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPaiements();
    }, [token]);

    if (!token) return <div className="flex justify-center items-center h-screen text-white text-xl">🔒 Connectez-vous.</div>;
    if (loading) return <div className="flex justify-center items-center h-screen text-white text-xl">⏳ Chargement...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white p-8">
            <h1 className="text-4xl font-bold mb-8">🧾 Historique paiements</h1>
            {paiements.length === 0 ? (
                <p className="text-lg">Aucun paiement enregistré.</p>
            ) : (
                <div className="space-y-6">
                    {paiements.map(p => (
                        <div key={p.id} className="bg-blue-600 p-6 rounded-lg shadow-lg hover:scale-[1.02] transition-transform">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold">Transaction #{p.transactionId}</h2>
                                    <p className="text-sm text-blue-200">{new Date(p.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${p.statut === 'confirmé' ? 'bg-green-600' : p.statut === 'en_attente' ? 'bg-yellow-500' : 'bg-red-600'}`}>
                                    {p.statut}
                                </span>
                            </div>
                            <p><strong>Montant :</strong> {p.montant} FCFA</p>
                            <p><strong>Mode :</strong> {p.modePaiement}</p>
                            <p><strong>Téléphone :</strong> {p.telephone}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}