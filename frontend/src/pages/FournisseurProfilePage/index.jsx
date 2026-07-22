import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, ShieldCheck, CalendarCheck, Phone, Mail, Loader2, Info } from 'lucide-react';
import { getFournisseurById } from '../util/api'; // Au cas où on recharge la page directement

export default function FournisseurProfilePage() {
    const { state } = useLocation();
    const { id: paramId } = useParams();
    const navigate = useNavigate();
    const API = import.meta.env.VITE_API_URL;

    // On tente d'abord de récupérer le fournisseur depuis le state (envoyé par la page précédente)
    const [fournisseur, setFournisseur] = useState(state?.fournisseur || null);
    const [service, setService] = useState(state?.service || null);
    const [loading, setLoading] = useState(!state?.fournisseur);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Si on n'a pas les données dans le state (ex: rafraîchissement de page F5), on fetch au backend
        const fetchFournisseurFallback = async () => {
            if (fournisseur) return; // On a déjà tout, pas besoin d'appel API !

            const targetId = paramId || state?.fournisseur?._id || state?.fournisseur?.id;
            if (!targetId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const res = await getFournisseurById(targetId);
                setFournisseur(res.data || res);
            } catch (err) {
                console.error("Erreur 500 / Chargement profil :", err);
                setError("Impossible de charger les détails de cet expert.");
            } finally {
                setLoading(false);
            }
        };

        fetchFournisseurFallback();
    }, [paramId, fournisseur]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-purple-400" style={{ background: '#0B0F19' }}>
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="font-bold text-xl">Chargement du profil...</p>
            </div>
        );
    }

    if (error || !fournisseur) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-slate-100 p-6" style={{ background: '#0B0F19' }}>
                <Info className="w-16 h-16 text-rose-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Oups, profil introuvable</h2>
                <p className="text-slate-400 mb-6">{error || "Les informations de ce prestataire ne sont pas disponibles."}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold transition flex items-center gap-2"
                >
                    <ArrowLeft size={18} /> Retour
                </button>
            </div>
        );
    }

    // Construction sécurisée de l'URL de la photo (même logique que ta page précédente !)
    const imageUrl = fournisseur.selfie
        ? (fournisseur.selfie.startsWith('http') ? fournisseur.selfie : `${API}/uploads/${fournisseur.selfie}`)
        : null;

    return (
        <div className="min-h-screen text-slate-100 p-6 md:p-12 animate-in fade-in duration-300" style={{ background: '#0B0F19' }}>
            <div className="max-w-4xl mx-auto">

                {/* Bouton Retour */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-8 text-slate-400 hover:text-white flex items-center gap-2 transition group active:scale-95"
                >
                    <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={18} /> Retour
                </button>

                {/* Carte Principale */}
                <div className="p-8 md:p-10 rounded-3xl border border-white/[0.06] shadow-2xl relative overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }}>

                    {/* Header Profil */}
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start border-b border-white/10 pb-8 mb-8">

                        {/* Image de profil avec Fallback */}
                        <div className="flex-shrink-0 relative">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={fournisseur.nomEntreprise}
                                    className="w-32 h-32 md:w-40 md:h-40 rounded-3xl object-cover border-2 border-purple-500/30 shadow-lg"
                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                            ) : null}
                            <div className={`${imageUrl ? 'hidden' : 'flex'} w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-gradient-to-br from-purple-900 to-indigo-900 items-center justify-center text-5xl font-black shadow-lg border border-white/10`}>
                                {fournisseur.nomEntreprise?.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        {/* Informations */}
                        <div className="flex-grow text-center md:text-left">
                            <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                                <h1 className="text-3xl md:text-4xl font-black text-white">{fournisseur.nomEntreprise}</h1>
                                {fournisseur.statut === 'CONFORME' && (
                                    <span className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-bold uppercase">
                                        <ShieldCheck size={14} /> Certifié
                                    </span>
                                )}
                            </div>

                            <p className="text-purple-400 font-medium text-lg mb-4">
                                {service?.nom || fournisseur.typeService || "Expert Service"}
                            </p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-400 mb-6">
                                <span className="flex items-center gap-1 bg-white/[0.05] px-3 py-1.5 rounded-lg">
                                    <MapPin size={16} className="text-purple-400" />
                                    {fournisseur.quartier || "Quartier non précisé"}
                                </span>
                                {fournisseur.note > 0 && (
                                    <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg font-bold">
                                        <Star size={16} fill="currentColor" /> {fournisseur.note.toFixed(1)} / 5
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description ou Infos Supplémentaires */}
                    <div className="space-y-6 mb-10">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">À propos</h3>
                            <p className="text-slate-300 leading-relaxed">
                                {fournisseur.description || "Aucune description fournie par ce prestataire pour le moment. Vous pouvez le contacter directement ou réserver pour discuter de vos besoins."}
                            </p>
                        </div>
                    </div>

                    {/* Action Bouton */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => navigate('/reservation', { state: { service, fournisseur } })}
                            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 active:scale-95 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3 text-lg"
                        >
                            <CalendarCheck size={20} /> Réserver cet expert
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}