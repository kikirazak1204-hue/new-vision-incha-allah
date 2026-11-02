// src/util/paiementsApi.js — appels API : paiements, commandes boutique, suivi de livraison
const API = import.meta.env.VITE_API_URL;

async function appel(method, path, body) {
    const r = await fetch(`${API}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: body ? JSON.stringify(body) : undefined
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.success === false) {
        throw new Error([d.message || d.error || `Erreur ${r.status}`, d.detail ? `(${d.detail})` : ''].join(' ').trim());
    }
    return d;
}

export const getPaiementsClientMissions = () => appel('GET', '/api/paiements/client/missions');
export const getPortefeuilleFournisseur = () => appel('GET', '/api/paiements/fournisseur/portefeuille');
export const getMesCommandes = () => appel('GET', '/api/commandes');
export const getCommandesFournisseur = () => appel('GET', '/api/commandes/fournisseur');
export const majLivraisonCommande = (id, statut) => appel('PUT', `/api/commandes/${id}/livraison`, { statut });

export const api = appel;
export const getPortefeuille = () => appel('GET', '/api/soldes/portefeuille');
export const demanderRetraitPortefeuille = (body) => appel('POST', '/api/soldes/retrait', body);
export const payerAvecPortefeuille = (body) => appel('POST', '/api/paiements/payer-portefeuille', body);
export const getSoldeMien = () => appel('GET', '/api/soldes/mien');
export const demanderRetrait = (body) => appel('POST', '/api/soldes/retrait', body);
export const getRecompensesClient = () => appel('GET', '/api/soldes/client');
export const creerCommande = (body) => appel('POST', '/api/commandes', body);

export const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`;
export const ETAPES_LIVRAISON = [
    { id: 'a_preparer', label: 'À préparer' },
    { id: 'en_preparation', label: 'En préparation' },
    { id: 'expediee', label: 'Expédiée' },
    { id: 'livree', label: 'Livrée' },
];