import React, { useEffect, useState } from 'react';

const STATUTS = {
    EN_ATTENTE: { label: 'En attente', color: 'bg-yellow-500', text: 'text-yellow-400' },
    EN_EVALUATION: { label: 'En évaluation', color: 'bg-blue-500', text: 'text-blue-400' },
    CONFORME: { label: 'Conforme', color: 'bg-green-500', text: 'text-green-400' },
    SUSPENDU: { label: 'Suspendu', color: 'bg-red-500', text: 'text-red-400' },
};

export default function ValidationsAdmin() {
    const [fournisseurs, setFournisseurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtreStatut, setFiltreStatut] = useState('EN_ATTENTE');
    const [selected, setSelected] = useState(null);
    const [imgZoom, setImgZoom] = useState(null); // Pour agrandir une image
    const token = localStorage.getItem('token');

    const fetchFournisseurs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/fournisseurs?statut=${filtreStatut}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setFournisseurs(data.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchFournisseurs(); }, [filtreStatut]);

    const modifierStatut = async (id, nouveauStatut) => {
        if (!window.confirm(`Passer ce dossier en : ${STATUTS[nouveauStatut].label} ?`)) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/fournisseurs/${id}/statut`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ statut: nouveauStatut })
            });
            if (res.ok) {
                setFournisseurs(prev => prev.filter(f => f.id !== id));
                setSelected(null);
            }
        } catch (err) { alert("Erreur lors de la mise à jour"); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne Gauche : Liste */}
            <div className="lg:col-span-1 space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {Object.entries(STATUTS).map(([key, val]) => (
                        <button key={key} onClick={() => setFiltreStatut(key)}
                            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all
                            ${filtreStatut === key ? `${val.color} text-white` : 'bg-gray-800 text-gray-400'}`}>
                            {val.label}
                        </button>
                    ))}
                </div>

                {loading ? <p className="animate-pulse">Chargement...</p> :
                    fournisseurs.map(f => (
                        <div key={f.id} onClick={() => setSelected(f)}
                            className={`p-4 rounded-xl cursor-pointer border-2 transition-all 
                            ${selected?.id === f.id ? 'border-purple-500 bg-gray-800' : 'border-transparent bg-gray-900 hover:bg-gray-800'}`}>
                            <h4 className="font-bold">{f.nomEntreprise || f.nom}</h4>
                            <p className="text-xs text-gray-500">{f.telephone}</p>
                        </div>
                    ))
                }
            </div>

            {/* Colonne Droite : Détails et Documents */}
            <div className="lg:col-span-2">
                {selected ? (
                    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold">{selected.nomEntreprise}</h2>
                                <p className="text-purple-400">{selected.service?.nom || 'Prestataire'}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => modifierStatut(selected.id, 'CONFORME')} className="bg-green-600 px-4 py-2 rounded-lg font-bold text-sm">Valider ✅</button>
                                <button onClick={() => modifierStatut(selected.id, 'SUSPENDU')} className="bg-red-600 px-4 py-2 rounded-lg font-bold text-sm">Refuser ❌</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {['cniRecto', 'cniVerso', 'selfie', 'diplome'].map(doc => selected[doc] && (
                                <div key={doc} className="group relative">
                                    <p className="text-xs text-gray-500 mb-1 uppercase font-bold">{doc}</p>
                                    <img
                                        src={`${import.meta.env.VITE_API_URL}/uploads/${selected[doc]}`}
                                        className="w-full h-32 object-cover rounded-lg cursor-zoom-in border border-gray-700"
                                        onClick={() => setImgZoom(`${import.meta.env.VITE_API_URL}/uploads/${selected[doc]}`)}
                                        alt={doc}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl text-gray-600">
                        Sélectionnez un dossier pour voir les pièces jointes
                    </div>
                )}
            </div>

            {/* Modal Zoom Image */}
            {imgZoom && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setImgZoom(null)}>
                    <img src={imgZoom} className="max-w-full max-h-full rounded-lg shadow-2xl" alt="Zoom" />
                    <button className="absolute top-5 right-5 text-white text-3xl">✕</button>
                </div>
            )}
        </div>
    );
}