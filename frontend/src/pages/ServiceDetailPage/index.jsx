import React, { useEffect, useState } from 'react';
import { getFournisseursParService } from '../../util/api.js';

const BADGE = {
    CONFORME: { label: '🛡️ Garanti New Vision', bg: 'bg-green-500', text: 'text-white' },
    EN_EVALUATION: { label: '🔍 En évaluation', bg: 'bg-blue-500', text: 'text-white' },
    EN_ATTENTE: { label: '🆕 Nouveau', bg: 'bg-gray-500', text: 'text-white' },
};

const ORDRE_STATUT = { CONFORME: 0, EN_EVALUATION: 1, EN_ATTENTE: 2 };

const calcDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const ServiceDetailPage = ({
    selectedService,
    handleCommanderClick,
    handleVoirProduitsClick,
    handleFournisseurClick,
}) => {
    const [fournisseurs, setFournisseurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recherche, setRecherche] = useState('');
    const [filtreVille, setFiltreVille] = useState('');
    const [filtreStatut, setFiltreStatut] = useState('tous');
    const [rayonKm, setRayonKm] = useState(50);
    const [positionClient, setPositionClient] = useState(null);
    const [geoLoading, setGeoLoading] = useState(false);

    useEffect(() => {
        if (!selectedService?.id) return;
        setLoading(true);
        const loadFournisseurs = async () => {
            try {
                const data = await getFournisseursParService(selectedService.id);
                const liste = (data.data || [])
                    .filter((f) => f.statut !== 'SUSPENDU')
                    .sort((a, b) => {
                        const oa = ORDRE_STATUT[a.statut] ?? 3;
                        const ob = ORDRE_STATUT[b.statut] ?? 3;
                        if (oa !== ob) return oa - ob;
                        return (b.note || 0) - (a.note || 0);
                    });
                setFournisseurs(liste);
            } catch (err) {
                console.error('Erreur chargement fournisseurs :', err);
            } finally {
                setLoading(false);
            }
        };
        loadFournisseurs();
    }, [selectedService]);

    const activerGeo = () => {
        if (!navigator.geolocation) {
            alert('Géolocalisation non supportée.');
            return;
        }
        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPositionClient({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
                setGeoLoading(false);
            },
            () => {
                alert("Impossible d'obtenir votre position.");
                setGeoLoading(false);
            }
        );
    };

    const fournisseursFiltres = fournisseurs.filter((f) => {
        const terme = recherche.toLowerCase();
        if (
            terme &&
            !(
                (f.nomEntreprise || f.nom || '').toLowerCase().includes(terme) ||
                (f.adresse || f.ville || '').toLowerCase().includes(terme)
            )
        )
            return false;
        if (
            filtreVille &&
            !(f.adresse || f.ville || '')
                .toLowerCase()
                .includes(filtreVille.toLowerCase())
        )
            return false;
        if (filtreStatut !== 'tous' && f.statut !== filtreStatut) return false;
        if (positionClient && f.latitude && f.longitude) {
            const dist = calcDistance(
                positionClient.lat,
                positionClient.lng,
                f.latitude,
                f.longitude
            );
            if (dist > rayonKm) return false;
        }
        return true;
    });

    const villesUniques = [
        ...new Set(
            fournisseurs.map((f) => f.adresse || f.ville).filter(Boolean)
        ),
    ];

    if (!selectedService?.id) {
        return (
            <div className="text-white text-center p-8">
                Aucun service sélectionné.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-white text-center p-8 animate-pulse">
                Chargement des prestataires...
            </div>
        );
    }

    return (
        <div className="space-y-8 px-4 md:px-8 pb-10">
            {/* HERO SERVICE */}
            <section className="max-w-5xl mx-auto mt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/70 mb-2">
                        <span className="text-lg">{selectedService.emoji}</span>
                        <span>Service sélectionné</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                        {selectedService.nom}
                    </h2>
                    <p className="mt-2 text-sm md:text-base text-white/70 max-w-xl">
                        Choisissez un prestataire pour ce service, comparez les notes,
                        la distance et réservez en toute confiance.
                    </p>
                    <p className="mt-2 text-xs text-white/50">
                        {fournisseursFiltres.length} prestataire
                        {fournisseursFiltres.length > 1 ? 's' : ''} trouvé
                        {fournisseursFiltres.length > 1 ? 's' : ''} avec vos filtres.
                    </p>

                    {handleVoirProduitsClick && (
                        <button
                            className="mt-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-900/30 transition-transform hover:scale-[1.02]"
                            onClick={() => handleVoirProduitsClick(null)}
                        >
                            🛍️ Voir tous les produits de ce service
                        </button>
                    )}
                </div>

                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white/70 max-w-xs">
                    <p className="font-semibold text-white mb-1">📍 Astuce</p>
                    <p>
                        Active la géolocalisation pour voir en priorité les prestataires
                        proches de toi et limiter les frais de déplacement.
                    </p>
                </div>
            </section>

            {/* FILTRES */}
            <section className="max-w-5xl mx-auto bg-black/40 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-white/10 space-y-4">
                <div className="flex flex-col md:flex-row gap-3 md:items-center">
                    <input
                        type="text"
                        placeholder="Rechercher un prestataire (nom, adresse)..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="w-full md:flex-1 p-3 rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/10 focus:border-purple-500 outline-none text-sm"
                    />

                    <div className="flex gap-3 flex-wrap md:flex-nowrap">
                        <select
                            value={filtreVille}
                            onChange={(e) => setFiltreVille(e.target.value)}
                            className="flex-1 min-w-[120px] p-3 rounded-xl bg-white/10 text-white border border-white/10 text-xs md:text-sm"
                        >
                            <option value="">Toutes les villes</option>
                            {villesUniques.map((v) => (
                                <option key={v} value={v} className="bg-gray-900">
                                    {v}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filtreStatut}
                            onChange={(e) => setFiltreStatut(e.target.value)}
                            className="flex-1 min-w-[120px] p-3 rounded-xl bg-white/10 text-white border border-white/10 text-xs md:text-sm"
                        >
                            <option value="tous" className="bg-gray-900">
                                Tous les statuts
                            </option>
                            <option value="CONFORME" className="bg-gray-900">
                                Garanti
                            </option>
                            <option value="EN_EVALUATION" className="bg-gray-900">
                                En évaluation
                            </option>
                            <option value="EN_ATTENTE" className="bg-gray-900">
                                Nouveau
                            </option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={activerGeo}
                        className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold border transition-all
              ${positionClient
                                ? 'bg-green-500/15 border-green-500 text-green-400'
                                : 'bg-white/10 border-white/20 text-white/70 hover:border-white/40'
                            }`}
                    >
                        {geoLoading
                            ? 'Localisation...'
                            : positionClient
                                ? '✅ Filtre par distance activé'
                                : '📍 Filtrer par distance'}
                    </button>
                    {positionClient && (
                        <>
                            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                                <span className="text-white/50 text-xs md:text-sm">
                                    Rayon :
                                </span>
                                <input
                                    type="range"
                                    min={5}
                                    max={100}
                                    step={5}
                                    value={rayonKm}
                                    onChange={(e) => setRayonKm(Number(e.target.value))}
                                    className="flex-1 accent-purple-500"
                                />
                                <span className="text-white font-bold text-xs md:text-sm w-14">
                                    {rayonKm} km
                                </span>
                            </div>
                            <button
                                onClick={() => setPositionClient(null)}
                                className="text-xs text-red-400 hover:underline"
                            >
                                Désactiver
                            </button>
                        </>
                    )}
                </div>

                <div className="flex justify-between items-center text-[11px] text-white/50">
                    <span>Statut “Garanti New Vision” mis en avant en premier.</span>
                    <button
                        onClick={() => {
                            setRecherche('');
                            setFiltreVille('');
                            setFiltreStatut('tous');
                            setPositionClient(null);
                            setRayonKm(50);
                        }}
                        className="text-purple-300 hover:text-purple-100 underline underline-offset-2"
                    >
                        Réinitialiser les filtres
                    </button>
                </div>
            </section>

            {/* LISTE DES FOURNISSEURS */}
            <section className="max-w-5xl mx-auto">
                {fournisseursFiltres.length === 0 ? (
                    <div className="text-center py-16 bg-black/40 rounded-2xl border border-white/10">
                        <p className="text-4xl mb-3">🔍</p>
                        <p className="text-white/70 mb-2">
                            Aucun prestataire ne correspond à vos filtres.
                        </p>
                        <p className="text-xs text-white/40">
                            Essaye une autre ville, un autre statut ou enlève le filtre
                            distance.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {fournisseursFiltres.map((fournisseur) => {
                            const badge = BADGE[fournisseur.statut];
                            const estConforme = fournisseur.statut === 'CONFORME';
                            const distance =
                                positionClient && fournisseur.latitude && fournisseur.longitude
                                    ? calcDistance(
                                        positionClient.lat,
                                        positionClient.lng,
                                        fournisseur.latitude,
                                        fournisseur.longitude
                                    )
                                    : null;

                            return (
                                <div
                                    key={fournisseur.id}
                                    onClick={() => handleFournisseurClick?.(fournisseur)}
                                    className={`relative rounded-2xl p-4 flex flex-col text-white cursor-pointer
                    transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1
                    ${estConforme
                                            ? 'bg-gradient-to-b from-green-900/40 to-black/70 border-2 border-green-500/40'
                                            : 'bg-black/50 border border-white/10'
                                        }`}
                                >
                                    {badge && (
                                        <div
                                            className={`absolute top-3 left-3 ${badge.bg} text-white text-[10px] font-bold px-2 py-1 rounded-full z-10`}
                                        >
                                            {badge.label}
                                        </div>
                                    )}

                                    <div className="w-full h-32 flex items-center justify-center mb-3 mt-5">
                                        {fournisseur.image ? (
                                            <img
                                                src={`${import.meta.env.VITE_API_URL}/uploads/${fournisseur.image}`}
                                                alt={fournisseur.nomEntreprise}
                                                className="max-h-full object-contain rounded-lg"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = '/backgrounds/default.jpg';
                                                }}
                                            />
                                        ) : (
                                            <div className="text-4xl">
                                                {fournisseur.emoji || '🧑‍🔧'}
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold line-clamp-1">
                                        {fournisseur.nomEntreprise || fournisseur.nom}
                                    </h3>

                                    <p className="text-xs text-gray-300 mt-1 flex items-center flex-wrap gap-1">
                                        <span>{fournisseur.adresse || fournisseur.ville || '—'}</span>
                                        {distance && (
                                            <span className="ml-1 text-blue-300">
                                                • ~{distance.toFixed(1)} km
                                            </span>
                                        )}
                                    </p>

                                    {fournisseur.note > 0 && (
                                        <p className="text-yellow-400 text-xs mt-1">
                                            ⭐ {fournisseur.note.toFixed(1)}/5
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-2 mt-2 text-[10px]">
                                        {fournisseur.hasTransport && (
                                            <span className="bg-green-900/40 text-green-300 px-2 py-0.5 rounded-full">
                                                🚗 Transport
                                            </span>
                                        )}
                                        {fournisseur.hasMateriel && (
                                            <span className="bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full">
                                                🔧 Matériel
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-4 flex flex-col gap-2">
                                        <button
                                            className={`text-white py-2 px-4 rounded-lg font-semibold text-xs md:text-sm transition-colors
                        ${estConforme
                                                    ? 'bg-green-600 hover:bg-green-700'
                                                    : 'bg-purple-600 hover:bg-purple-700'
                                                }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCommanderClick?.(fournisseur);
                                            }}
                                        >
                                            {estConforme ? '📅 Réserver' : '📋 Commander'}
                                        </button>

                                        <button
                                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-xs md:text-sm transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleVoirProduitsClick?.(fournisseur);
                                            }}
                                        >
                                            🛍️ Voir produits du prestataire
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};

export default ServiceDetailPage;
