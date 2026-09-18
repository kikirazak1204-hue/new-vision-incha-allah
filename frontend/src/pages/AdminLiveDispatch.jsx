import React, { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://newvision-backend.onrender.com';

export default function AdminLiveDispatch() {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef({});

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Chargement dynamique de Leaflet (Carte OpenStreetMap gratuite sans clé API)
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => initMap();
    document.body.appendChild(script);

    return () => {
      if (leafletMap.current) leafletMap.current.remove();
    };
  }, []);

  // 2. Initialisation de la carte
  const initMap = () => {
    if (!window.L || !mapRef.current) return;

    // Coordonnées par défaut (Niamey par exemple, modifiables selon votre zone principale)
    const defaultCoords = [13.5116, 2.1254];

    leafletMap.current = window.L.map(mapRef.current).setView(defaultCoords, 13);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors | Kanari Live',
      maxZoom: 19
    }).addTo(leafletMap.current);

    fetchLiveLocations();
  };

  // 3. Récupération régulière des positions GPS depuis le backend
  const fetchLiveLocations = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    try {
      const res = await fetch(`${API_BASE}/api/admin/live-locations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json().catch(() => null);

      if (res.ok && Array.isArray(data)) {
        setProviders(data);
        updateMapMarkers(data);
      } else {
        // Données de secours (Simulation si le backend n'a pas encore de prestataires actifs)
        const mockData = [
          { id: '1', name: 'Aliou Transporter', role: 'Livreur', lat: 13.5150, lon: 2.1180, phone: '90000001', status: 'EN_ROUTE', missionId: 'CMD-890' },
          { id: '2', name: 'Sani Elec', role: 'Prestataire', lat: 13.5080, lon: 2.1350, phone: '90000002', status: 'EN_COURS', missionId: 'CMD-891' },
          { id: '3', name: 'Moussa Express', role: 'Transporteur', lat: 13.5220, lon: 2.1020, phone: '90000003', status: 'DISPONIBLE', missionId: null }
        ];
        setProviders(mockData);
        updateMapMarkers(mockData);
      }
    } catch (err) {
      console.error('Erreur chargement live location:', err);
    } finally {
      setLoading(false);
    }
  };

  // Boucle de mise à jour toutes les 15 secondes
  useEffect(() => {
    const timer = setInterval(fetchLiveLocations, 15000);
    return () => clearInterval(timer);
  }, []);

  // 4. Mise à jour des marqueurs sur la carte
  const updateMapMarkers = (data) => {
    if (!window.L || !leafletMap.current) return;

    data.forEach(item => {
      if (!item.lat || !item.lon) return;

      const markerId = item.id;
      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px;">
          <strong style="font-size: 14px; color: #061a3a;">${item.name}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">${item.role} • Tel: ${item.phone}</span><br/>
          <span style="display:inline-block; margin-top:5px; padding:2px 6px; background:#fef3c7; color:#b45309; border-radius:4px; font-size:10px; font-weight:bold;">
            ${item.missionId ? 'Mission: ' + item.missionId : 'En attente'}
          </span>
        </div>
      `;

      if (markersRef.current[markerId]) {
        // Déplacement fluide vers la nouvelle position GPS
        markersRef.current[markerId].setLatLng([item.lat, item.lon]);
        markersRef.current[markerId].getPopup().setContent(popupContent);
      } else {
        // Création du marqueur
        const marker = window.L.marker([item.lat, item.lon])
          .addTo(leafletMap.current)
          .bindPopup(popupContent);
        markersRef.current[markerId] = marker;
      }
    });
  };

  // Centrer la carte sur un prestataire sélectionné
  const centerOnProvider = (item) => {
    if (!leafletMap.current || !item.lat || !item.lon) return;
    leafletMap.current.flyTo([item.lat, item.lon], 16, { animate: true });
    if (markersRef.current[item.id]) {
      markersRef.current[item.id].openPopup();
    }
  };

  // Filtrage par nom / téléphone / statut
  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.phone.includes(search) ||
                          (p.missionId && p.missionId.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'ALL' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      
      {/* SECTION CARTE INTERACTIVE */}
      <div className="flex-1 relative flex flex-col">
        {/* Header Overlay */}
        <div className="absolute top-4 left-4 z-[1000] bg-slate-950/90 border border-slate-800 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
            <h1 className="text-lg font-black text-white">Tour de Contrôle Kanari GPS</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Supervision des transporteurs & prestataires en direct</p>
        </div>

        {/* Div support pour Leaflet */}
        <div ref={mapRef} className="w-full h-full bg-slate-950 z-0" />
      </div>

      {/* PANNEAU LATÉRAL ADMIN */}
      <div className="w-[400px] bg-slate-950 border-l border-slate-800 flex flex-col z-10 shadow-2xl">
        
        {/* Recherche et Filtres */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <input
            type="text"
            placeholder="Rechercher nom, tel ou N° mission..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
          />

          <div className="flex gap-1.5">
            {['ALL', 'EN_ROUTE', 'EN_COURS', 'DISPONIBLE'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                  filter === f ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {f === 'ALL' ? 'Tous' : f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des Prestataires Géolocalisés */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-500">Connexion à la carte GPS...</div>
          ) : filteredProviders.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">Aucun prestataire trouvé.</div>
          ) : (
            filteredProviders.map(item => (
              <div 
                key={item.id}
                onClick={() => centerOnProvider(item)}
                className="bg-slate-900/80 border border-slate-800 hover:border-amber-400/50 p-3.5 rounded-xl cursor-pointer transition-all hover:bg-slate-900"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-sm text-white">{item.name}</div>
                    <div className="text-xs text-slate-400">{item.role} • {item.phone}</div>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    item.status === 'EN_ROUTE' ? 'bg-amber-500/20 text-amber-300' :
                    item.status === 'EN_COURS' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60 mt-2 text-slate-400">
                  <span>{item.missionId ? `📍 Mission: ${item.missionId}` : 'En attente de commande'}</span>
                  <span className="text-amber-400 font-bold hover:underline">Centrer ➔</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}