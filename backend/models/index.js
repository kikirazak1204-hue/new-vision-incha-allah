const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// ── Import des modèles ─────────────────────────────────────────
const User = require('./User');
const Service = require('./Service');
const Fournisseur = require('./Fournisseur');
const Produit = require('./Produit');
const Commande = require('./Commande');
const CommandeProduit = require('./CommandeProduit');
const Facture = require('./Facture');
const Paiement = require('./Paiement');
const Reservation = require('./Reservation');
const Message = require('./Message');
const Solde = require('./Solde');
const Retrait = require('./Retrait');
const Devis = require('./Devis');

// ── Service ↔ Fournisseur / Produit / Reservation ──────────────
Service.hasMany(Fournisseur, { foreignKey: 'serviceId', as: 'fournisseursService' });
Fournisseur.belongsTo(Service, { foreignKey: 'serviceId', as: 'serviceFournisseur' });

Service.hasMany(Produit, { foreignKey: 'serviceId', as: 'produitsService' });
Produit.belongsTo(Service, { foreignKey: 'serviceId', as: 'produitService' });

Service.hasMany(Reservation, { foreignKey: 'serviceId', as: 'reservationsService' });
Reservation.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

// ── Fournisseur ↔ User / Produit / Commande / Reservation ──────
User.hasOne(Fournisseur, { foreignKey: 'userId', as: 'profilFournisseur' });
Fournisseur.belongsTo(User, { foreignKey: 'userId', as: 'userFournisseur' });

Fournisseur.hasMany(Produit, { foreignKey: 'fournisseurId', as: 'produitsFournisseur' });
Produit.belongsTo(Fournisseur, { foreignKey: 'fournisseurId', as: 'fournisseur' });

Fournisseur.hasMany(Commande, { foreignKey: 'fournisseurId', as: 'commandesFournisseur' });
Commande.belongsTo(Fournisseur, { foreignKey: 'fournisseurId', as: 'fournisseurCommande' });

Fournisseur.hasMany(Reservation, { foreignKey: 'fournisseurId', as: 'missionsPrestataire' });
Reservation.belongsTo(Fournisseur, { foreignKey: 'fournisseurId', as: 'prestataire' });

// ── Commande ↔ User / Facture / Paiement ──────────────────────
User.hasMany(Commande, { foreignKey: 'clientId', as: 'commandesClient' });
Commande.belongsTo(User, { foreignKey: 'clientId', as: 'clientCommande' });

Commande.hasMany(Facture, { foreignKey: 'commandeId', as: 'facturesCommande' });
Facture.belongsTo(Commande, { foreignKey: 'commandeId', as: 'factureCommande' });

Commande.hasMany(Paiement, { foreignKey: 'commandeId', as: 'paiementsCommande' });
Paiement.belongsTo(Commande, { foreignKey: 'commandeId', as: 'commandePaiement' });

// ── Commande ↔ Produits via CommandeProduit ────────────────────
Commande.hasMany(CommandeProduit, { foreignKey: 'commandeId', as: 'itemsCommande' });
CommandeProduit.belongsTo(Commande, { foreignKey: 'commandeId', as: 'commandeProduit' });
Produit.hasMany(CommandeProduit, { foreignKey: 'produitId', as: 'commandeProduits' });
CommandeProduit.belongsTo(Produit, { foreignKey: 'produitId', as: 'produitCommandeProduit' });

// ── Reservation ↔ User (client) ────────────────────────────────
User.hasMany(Reservation, { foreignKey: 'clientId', as: 'reservationsClient' });
Reservation.belongsTo(User, { foreignKey: 'clientId', as: 'client' });

// ── Reservation ↔ Message ──────────────────────────────────────
Reservation.hasMany(Message, { foreignKey: 'reservationId', as: 'messages' });
Message.belongsTo(Reservation, { foreignKey: 'reservationId', as: 'reservationMessage' });

// ── Message ↔ User (expéditeur) ────────────────────────────────
User.hasMany(Message, { foreignKey: 'senderId', as: 'messagesEnvoyes' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'expediteur' });

// ── Devis ↔ Reservation ────────────────────────────────────────
Reservation.hasMany(Devis, { foreignKey: 'reservationId', as: 'devis' });
Devis.belongsTo(Reservation, { foreignKey: 'reservationId', as: 'reservationDevis' });

// ── Solde ↔ Fournisseur ────────────────────────────────────────
Fournisseur.hasOne(Solde, { foreignKey: 'fournisseurId', as: 'soldeFournisseur' });
Solde.belongsTo(Fournisseur, { foreignKey: 'fournisseurId', as: 'fournisseurSolde' });

// ── Retrait ↔ Fournisseur ──────────────────────────────────────
Fournisseur.hasMany(Retrait, { foreignKey: 'fournisseurId', as: 'retraits' });
Retrait.belongsTo(Fournisseur, { foreignKey: 'fournisseurId', as: 'fournisseurRetrait' });

// ── EXPORT GLOBAL ──────────────────────────────────────────────
module.exports = {
  sequelize,
  User,
  Service,
  Fournisseur,
  Produit,
  Commande,
  CommandeProduit,
  Facture,
  Paiement,
  Reservation,
  Message,
  Solde,
  Retrait,
  Devis,
};