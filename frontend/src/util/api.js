// ============================================================
// src/util/api.js
// ============================================================

const BASE_URL = 'https://newvision-backend.onrender.com';

// ============================================================
// 🔧 UTILITAIRE REQUEST (Gère JSON et FormData)
// ============================================================
const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  
  const isFormData = options.body instanceof FormData;
  const defaultHeaders = options.headers || {};
  
  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...defaultHeaders,
  };

  const config = {
    ...options,
    headers,
  };

  console.log(`🌐 Appel API : ${config.method || 'GET'} ${url}`);

  const res = await fetch(url, config);

  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    console.error(`❌ Erreur API (${res.status}) :`, data);
    const message = (data && typeof data === 'object' && (data.message || data.error)) || 
                    (typeof data === 'string' && data) || 
                    `HTTP ${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  return data;
};

// ============================================================
// 🔐 HEADERS AUTH
// ============================================================
export const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// ============================================================
// 👤 AUTH
// ============================================================
export const loginUser = async ({ email, password }) => {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const registerUser = (payload) =>
  request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ============================================================
// 🧑‍💼 FOURNISSEUR
// ============================================================
export const registerFournisseur = async (formData) => {
  return request('/api/fournisseurs', {
    method: 'POST',
    headers: authHeaders(),
    body: formData, // FormData géré automatiquement par request
  });
};

// ============================================================
// 📊 DASHBOARDS
// ============================================================
export const getDashboardClient = () =>
  request('/api/dashboard/client', { headers: authHeaders() });

export const getDashboardFournisseur = () =>
  request('/api/dashboard/fournisseur', { headers: authHeaders() });

// ============================================================
// 🛠️ SERVICES
// ============================================================
export const getServices = () => request('/api/services');

export const getService = (id) => {
  if (!id) throw new Error("ID de service manquant");
  return request(`/api/services/${id}`);
};

export const getFournisseursParService = (id) => {
  if (!id) throw new Error("ID de service manquant");
  return request(`/api/services/${id}/fournisseurs`);
};

// ============================================================
// 📦 PRODUITS
// ============================================================
export const getProduits = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/api/produits${query ? `?${query}` : ''}`);
};

export const getProduitsFournisseur = () =>
  request('/api/produits/fournisseur', { headers: authHeaders() });

export const addProduit = (formData) =>
  request('/api/produits', {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

export const deleteProduit = (id) =>
  request(`/api/produits/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

// ============================================================
// 💳 COMMANDES / PAIEMENTS
// ============================================================
export const creerCommande = (commande) =>
  request('/api/commandes', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(commande),
  });

export const validerPaiement = (payload) =>
  request('/api/paiements/mobile-money', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

// ============================================================
// 🛡️ ADMIN
// ============================================================
export const getAdminFournisseurs = (statut) =>
  request(`/api/admin/fournisseurs?statut=${statut}`, { headers: authHeaders() });

export const updateStatutFournisseur = (id, statut) =>
  request(`/api/admin/fournisseurs/${id}/statut`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ statut }),
  });

export const getAdminPaiements = () =>
  request('/api/admin/paiements', { headers: authHeaders() });

export const updateStatutPaiement = (id, statut) =>
  request(`/api/admin/paiements/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ statut }),
  });

export const getAdminUtilisateurs = () =>
  request('/api/admin/utilisateurs', { headers: authHeaders() });

export const deleteUtilisateur = (id) =>
  request(`/api/admin/utilisateurs/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

export const getAdminProduits = () =>
  request('/api/admin/produits', { headers: authHeaders() });

export const deleteAdminProduit = (id) =>
  request(`/api/admin/produits/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

// ============================================================
// 📅 RÉSERVATIONS
// ============================================================
export const getAdminReservations = () =>
  request('/api/admin/reservations', { headers: authHeaders() });

// CORRECTION : Changement de PATCH en PUT pour éviter l'erreur CORS
export const updateReservationStatut = (id, statut) =>
  request(`/api/reservations/${id}/statut`, {
    method: 'PATCH', 
    headers: authHeaders(),
    body: JSON.stringify({ statut }),
  });

export const deleteReservation = (id) =>
  request(`/api/reservations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });