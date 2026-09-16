import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ServiceSelectionPage() {
    const navigate = useNavigate();
    const [selectedServices, setSelectedServices] = useState([]);
    const [recherche, setRecherche] = useState('');
    const [allServices, setAllServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetchServices = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/services`);
                const data = await res.json();
                const servicesArray = Array.isArray(data) ? data : (data.services || data.data || []);
                if (mounted) setAllServices(servicesArray);
            } catch (error) {
                console.error('Erreur lors du chargement des services:', error);
                if (mounted) setAllServices([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchServices();
        return () => { mounted = false; };
    }, []);

    const filteredServices = useMemo(() => {
        const q = recherche.trim().toLowerCase();
        if (!Array.isArray(allServices)) return [];
        return allServices.filter((s) => {
            const text = [s.nom, s.titre, s.description, s.categorie, s.category].filter(Boolean).join(' ').toLowerCase();
            return !q || text.includes(q);
        });
    }, [recherche, allServices]);

    const getId = (service) => service?.id || service?._id || service?.code;
    const getPrice = (service) => {
        const min = service?.prix_min ?? service?.prixMin ?? service?.price_min ?? service?.priceMin;
        const max = service?.prix_max ?? service?.prixMax ?? service?.price_max ?? service?.priceMax;
        const single = service?.prix ?? service?.price;

        if (min != null && max != null) return `${Number(min).toLocaleString()} – ${Number(max).toLocaleString()} FCFA`;
        if (min != null) return `À partir de ${Number(min).toLocaleString()} FCFA`;
        if (max != null) return `Jusqu'à ${Number(max).toLocaleString()} FCFA`;
        if (single != null) return `${Number(single).toLocaleString()} FCFA`;
        return 'Fourchette selon la mission';
    };

    const toggleService = (service) => {
        const id = getId(service);
        setSelectedServices((current) => current.some(s => getId(s) === id)
            ? current.filter(s => getId(s) !== id)
            : [...current, service]);
    };

    const handleValider = () => {
        if (!selectedServices.length) return;
        localStorage.setItem('selectedServices', JSON.stringify(selectedServices));
        navigate('/reservation', { state: { services: selectedServices } });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-[#061a3a] font-sans pb-32">
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                    <button type="button" onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#061a3a] transition">
                        ← <span className="hidden sm:inline">Retour à l'accueil</span><span className="sm:hidden">Retour</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Kanari" className="w-9 h-9 object-contain" />
                        <span className="hidden sm:block font-black text-[#061a3a]">KANARI<span className="text-amber-500">SERVICE</span></span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                        Sélection
                    </span>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-7">
                <div className="bg-[#061a3a] rounded-[2rem] p-6 md:p-8 text-white shadow-xl">
                    <p className="text-amber-400 text-xs font-black uppercase tracking-[.18em]">Votre demande</p>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mt-2">Choisissez les services dont vous avez besoin</h1>
                    <p className="text-slate-300 text-sm mt-2 max-w-2xl">
                        Vous pouvez sélectionner <strong className="text-white">autant de services que nécessaire</strong>. Il n'y a plus de limite artificielle à 5.
                    </p>
                    <div className="mt-5">
                        <input type="text" placeholder="Rechercher un service..."
                            value={recherche} onChange={(e) => setRecherche(e.target.value)}
                            className="w-full p-4 bg-white !text-[#061a3a] placeholder:!text-slate-400 border border-white/10 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-400/20" />
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-6 mb-4">
                    <div>
                        <h2 className="font-black text-xl">Services disponibles</h2>
                        <p className="text-xs text-slate-500 mt-1">{filteredServices.length} résultat(s)</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
                        <span className="text-xs text-slate-500">Sélectionnés : </span>
                        <strong className="text-amber-600">{selectedServices.length}</strong>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white border border-slate-200 rounded-3xl py-20 text-center">
                        <div className="w-12 h-12 mx-auto border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin" />
                        <p className="mt-4 text-slate-500 font-semibold">Chargement des services...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredServices.map((service) => {
                            const id = getId(service);
                            const selected = selectedServices.some(s => getId(s) === id);
                            const image = service.image || '/backgrounds/transport.png';
                            return (
                                <button key={id} type="button" onClick={() => toggleService(service)}
                                    className={`group text-left bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all ${
                                        selected ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200 hover:border-amber-300'
                                    }`}>
                                    <div className="relative h-36 overflow-hidden bg-slate-100">
                                        <img src={image} alt={service.nom || service.titre || 'Service'} loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => { e.currentTarget.onerror=null; e.currentTarget.src='/backgrounds/transport.png'; }} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                                        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/95 flex items-center justify-center shadow">
                                            {selected ? <span className="text-amber-600 font-black">✓</span> : <span className="text-slate-400 font-bold">+</span>}
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-black text-[#061a3a] text-base">{service.nom || service.titre}</h3>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed mt-2 line-clamp-3">
                                            {service.description || 'Précisions de la prestation à confirmer lors de la demande.'}
                                        </p>

                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                                                <div className="text-[9px] uppercase tracking-wider font-black text-slate-400">Fourchette</div>
                                                <div className="text-[11px] font-black text-[#061a3a] mt-1">{getPrice(service)}</div>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                                                <div className="text-[9px] uppercase tracking-wider font-black text-slate-400">Mode</div>
                                                <div className="text-[11px] font-black text-[#061a3a] mt-1">Selon la mission</div>
                                            </div>
                                        </div>

                                        <div className={`mt-3 text-[11px] font-black ${selected ? 'text-amber-600' : 'text-slate-400'}`}>
                                            {selected ? 'Service sélectionné ✓' : 'Cliquer pour sélectionner'}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {!loading && filteredServices.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                        <div className="text-3xl">🔎</div>
                        <h3 className="font-black mt-2">Aucun service trouvé</h3>
                        <button type="button" onClick={() => setRecherche('')}
                            className="mt-4 bg-[#061a3a] text-white px-5 py-2.5 rounded-xl font-bold text-sm">Réinitialiser</button>
                    </div>
                )}
            </main>

            <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-slate-200 p-3 sm:p-4 z-40 shadow-[0_-8px_30px_rgba(15,23,42,.08)]">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-1 sm:px-2">
                    <div>
                        <p className="text-sm font-black text-[#061a3a]">{selectedServices.length} service(s) sélectionné(s)</p>
                        <p className="hidden sm:block text-[11px] text-slate-500">Vous pouvez en sélectionner autant que nécessaire.</p>
                    </div>
                    <button type="button" onClick={handleValider} disabled={!selectedServices.length}
                        className="bg-[#061a3a] hover:bg-[#0b2855] text-white px-5 sm:px-7 py-3 rounded-xl font-black text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg active:scale-95">
                        Continuer →
                    </button>
                </div>
            </div>
        </div>
    );
}