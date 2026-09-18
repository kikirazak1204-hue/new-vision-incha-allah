// ============================================================
// Fichier : src/util/geolocationManager.js
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || 'https://newvision-backend.onrender.com';

let locationState = {
  enabled: false,
  lat: null,
  lon: null,
  address: ''
};

let syncInterval = null;

// Lit l'état local actuel
export function getGlobalLocationState() {
  return locationState;
}

// Met à jour l'état local et notifie les composants React
export function setGlobalLocationState(newState) {
  locationState = { ...locationState, ...newState };
  window.dispatchEvent(new CustomEvent('kanariGeoChanged', { detail: locationState }));

  if (locationState.enabled && locationState.lat && locationState.lon) {
    startAutoSync();
  } else {
    stopAutoSync();
  }
}

// Envoie silencieux des coordonnées GPS au backend Kanari
async function sendLocationToBackend() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token || !locationState.enabled) return;

  try {
    await fetch(`${API_BASE}/api/users/location`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        latitude: locationState.lat,
        longitude: locationState.lon,
        updatedAt: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Erreur synchronisation GPS Kanari:', error);
  }
}

// Démarre la boucle d'envoi réseau (toutes les 20 secondes)
function startAutoSync() {
  if (syncInterval) return;
  sendLocationToBackend(); // Premier envoi immédiat
  syncInterval = setInterval(sendLocationToBackend, 20000);
}

// Arrête la boucle d'envoi réseau
function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}