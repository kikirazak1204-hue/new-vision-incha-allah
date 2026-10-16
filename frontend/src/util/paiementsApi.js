// src/util/paiementsApi.js — appels API des paiements (client + prestataire)
const API = import.meta.env.VITE_API_URL;

async function get(path) {
    const r = await fetch(`${API}${path}`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.success === false) throw new Error(d.message || 'Erreur serveur.');
    return d;
}

export const getPaiementsClientMissions = () => get('/api/paiements/client/missions');
export const getPortefeuilleFournisseur = () => get('/api/paiements/fournisseur/portefeuille');
export const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;