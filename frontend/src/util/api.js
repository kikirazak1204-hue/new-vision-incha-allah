// ============================================================
// src/util/api.js — Version mise à jour
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const requestJson = async (url, options = {}) => {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';

  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      (typeof data === 'string' && data) ||
      `HTTP ${res.status} ${res.statusText}`;

    throw new Error(message);
  }

  return data;
};

export const authHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ============================================================
// 👤 AUTH & UTILISATEURS
// ============================================================
export const loginUser = async ({ email, password }) => {
  return requestJson(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
};

export const registerUser = (payload) =>
  requestJson(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

export const registerFournisseur = (payload, token) =>
  requestJson(`${BASE_URL}/api/fournisseurs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

// ============================================================
// 📊 DASHBOARDS
// ============================================================
export const getDashboardClient = () =>
  requestJson(`${BASE_URL}/api/dashboard/client`, {
    headers: authHeaders(),
  });

export const getDashboardFournisseur = () =>
  requestJson(`${BASE_URL}/api/dashboard/fournisseur`, {
    headers: authHeaders(),
  });

// ============================================================
// 🛠️ SERVICES & FOURNISSEURS
// ============================================================
export const getServices = () =>
  requestJson(`${BASE_URL}/api/services`);

export const getService = (id) =>
  requestJson(`${BASE_URL}/api/services/${id}`);

export const getFournisseursParService = (id) =>
  requestJson(`${BASE_URL}/api/services/${id}/fournisseurs`);

// ============================================================
// 📦 PRODUITS
// ============================================================
export const getProduits = () =>
  requestJson(`${BASE_URL}/api/produits`);

export const getProduitsFournisseur = () =>
  requestJson(`${BASE_URL}/api/produits/fournisseur`, {
    headers: authHeaders(),
  });

export const addProduit = (formData) =>
  requestJson(`${BASE_URL}/api/produits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  });

export const deleteProduit = (id) =>
  requestJson(`${BASE_URL}/api/produits/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

// ============================================================
// 💳 PAIEMENTS & COMMANDES
// ============================================================
export const creerCommande = (commande) =>
  requestJson(`${BASE_URL}/api/commandes`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(commande),
  });

export const validerPaiement = (payload) =>
  requestJson(`${BASE_URL}/api/paiements/mobile-money`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

// ============================================================
// 🛡️ ADMIN PANEL
// ============================================================
export const getAdminFournisseurs = (statut) =>
  requestJson(`${BASE_URL}/api/admin/fournisseurs?statut=${statut}`, {
    headers: authHeaders(),
  });

export const updateStatutFournisseur = (id, statut) =>
  requestJson(`${BASE_URL}/api/admin/fournisseurs/${id}/statut`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ statut }),
  });

export const getAdminPaiements = () =>
  requestJson(`${BASE_URL}/api/admin/paiements`, {
    headers: authHeaders(),
  });

export const updateStatutPaiement = (id, statut) =>
  requestJson(`${BASE_URL}/api/admin/paiements/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ statut }),
  });

export const getAdminUtilisateurs = () =>
  requestJson(`${BASE_URL}/api/admin/utilisateurs`, {
    headers: authHeaders(),
  });

export const deleteUtilisateur = (id) =>
  requestJson(`${BASE_URL}/api/admin/utilisateurs/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

export const getAdminProduits = () =>
  requestJson(`${BASE_URL}/api/admin/produits`, {
    headers: authHeaders(),
  });

export const deleteAdminProduit = (id) =>
  requestJson(`${BASE_URL}/api/admin/produits/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

// ============================================================
// 📅 RÉSERVATIONS (ADMIN)
// ============================================================
export const getAdminReservations = () =>
  requestJson(`${BASE_URL}/api/reservations/admin`, {
    headers: authHeaders(),
  });

export const updateReservationStatut = (id, statut) =>
  requestJson(`${BASE_URL}/api/reservations/${id}/statut`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ statut }),
  });

export const deleteReservation = (id) =>
  requestJson(`${BASE_URL}/api/reservations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });