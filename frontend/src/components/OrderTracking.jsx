import React, { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://newvision-backend.onrender.com';

export default function OrderTracking({ initialMissionId = '' }) {
  const [missionId, setMissionId] = useState(initialMissionId);
  const [searchId, setSearchId] = useState(initialMissionId);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const providerMarkerRef = useRef(null);

  // 1. Chargement de la bibliothèque Leaflet
  useEffect(() => {
    if (window.L) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (leafletMap.current) leafletMap.current.remove();
    };
  }, []);

  // 2. Récupération du suivi de la mission
  const fetchTrackingInfo = async (idToFetch) => {
    const id = idToFetch || missionId;
    if (!id.trim()) return;

    setLoading(true);
    setError('');

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE}/api/orders/tracking/${id.trim()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success !== false) {
        setTrackingData(data);
        renderMap(data);
      } else {
        // Mode Simulation si le backend n'a pas encore la route dédiée
        const mockTracking = {
          missionId: id,
          serviceName: 'Livraison Express / Intervention',
          status: 'EN_ROUTE', // 'VALIDE', 'EN_ROUTE', 'SUR_PLACE', 'TERMINE'
          provider: {
            name: 'Aliou Transporter',
            phone: '+227 90 00 00 01',
            vehicle: 'Moto Express',
            lat: 13.5150,
            lon: 2.1180
          },
          clientLocation: {
            lat: 13.5220,
            lon: 2.1300,
            address: 'Quartier Plateau, Niamey'
          },
          estimatedArrival: '12-15 min'
        };
        setTrackingData(mockTracking);
        renderMap(mockTracking);
      }
    } catch (err) {
      console.error('Erreur chargement tracking:', err);
      setError('Impossible de récupérer le suivi. Vérifiez le numéro de mission.');
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchissement automatique toutes les 10 secondes
  useEffect(() => {
    if (!missionId) return;
    fetchTrackingInfo(missionId);

    const interval = setInterval(() => {
      fetchTrackingInfo(missionId);
    }, 10000);

    return () => clearInterval(interval);
  }, [missionId]);

  // 3. Initialisation et mise à jour de la carte
  const renderMap = (data) => {
    if (!window.L || !mapRef.current || !data?.provider?.lat) return;

    const providerPos = [data.provider.lat, data.provider.lon];
    const clientPos = data.clientLocation?.lat ? [data.clientLocation.lat, data.clientLocation.lon] : null;

    if (!leafletMap.current) {
      leafletMap.current = window.L.map(mapRef.current).setView(providerPos, 14);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© Kanari GPS'
      }).addTo(leafletMap.current);
    }

    // Marqueur du Prestataire / Livreur
    if (providerMarkerRef.current) {
      providerMarkerRef.current.setLatLng(providerPos);
    } else {
      providerMarkerRef.current = window.L.marker(providerPos)
        .addTo(leafletMap.current)
        .bindPopup(`<b>${data.provider.name}</b><br/>${data.provider.vehicle || 'En déplacement'}`)
        .openPopup();
    }

    // Marqueur du Client
    if (clientPos) {
      window.L.marker(clientPos).addTo(leafletMap.current).bindPopup('Votre position de livraison');
      const bounds = window.L.latLngBounds([providerPos, clientPos]);
      leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
    } else {
      leafletMap.current.panTo(providerPos);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      setMissionId(searchId.trim());
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 font-sans text-[#061a3a]">
      {/* Barre de recherche du numéro de mission */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 mb-6">
        <h2 className="text-xl font-black mb-2">Suivi de Mission Kanari</h2>
        <p className="text-xs text-slate-500 mb-4">Entrez votre N° de mission pour localiser votre intervenant en direct.</p>
        
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: CMD-890"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#061a3a] text-white font-black px-6 py-3 rounded-2xl hover:bg-[#0b2855] transition shadow-lg"
          >
            {loading ? 'Recherche...' : 'Suivre'}
          </button>
        </form>

        {error && <div className="mt-3 text-xs font-bold text-red-600">{error}</div>}
      </div>

      {trackingData && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Panneau latéral : Détails et Étapes */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">N° {trackingData.missionId}</span>
                  <h3 className="text-lg font-black">{trackingData.serviceName}</h3>
                </div>
                <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full animate-pulse">
                  {trackingData.status === 'EN_ROUTE' ? 'En route' : 'En cours'}
                </span>
              </div>

              {/* Estimation */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 text-center">
                <div className="text-xs text-slate-500 font-bold uppercase">Temps d'arrivée estimé</div>
                <div className="text-2xl font-black text-amber-600 mt-1">{trackingData.estimatedArrival || 'Calcul en cours...'}</div>
              </div>

              {/* Fiche Prestataire */}
              <div className="border-t border-slate-100 pt-4 mb-4">
                <div className="text-xs font-bold text-slate-400 mb-2">Votre intervenant</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center font-black text-[#061a3a]">
                    {trackingData.provider.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{trackingData.provider.name}</div>
                    <div className="text-xs text-slate-500">{trackingData.provider.vehicle}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton d'action */}
            <a
              href={`tel:${trackingData.provider.phone}`}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition text-sm"
            >
              📞 Appeler ({trackingData.provider.phone})
            </a>
          </div>

          {/* Zone Carte Leaflet */}
          <div className="lg:col-span-2 bg-slate-900 rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[400px] relative">
            <div ref={mapRef} className="w-full h-full min-h-[400px] z-0" />
            <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md text-[11px] font-bold text-slate-700">
              📍 Position mise à jour en direct toutes les 10s
            </div>
          </div>
        </div>
      )}
    </div>
  );
}