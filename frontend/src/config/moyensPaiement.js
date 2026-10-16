// ==========================================================
// src/config/moyensPaiement.js
// 👉 FICHIER À MODIFIER : remplace les numéros et titulaires par les vrais.
// - Supprime un bloc pour masquer un moyen de paiement.
// - Copie un bloc pour en ajouter un (id unique, en minuscules sans espace).
// Les numéros ci-dessous sont des EXEMPLES, pas de vrais numéros.
// ==========================================================

export const MOYENS_PAIEMENT = [
    {
        id: 'orange_money', nom: 'Orange Money', icone: '🟠', couleur: 'bg-orange-500/10 text-orange-400',
        description: 'Transfert Orange Money',
        numero: '00 00 00 00', titulaire: 'KANARI (à renseigner)'
    },
    {
        id: 'moov_money', nom: 'Moov Money', icone: '🔵', couleur: 'bg-blue-500/10 text-blue-400',
        description: 'Transfert Moov Money',
        numero: '00 00 00 00', titulaire: 'KANARI (à renseigner)'
    },
    {
        id: 'airtel_money', nom: 'Airtel Money', icone: '🔴', couleur: 'bg-red-500/10 text-red-400',
        description: 'Transfert Airtel Money',
        numero: '00 00 00 00', titulaire: 'KANARI (à renseigner)'
    },
    {
        id: 'amanata', nom: 'Amanata', icone: '📱', couleur: 'bg-amber-500/10 text-amber-400',
        description: 'Transfert Amanata',
        numero: '00 00 00 00', titulaire: 'KANARI (à renseigner)'
    },
    {
        id: 'mynita', nom: 'MyNita', icone: '📲', couleur: 'bg-emerald-500/10 text-emerald-400',
        description: 'Transfert MyNita',
        numero: '00 00 00 00', titulaire: 'KANARI (à renseigner)'
    },
    {
        id: 'virement_bancaire', nom: 'Virement bancaire', icone: '🏦', couleur: 'bg-indigo-500/10 text-indigo-400',
        description: 'Virement ou dépôt en banque',
        banque: 'Nom de la banque (à renseigner)', titulaire: 'KANARI (à renseigner)',
        iban: 'Numéro de compte / RIB (à renseigner)',
        instructions: 'Indiquez votre nom et la référence du dossier dans le motif du virement.'
    }
];