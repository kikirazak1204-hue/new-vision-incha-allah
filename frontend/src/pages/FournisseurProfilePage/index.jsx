import React from 'react';

const FournisseurProfilePage = ({
    fournisseur,
    handleCommanderClick,
    handleVoirProduitsClick,
    handleRetour
}) => {
    if (!fournisseur || !fournisseur.id) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center text-white p-4">
                <p className="text-lg text-center">❌ Aucun fournisseur sélectionné.</p>
            </div>
        );
    }

    const imageUrl =
        fournisseur.image &&
            (fournisseur.image.startsWith('http') || fournisseur.image.startsWith('/'))
            ? fournisseur.image
            : '/backgrounds/default.jpg';

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white p-4 md:p-6">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* TITRE */}
                <h2 className="text-2xl md:text-3xl font-bold text-center">
                    Profil de {fournisseur.nomEntreprise || 'Fournisseur'}
                </h2>

                {/* CARTE PRINCIPALE */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row gap-6">

                    {/* Foto + emoji */}
                    <div className="flex flex-col items-center justify-center w-full md:w-1/3 space-y-4">
                        <div className="text-6xl">{fournisseur.emoji || '🧑‍🔧'}</div>
                        <img
                            src={imageUrl}
                            alt={fournisseur.nomEntreprise || 'Fournisseur'}
                            className="w-36 h-36 md:w-48 md:h-48 object-cover rounded-2xl shadow-md"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/backgrounds/default.jpg';
                            }}
                        />
                    </div>

                    {/* Infos */}
                    <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                            <h3 className="text-2xl font-bold text-white">
                                {fournisseur.nomEntreprise}
                            </h3>

                            {fournisseur.description && (
                                <p className="text-white/60 italic">
                                    {fournisseur.description}
                                </p>
                            )}

                            {fournisseur.adresse && (
                                <p className="text-sm text-white/60">
                                    📍 {fournisseur.adresse}{fournisseur.ville ? `, ${fournisseur.ville}` : ''}
                                </p>
                            )}

                            {/* Note */}
                            {fournisseur.note > 0 && fournisseur.note <= 5 && (
                                <p className="text-yellow-400 font-semibold">
                                    ⭐ {fournisseur.note}/5
                                </p>
                            )}

                            {fournisseur.verified && (
                                <p className="text-green-400 font-semibold text-sm">
                                    ✅ Fournisseur vérifié
                                </p>
                            )}

                            {fournisseur.role === 'premium' && (
                                <p className="text-yellow-300 font-semibold text-sm">
                                    🌟 Fournisseur Premium
                                </p>
                            )}

                            {/* Service */}
                            {fournisseur.service && (
                                <p className="text-sm text-purple-300 font-medium">
                                    🛠️ Service : {fournisseur.service.nom}
                                </p>
                            )}

                            {/* Produits */}
                            {Array.isArray(fournisseur.produits) && fournisseur.produits.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-semibold text-white mb-1">Produits :</h4>
                                    <ul className="list-disc list-inside text-white/70 text-sm max-h-36 overflow-y-auto space-y-1">
                                        {fournisseur.produits
                                            .filter(Boolean)
                                            .map(prod => (
                                                <li key={prod.id}>
                                                    {prod.nom} – <span className="text-green-300">{prod.prix?.toLocaleString()} FCFA</span>
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Boutons */}
                        <div className="mt-6 flex flex-col gap-3 md:flex-row md:gap-4">
                            <button
                                onClick={() => handleCommanderClick?.(fournisseur)}
                                className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-lg shadow-purple-900/30 transition-transform hover:scale-[1.02]"
                            >
                                Commander
                            </button>
                            <button
                                onClick={() => handleVoirProduitsClick?.(fournisseur)}
                                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-900/30 transition-transform hover:scale-[1.02]"
                            >
                                Voir Produits
                            </button>
                            <button
                                onClick={() => handleRetour?.()}
                                className="py-2.5 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 font-semibold transition-colors"
                            >
                                Retour
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FournisseurProfilePage;
