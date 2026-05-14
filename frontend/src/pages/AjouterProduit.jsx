import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardFournisseur, addProduit } from '../util/api';

export default function AjouterProduit() {
    const [form, setForm] = useState({ nom: '', description: '', prix: '', serviceId: '' });
    const [image, setImage] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchServiceId = async () => {
            try {
                const res = await getDashboardFournisseur();
                const id = res.data?.profil?.serviceFournisseur?.id;
                if (id) setForm((prev) => ({ ...prev, serviceId: id }));
            } catch (err) {
                console.error('Erreur récupération serviceId:', err);
                setMessage('❌ Impossible de récupérer le service.');
            }
        };
        fetchServiceId();
    }, []);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!form.nom.trim() || !form.prix || !form.serviceId) {
            setMessage('❌ Tous les champs obligatoires doivent être remplis.');
            return;
        }
        if (isNaN(form.prix) || Number(form.prix) <= 0) {
            setMessage('❌ Le prix doit être un nombre positif.');
            return;
        }

        const data = new FormData();
        data.append('nom', form.nom.trim());
        data.append('description', form.description?.trim() || '');
        data.append('prix', String(form.prix));
        data.append('serviceId', String(form.serviceId));
        if (image) data.append('image', image);

        setLoading(true);
        try {
            const res = await addProduit(data);
            if (res.success) {
                setMessage('✅ Produit ajouté avec succès !');
                setForm((prev) => ({ nom: '', description: '', prix: '', serviceId: prev.serviceId }));
                setImage(null);
                setTimeout(() => navigate('/dashboard-fournisseur'), 1500);
            } else {
                setMessage('❌ ' + (res.message || 'Échec de l’ajout.'));
            }
        } catch (err) {
            console.error('Erreur ajout produit:', err);
            setMessage('❌ Échec de l’ajout du produit.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-800 via-indigo-900 to-blue-950 text-white p-8">
            <div className="max-w-xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/dashboard-fournisseur')}
                        className="text-indigo-300 hover:text-white transition-colors"
                    >
                        ← Retour
                    </button>
                    <h1 className="text-3xl font-bold">Ajouter un Produit</h1>
                </div>

                {message && (
                    <div
                        className={`mb-6 text-center font-semibold p-3 rounded-lg ${message.startsWith('✅') ? 'bg-green-700/50' : 'bg-red-700/50'
                            }`}
                    >
                        {message}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="bg-indigo-800 p-6 rounded-xl shadow-md space-y-4"
                >
                    <input
                        name="nom"
                        placeholder="Nom du produit *"
                        value={form.nom}
                        onChange={handleChange}
                        required
                        className="w-full p-3 rounded-lg bg-indigo-700 text-white placeholder-indigo-300"
                    />
                    <textarea
                        name="description"
                        placeholder="Description"
                        value={form.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full p-3 rounded-lg bg-indigo-700 text-white placeholder-indigo-300"
                    />
                    <input
                        name="prix"
                        type="number"
                        min="1"
                        placeholder="Prix en FCFA *"
                        value={form.prix}
                        onChange={handleChange}
                        required
                        className="w-full p-3 rounded-lg bg-indigo-700 text-white placeholder-indigo-300"
                    />
                    <div>
                        <label className="block text-sm text-indigo-300 mb-1">Image du produit</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImage(e.target.files[0])}
                            className="w-full p-3 rounded-lg bg-indigo-700 text-white"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-bold transition-all text-white ${loading ? 'bg-white/20 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                            }`}
                    >
                        {loading ? '⏳ Ajout en cours...' : '✅ Ajouter le produit'}
                    </button>
                </form>
            </div>
        </div>
    );
}
