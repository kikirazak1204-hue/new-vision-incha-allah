import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Icônes personnalisées
const clientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const providerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Composant pour ajuster automatiquement le zoom afin de voir les 2 points
function FitBounds({ clientPos, providerPos }) {
  const map = useMap();
  useEffect(() => {
    if (clientPos && providerPos) {
      const bounds = L.latLngBounds([clientPos, providerPos]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (clientPos) {
      map.setView(clientPos, 14);
    }
  }, [clientPos, providerPos, map]);
  return null;
}

export default function KanariGeoMap({ clientPosition, providerPosition, providerName, missionStatus, height = 300 }) {
  // Sécurisation des données entrantes
  const cPos = clientPosition?.latitude ? [clientPosition.latitude, clientPosition.longitude] : null;
  const pPos = providerPosition?.latitude ? [providerPosition.latitude, providerPosition.longitude] : null;

  // Si aucune coordonnée n'est disponible, on affiche un message d'attente
  if (!cPos && !pPos) {
    return (
      <div className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500" style={{ height: `${height}px` }}>
        En attente des données GPS...
      </div>
    );
  }

  const defaultCenter = cPos || pPos || [13.5116, 2.1254];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm" style={{ height: `${height}px` }}>
      
      {/* Overlay Statut */}
      <div className="absolute top-4 left-4 z-[400] flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-md">
        <span className="relative flex h-3 w-3">
          {missionStatus === 'EN_COURS' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>}
          <span className={`relative inline-flex h-3 w-3 rounded-full ${missionStatus === 'EN_COURS' ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
        </span>
        <span className="text-xs font-black text-[#061a3a]">
          {missionStatus === 'EN_COURS' ? 'En approche' : 'Position enregistrée'}
        </span>
      </div>

      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {cPos && (
          <Marker position={cPos} icon={clientIcon}>
            <Popup><b>Votre lieu d'intervention</b></Popup>
          </Marker>
        )}

        {pPos && (
          <Marker position={pPos} icon={providerIcon}>
            <Popup><b>{providerName || 'Prestataire'}</b><br/>En déplacement...</Popup>
          </Marker>
        )}

        {/* Ligne pointillée reliant les deux points */}
        {cPos && pPos && (
          <Polyline positions={[cPos, pPos]} pathOptions={{ color: '#061a3a', dashArray: '5, 10', weight: 3 }} />
        )}

        <FitBounds clientPos={cPos} providerPos={pPos} />
      </MapContainer>
    </div>
  );
}