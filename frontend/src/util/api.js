// ============================================================
// src/util/api.js
// ============================================================

// 🟢 Détection automatique : utilise localhost si tu es sur ta machine, 
// ou l'URL de Render si l'application est en ligne. Plus besoin de changer avant de push !
const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000' 
  : 'https://newvision-backend.onrender.com';

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
    body: formData,
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
// 🛡️ ADMIN GENERAL
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
// 📅 RÉSERVATIONS (MISSIONS KANARI)
// ============================================================
export const getAdminReservations = () =>
  request('/api/admin/reservations', { headers: authHeaders() });

// 🟢 CORRIGÉ : Ajout de /admin pour correspondre à routes/admin.js du backend
export const updateReservationStatut = (id, statut) =>
  request(`/api/admin/reservations/${id}/statut`, { 
    method: 'PATCH', 
    headers: authHeaders(),
    body: JSON.stringify({ statut }),
  });

// 🟢 CORRIGÉ : Ajout de /admin si la suppression est aussi gérée par le panel admin
export const deleteReservation = (id) =>
  request(`/api/admin/reservations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

// ── NOUVELLES ROUTES ADMIN CORRIGÉES (AVEC LE PRÉFIXE /api/admin) ───────

export const assignerFournisseur = (id, fournisseurId) =>
  request(`/api/admin/reservations/${id}/assigner`, { 
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ fournisseurId }),
  });

export const autoriserDemarrage = (id) =>
  request(`/api/admin/reservations/${id}/autoriser`, { 
    method: 'PUT',
    headers: authHeaders(),
  });

export const adminCreerReservation = (payload) =>
  request('/api/admin/reservations/admin-creer', { 
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });