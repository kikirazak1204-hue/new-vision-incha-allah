import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, ShieldCheck, ArrowLeft, Loader2, Info, CalendarCheck } from 'lucide-react';
import { getService, getFournisseursParService } from '../util/api';

export default function FournisseursParService({ serviceId, setCurrentView }) {
    const [service, setService] = useState(null);
    const [fournisseurs, setFournisseurs] = useState([]);
    const [loading, setLoading] = useState(true);

    const API = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();

    useEffect(() => {
        const loadData = async () => {
            if (!serviceId) return;
            setLoading(true);
            try {
                const [sData, fData] = await Promise.all([
                    getService(serviceId),
                    getFournisseursParService(serviceId)
                ]);
                setService(sData.data || sData);
                setFournisseurs(fData.data || fData || []);
            } catch (err) {
                console.error("Erreur chargement :", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [serviceId]);

    const handleVoirProfil = (fournisseur) => {
        navigate('/fournisseur-profil', { state: { fournisseur, service } });
    };

    // ✅ Vrai bouton Réserver — transmet service + fournisseur via React Router
    const handleReserver = (fournisseur) => {
        navigate('/reservation', { state: { service, fournisseur } });
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center text-purple-400" style={{ background: '#0B0F19' }}>
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="font-bold text-xl">Chargement des experts...</p>
        </div>
    );

    return (
        <div className="min-h-screen text-slate-100 p-6 md:p-12 animate-in fade-in duration-300" style={{ background: '#0B0F19' }}>
            <div className="max-w-4xl mx-auto">

                <button
                    onClick={() => setCurrentView ? setCurrentView('accueil') : navigate('/')}
                    className="mb-8 text-slate-400 hover:text-white flex items-center gap-2 transition group active:scale-95"
                >
                    <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={18} /> Retour aux services
                </button>

                <div className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                        {service?.nom || 'Service'}
                    </h1>
                    <p className="text-slate-400 text-lg">Sélectionnez un expert pour vos besoins.</p>
                </div>

                <div className="grid gap-5">
                    {fournisseurs.length === 0 ? (
                        <div className="text-center py-20 rounded-3xl border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}>
                            <Info className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500">Aucun prestataire disponible pour l'instant.</p>
                        </div>
                    ) : (
                        fournisseurs.map((f) => {
                            const imageUrl = f.selfie ? (f.selfie.startsWith('http') ? f.selfie : `${API}/uploads/${f.selfie}`) : null;

                            return (
                                <div
                                    key={f.id}
                                    className="group p-6 rounded-3xl border border-white/[0.06] hover:border-purple-500/30 transition-all flex flex-col md:flex-row gap-6 items-center shadow-xl"
                                    style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)' }}
                                >
                                    <div className="flex-shrink-0">
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={f.nomEntreprise} className="w-24 h-24 rounded-2xl object-cover border-2 border-white/10" />
                                        ) : (
                                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center text-3xl font-black">
                                                {f.nomEntreprise?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-grow text-center md:text-left">
                                        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 mb-2">
                                            <h3 className="font-black text-xl text-white">{f.nomEntreprise}</h3>
                                            {f.statut === 'CONFORME' && (
                                                <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-bold uppercase">
                                                    <ShieldCheck size={12} /> Certifié
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-slate-400 mb-3">
                                            <span className="flex items-center gap-1"><MapPin size={14} /> {f.quartier || "Non précisé"}</span>
                                            {f.note > 0 && (
                                                <span className="flex items-center gap-1 text-amber-400"><Star size={14} fill="currentColor" /> {f.note.toFixed(1)}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 w-full md:w-auto">
                                        <button
                                            onClick={() => handleReserver(f)}
                                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 active:scale-95 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <CalendarCheck size={16} /> Réserver
                                        </button>
                                        <button
                                            onClick={() => handleVoirProfil(f)}
                                            className="px-6 py-3 bg-white/[0.05] hover:bg-white/[0.08] active:scale-95 border border-white/10 text-white font-medium rounded-xl transition-all"
                                        >
                                            Voir le profil
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}