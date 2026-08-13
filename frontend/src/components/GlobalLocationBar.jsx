// ============================================================
// Fichier : src/components/GlobalLocationBar.jsx
// ============================================================

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { getGlobalLocationState, setGlobalLocationState } from '../util/geolocationManager';

export default function GlobalLocationBar() {
    const [geo, setGeo] = useState(getGlobalLocationState());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleUpdate = () => setGeo(getGlobalLocationState());
        window.addEventListener('kanariGeoChanged', handleUpdate);
        return () => window.removeEventListener('kanariGeoChanged', handleUpdate);
    }, []);

    const toggleGeo = () => {
        if (!geo.enabled) {
            if (!navigator.geolocation) {
                alert("La géolocalisation n'est pas supportée par votre appareil.");
                return;
            }
            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newLat = pos.coords.latitude;
                    const newLon = pos.coords.longitude;
                    const newState = {
                        enabled: true,
                        lat: newLat,
                        lon: newLon,
                        address: `GPS : ${newLat.toFixed(5)}, ${newLon.toFixed(5)}`
                    };
                    setGlobalLocationState(newState);
                    setLoading(false);
                },
                () => {
                    alert("Impossible d'accéder au GPS. Vérifiez vos permissions.");
                    setLoading(false);
                },
                { enableHighAccuracy: true }
            );
        } else {
            setGlobalLocationState({ enabled: false, lat: null, lon: null, address: '' });
        }
    };

    return (
        <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-b border-white/[0.08] px-4 py-2.5 flex items-center justify-between text-xs backdrop-blur-md">
            <div className="flex items-center gap-2 text-slate-300">
                <MapPin size={15} className={geo.enabled ? "text-emerald-400 animate-pulse" : "text-slate-400"} />
                <span>
                    {geo.enabled ? (
                        <strong className="text-emerald-300">📍 Position GPS active (Auto)</strong>
                    ) : (
                        "📍 Mode saisie manuelle de l'adresse"
                    )}
                </span>
            </div>
            <button
                onClick={toggleGeo}
                disabled={loading}
                className={`px-3 py-1 rounded-full font-bold transition flex items-center gap-1 active:scale-95 ${geo.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/[0.08] text-white hover:bg-white/[0.15]'
                    }`}
            >
                <Navigation size={12} className={geo.enabled ? "rotate-45" : ""} />
                {loading ? "Recherche..." : geo.enabled ? "Désactiver GPS" : "Activer GPS Auto"}
            </button>
        </div>
    );
}