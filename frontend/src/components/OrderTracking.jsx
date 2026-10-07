import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correction de l'icône par défaut de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Remplace cette URL par l'URL de ton backend sur Render (ex: https://kanari-backend.onrender.com)
const SOCKET_URL = 'http://localhost:5000'; 

export default function OrderTracking() {
  const { missionId } = useParams(); // Récupère le numéro de commande depuis l'URL
  const [providerLocation, setProviderLocation] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // 1. Connexion au serveur
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // 2. Rejoindre la salle spécifique à cette commande
    newSocket.emit('joinMission', missionId);

    // 3. Écouter les mises à jour de position
    newSocket.on('locationUpdated', (data) => {
      console.log('📍 Nouvelle position reçue :', data);
      setProviderLocation({ lat: data.lat, lon: data.lon });
    });

    // 4. Nettoyage lors de la fermeture de la page
    return () => {
      newSocket.disconnect();
    };
  }, [missionId]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-[#13d484]">
        Suivi de la commande : {missionId}
      </h2>

      <div className="bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800">
        {!providerLocation ? (
          <div className="h-96 flex items-center justify-center text-slate-400">
            En attente de la position du prestataire...
          </div>
        ) : (
          <div className="h-96 w-full rounded-lg overflow-hidden border border-white/10">
            <MapContainer 
              center={[providerLocation.lat, providerLocation.lon]} 
              zoom={15} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <Marker position={[providerLocation.lat, providerLocation.lon]}>
                <Popup>Le prestataire est ici !</Popup>
              </Marker>
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
}