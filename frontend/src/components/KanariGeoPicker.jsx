import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import de ton gestionnaire d'état global
import { getGlobalLocationState } from '../util/geolocationManager'; 

// Configuration de l'icône Kanari (Ambre)
const kanariPinIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Écouteur d'événements pour le clic sur la carte
function LocationMarker({ position, setPosition, onLocationSelected }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      if (onLocationSelected) {
        onLocationSelected({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });

  return position === null ? null : <Marker position={position} icon={kanariPinIcon} />;
}

export default function KanariGeoPicker({ onLocationSelected, defaultPosition = [13.5116, 2.1254] /* Niamey par défaut */ }) {
  const [position, setPosition] = useState(null);

  // Utilisation du gestionnaire global au lieu de forcer la géolocalisation
  useEffect(() => {
    const globalGeo = getGlobalLocationState();
    
    // Si l'utilisateur a activé le GPS dans la barre globale, on utilise ces coordonnées
    if (globalGeo && globalGeo.enabled && globalGeo.lat && globalGeo.lon) {
      const currentLoc = { lat: globalGeo.lat, lng: globalGeo.lon };
      setPosition(currentLoc);
      if (onLocationSelected) onLocationSelected(currentLoc);
    }
    // Sinon, on ne force rien, la carte s'ouvrira sur defaultPosition (Niamey)
  }, [onLocationSelected]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border-2 border-slate-200 shadow-inner focus-within:border-amber-400">
      <div className="absolute top-4 left-4 z-[400] rounded-lg bg-[#061a3a] px-3 py-1.5 text-xs font-bold text-white shadow-md">
        📍 Cliquez sur la carte pour placer le repère
      </div>
      <MapContainer 
        center={defaultPosition} 
        zoom={13} 
        style={{ height: '300px', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} onLocationSelected={onLocationSelected} />
      </MapContainer>
    </div>
  );
}