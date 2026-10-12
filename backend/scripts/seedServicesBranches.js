require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize, Service, ServiceBranche } = require('../models');

const norm = (t = '') => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const NOUVEAUX = {
  'Decoration et evenements': ['🎊', 'Decoration de salles, mariages et ceremonies.', ['Mariage', 'Bapteme / anniversaire', 'Decoration de salle', 'Ballons et arches', 'Location de chaises et baches', 'Eclairage et sono', 'Decoration de maison']],
  'Peinture': ['🎨', 'Peinture interieure et exterieure.', ['Peinture interieure', 'Peinture exterieure', 'Enduit / poncage', 'Decoration murale', 'Peinture apres chantier', 'Peinture de portail']],
  'Serrurerie': ['🔐', 'Ouverture, serrures et securisation.', ['Ouverture de porte', 'Changement de serrure', 'Double de cles', 'Coffre-fort', 'Blindage de porte']],
  'Vitrerie et aluminium': ['🪟', 'Fenetres, portes aluminium, vitres et miroirs.', ['Fenetres aluminium', 'Portes aluminium', 'Vitres / miroirs', 'Verandas', 'Reparation']],
  'Soudure et ferronnerie': ['🔥', 'Portails, grilles, structures metalliques.', ['Portail / grille', 'Garde-corps', 'Charpente metallique', 'Reparation', 'Mobilier metallique']],
  'Informatique et reseaux': ['💻', 'Depannage informatique, reseau et Wi-Fi.', ['Depannage ordinateur', 'Reseau / Wi-Fi', 'Installation logiciel', 'Recuperation de donnees', 'Site web / application', 'Maintenance de bureau']],
  'Antenne et cameras': ['📡', 'Antennes, paraboles et videosurveillance.', ['Installation antenne / parabole', 'Reglage TV', 'Cameras de surveillance', 'Sonorisation', 'Interphone / alarme']],
  'Demenagement': ['📦', 'Demenagement maison et bureau.', ['Demenagement maison', 'Demenagement bureau', 'Manutention', 'Transport de meubles', 'Emballage']],
  'Garde d\'enfants': ['🧸', 'Nounou, aide aux devoirs, garde ponctuelle.', ['Garde a domicile', 'Aide aux devoirs', 'Garde de nuit', 'Garde ponctuelle', 'Accompagnement ecole']],
  'Aide a domicile': ['🤝', 'Aide aux personnes agees et dependantes.', ['Aide aux personnes agees', 'Garde-malade', 'Courses et repas', 'Compagnie', 'Aide a la toilette']],
  'Lavage auto': ['🚿', 'Lavage de vehicules a domicile.', ['Lavage exterieur', 'Lavage interieur', 'Lavage complet', 'Lavage moto', 'Polish / lustrage']],
  'Blanchisserie et pressing': ['👔', 'Lavage, repassage et pressing.', ['Lavage du linge', 'Repassage', 'Pressing', 'Tapis et rideaux', 'Collecte a domicile']],
  'Photographie et video': ['📷', 'Photo et video pour evenements et produits.', ['Photo evenement', 'Photo de produit', 'Video / montage', 'Drone', 'Portrait']],
  'Traiteur et cuisine': ['🍲', 'Repas a domicile, traiteur et patisserie.', ['Repas a domicile', 'Traiteur evenement', 'Patisserie / gateaux', 'Cuisinier a la journee', 'Repas de ceremonie']],
  'Deratisation et desinsectisation': ['🪳', 'Lutte contre rats, cafards, moustiques, termites.', ['Cafards / punaises', 'Rats / souris', 'Moustiques', 'Termites', 'Desinfection']],
  'Energie solaire': ['☀️', 'Panneaux solaires, onduleurs, lampadaires.', ['Panneaux solaires', 'Onduleur / batteries', 'Lampadaires solaires', 'Maintenance', 'Pompe solaire']],
  'Forage et puits': ['💧', 'Forage, puits et chateau d\'eau.', ['Forage', 'Puits', 'Pompe', 'Chateau d\'eau / citerne', 'Entretien']],
  'Reparation electromenager': ['🧺', 'Machine a laver, frigo, cuisiniere, ventilateur.', ['Machine a laver', 'Refrigerateur / congelateur', 'Cuisiniere / four', 'Ventilateur', 'Fer et petit electromenager']],
};

// Branches ajoutees a des services existants (cle = nom normalise)
const EXTRA = {
  'menage': ['Repassage', 'Lavage de tapis', 'Nettoyage de reservoir', 'Nettoyage de cuisine', 'Nettoyage de vitres en hauteur', 'Entretien de residence'],
  'plomberie': ['Detection de fuite', 'Douche / baignoire', 'Fosse septique'],
  'electricite': ['Mise a la terre', 'Prises et interrupteurs', 'Ventilateur de plafond'],
};

(async () => {
  try {
    // Branches deja ecrites dans le frontend (branches.js)
    let existantes = {};
    try {
      const src = fs.readFileSync(path.join(__dirname, '../../frontend/src/constants/branches.js'), 'utf8').replace(/export /g, '');
      existantes = new Function(src + '; return BRANCHES;')();
    } catch (e) { console.warn('branches.js non lu :', e.message); }

    const ajouter = async (service, noms) => {
      for (const nom of noms) await ServiceBranche.findOrCreate({ where: { serviceId: service.id, nom }, defaults: { actif: true } });
    };

    for (const [nom, [emoji, description, branches]] of Object.entries(NOUVEAUX)) {
      const [s] = await Service.findOrCreate({ where: { nom }, defaults: { emoji, description, categorie: 'default' } });
      await ajouter(s, branches);
    }

    const tous = await Service.findAll();
    for (const s of tous) {
      const cle = norm(s.nom);
      await ajouter(s, [...(existantes[cle] || []), ...(EXTRA[cle] || [])]);
    }
    console.log('Services et branches importes.');
    process.exit(0);
  } catch (e) { console.error(e); process.exit(1); }
})();