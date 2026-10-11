const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Abonnement = sequelize.define('Abonnement', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    clientId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
    clientNom: { type: DataTypes.STRING, allowNull: true },
    telephone: { type: DataTypes.STRING, allowNull: false },
    adresse: { type: DataTypes.STRING, allowNull: false },
    serviceId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'services', key: 'id' }, onDelete: 'SET NULL' },
    serviceNom: { type: DataTypes.STRING, allowNull: true },
    frequence: {
        type: DataTypes.STRING(30), allowNull: false, defaultValue: 'hebdomadaire',
        validate: { isIn: { args: [['hebdomadaire', 'quinzaine', 'mensuel']], msg: 'Fréquence invalide.' } }
    },
    jourPrefere: { type: DataTypes.STRING(20), allowNull: true },
    heure: { type: DataTypes.STRING(20), allowNull: true },
    remarques: { type: DataTypes.TEXT, allowNull: true },
    modeFacturation: {
        type: DataTypes.STRING(20), defaultValue: 'mois',
        validate: { isIn: { args: [['mois', 'semaine', 'visite']], msg: 'Mode de facturation invalide.' } }
    },
    montant: { type: DataTypes.DECIMAL(10, 2), allowNull: true },          // prix par mois / semaine / visite
    montantTotalDu: { type: DataTypes.DECIMAL(10, 2), allowNull: true },   // total que le client doit régler
    acompteDemande: { type: DataTypes.DECIMAL(10, 2), allowNull: true },   // défaut : 50 % du total
    statut: {
        type: DataTypes.STRING(30), defaultValue: 'EN_ETUDE',
        validate: { isIn: { args: [['EN_ETUDE', 'PROPOSE', 'ACTIF', 'EN_PAUSE', 'RESILIE', 'REFUSE']], msg: "Statut d'abonnement invalide." } }
    },
    dateDebut: { type: DataTypes.DATEONLY, allowNull: true },
    prochaineVisite: { type: DataTypes.DATEONLY, allowNull: true },
    creeParAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
    creePar: { type: DataTypes.INTEGER, allowNull: true }
}, { tableName: 'abonnements', freezeTableName: true, timestamps: true });

const AbonnementPrestataire = sequelize.define('AbonnementPrestataire', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    abonnementId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'abonnements', key: 'id' }, onDelete: 'CASCADE' },
    fournisseurId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'fournisseurs', key: 'id' }, onDelete: 'CASCADE' },
    actif: { type: DataTypes.BOOLEAN, defaultValue: true },
    dateDebut: { type: DataTypes.DATEONLY, allowNull: true },
    dateFin: { type: DataTypes.DATEONLY, allowNull: true }
}, { tableName: 'abonnement_prestataires', freezeTableName: true, timestamps: true });

const AbonnementVersement = sequelize.define('AbonnementVersement', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    abonnementId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'abonnements', key: 'id' }, onDelete: 'CASCADE' },
    montant: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    mode: {
        type: DataTypes.STRING(30), allowNull: false,
        validate: { isIn: { args: [['mobile_money', 'nita', 'amanata', 'especes', 'autre']], msg: 'Mode de paiement invalide.' } }
    },
    type: {
        type: DataTypes.STRING(20), defaultValue: 'ACOMPTE',
        validate: { isIn: { args: [['ACOMPTE', 'SOLDE', 'AUTRE']], msg: 'Type de versement invalide.' } }
    },
    reference: { type: DataTypes.STRING, allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    enregistrePar: { type: DataTypes.INTEGER, allowNull: true }
}, { tableName: 'abonnement_versements', freezeTableName: true, timestamps: true });

const AbonnementReglement = sequelize.define('AbonnementReglement', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    abonnementId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'abonnements', key: 'id' }, onDelete: 'CASCADE' },
    fournisseurId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'fournisseurs', key: 'id' }, onDelete: 'CASCADE' },
    periodeDebut: { type: DataTypes.DATEONLY, allowNull: false },
    periodeFin: { type: DataTypes.DATEONLY, allowNull: false },
    brutAbonnement: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    commissionKanari: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    partPrevue: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    visitesPrevues: { type: DataTypes.INTEGER, defaultValue: 0 },
    visitesFaites: { type: DataTypes.INTEGER, defaultValue: 0 },
    absences: { type: DataTypes.INTEGER, defaultValue: 0 },
    deduction: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    netAPayer: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    modePaiement: { type: DataTypes.STRING(30), allowNull: true },
    statut: { type: DataTypes.STRING(20), defaultValue: 'A_PAYER' },   // A_PAYER | PAYE
    payeLe: { type: DataTypes.DATE, allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    enregistrePar: { type: DataTypes.INTEGER, allowNull: true }
}, { tableName: 'abonnement_reglements', freezeTableName: true, timestamps: true });

module.exports = { Abonnement, AbonnementPrestataire, AbonnementVersement, AbonnementReglement };