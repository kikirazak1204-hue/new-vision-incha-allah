import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ModifierProduit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [form, setForm] = useState({ nom: '', description: '', prix: '', serviceId: '', image: '' });
    const [imageFile, setImageFile] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchProduit = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/produits/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                const p = data.data;
                setForm({ nom: p.nom, description: p.description, prix: p.prix, serviceId: p.serviceId, image: p.image });
            } catch (err) {
                setMessage("❌ Produit introuvable.");
            }
        };
        fetchProduit();
    }, [id, token]);

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('nom', form.nom);
            data.append('description', form.description);
            data.append('prix', form.prix);
            data.append('serviceId', form.serviceId);
            if (imageFile) data.append('image', imageFile);

            await fetch(`${import.meta.env.VITE_API_URL}/api/produits/${id}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: data
            });
            setMessage("✅ Produit modifié !");
            setTimeout(() => navigate('/dashboard-fournisseur'), 1500);
        } catch (err) {
            setMessage("❌ Échec de la modification.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-800 via-indigo-900 to-blue-950 text-white p-8">
            <h1 className="text-3xl font-bold mb-8">Modifier le Produit</h1>
            {message && <div className="mb-6 text-center font-semibold">{message}</div>}
            <div className="max-w-xl mx-auto bg-indigo-800 p-6 rounded-lg shadow-md space-y-4">
                <input name="nom" placeholder="Nom du produit" value={form.nom} onChange={handleChange} required className="w-full p-2 rounded bg-indigo-700 text-white" />
                <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} className="w-full p-2 rounded bg-indigo-700 text-white" />
                <input name="prix" type="number" placeholder="Prix en FCFA" value={form.prix} onChange={handleChange} required className="w-full p-2 rounded bg-indigo-700 text-white" />
                <input name="serviceId" placeholder="ID du service" value={form.serviceId} onChange={handleChange} className="w-full p-2 rounded bg-indigo-700 text-white" />
                <div className="space-y-2">
                    <label className="block text-sm text-indigo-300">Image actuelle :</label>
                    {form.image && <img src={`${import.meta.env.VITE_API_URL}/uploads/${form.image}`} alt="Produit" className="w-full h-40 object-cover rounded" onError={(e) => { e.target.onerror = null; e.target.src = '/backgrounds/default.jpg'; }} />}
                    <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full p-2 rounded bg-indigo-700 text-white" />
                </div>
                <button onClick={handleSubmit} className="w-full py-2 rounded font-bold bg-indigo-600 hover:bg-indigo-700">
                    Enregistrer les modifications
                </button>
            </div>
        </div>
    );
}