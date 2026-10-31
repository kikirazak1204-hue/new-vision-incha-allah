require('dotenv').config();
const { sequelize, Service, BranchesModels } = require('./models');
const ServiceBranche = BranchesModels || require('./models').ServiceBranche;

const NOUVEAUX = {
  'Decoration et evenements': ['', 'Decoration de salles, mariages et ceremonies.', ['Mariage', 'Bapteme / anniversaire', 'Decoration de salle', 'Ballons et arches', 'Location de chaises et baches', 'Eclairage et sono', 'Decoration de maison']],
  'Peinture': ['', 'Peinture interieure et exterieure.', ['Peinture interieure', 'Peinture exterieure', 'Enduit / poncage', 'Decoration murale', 'Peinture apres chantier', 'Peinture de portail']],
  'Serrurerie': ['', 'Ouverture, serrures et securisation.', ['Ouverture de porte', 'Changement de serrure', 'Double de cles', 'Coffre-fort', 'Blindage de porte']],
  'Vitrerie et aluminium': ['', 'Fenetres, portes aluminium, vitres et miroirs.', ['Fenetres aluminium', 'Portes aluminium', 'Vitres / miroirs', 'Verandas', 'Reparation']],
  'Soudure et ferronnerie': ['', 'Portails, grilles, structures metalliques.', ['Portail / grille', 'Garde-corps', 'Charpente metallique', 'Reparation', 'Mobilier metallique']],
  'Informatique et reseaux': ['', 'Depannage informatique, reseau et Wi-Fi.', ['Depannage ordinateur', 'Reseau / Wi-Fi', 'Installation logiciel', 'Recuperation de donnees', 'Site web / application', 'Maintenance de bureau']],
  'Antenne et cameras': ['', 'Antennes, paraboles et videosurveillance.', ['Installation antenne / parabole', 'Reglage TV', 'Cameras de surveillance', 'Sonorisation', 'Interphone / alarme']],
  'Demenagement': ['', 'Demenagement maison et bureau.', ['Demenagement maison', 'Demenagement bureau', 'Manutention', 'Transport de meubles', 'Emballage']],
  'Garde d\'enfants': ['', 'Nounou, aide aux devoirs, garde ponctuelle.', ['Garde a domicile', 'Aide aux devoirs', 'Garde de nuit', 'Garde ponctuelle', 'Accompagnement ecole']],
  'Aide a domicile': ['', 'Aide aux personnes agees et dependantes.', ['Aide aux personnes agees', 'Garde-malade', 'Courses et repas', 'Compagnie', 'Aide a la toilette']],
  'Lavage auto': ['', 'Lavage de vehicules a domicile.', ['Lavage exterieur', 'Lavage interieur', 'Lavage complet', 'Lavage moto', 'Polish / lustrage']],
  'Blanchisserie et pressing': ['', 'Lavage, repassage et pressing.', ['Lavage du linge', 'Repassage', 'Pressing', 'Tapis et rideaux', 'Collecte a domicile']],
  'Photographie et video': ['', 'Photo et video pour evenements et produits.', ['Photo evenement', 'Photo de produit', 'Video / montage', 'Drone', 'Portrait']],
  'Traiteur et cuisine': ['', 'Repas a domicile, traiteur et patisserie.', ['Repas a domicile', 'Traiteur evenement', 'Patisserie / gateaux', 'Cuisinier a la journee', 'Repas de ceremonie']],
  'Deratisation et desinsectisation': ['', 'Lutte contre rats, cafards, moustiques, termites.', ['Cafards / punaises', 'Rats / souris', 'Moustiques', 'Termites', 'Desinfection']],
  'Energie solaire': ['', 'Panneaux solaires, onduleurs, lampadaires.', ['Panneaux solaires', 'Onduleur / batteries', 'Lampadaires solaires', 'Maintenance', 'Pompe solaire']],
  'Forage et puits': ['', 'Forage, puits et chateau d\'eau.', ['Forage', 'Puits', 'Pompe', 'Chateau d\'eau / citerne', 'Entretien']],
  'Reparation electromenager': ['', 'Machine a laver, frigo, cuisiniere, ventilateur.', ['Machine a laver', 'Refrigerateur / congelateur', 'Cuisinere / four', 'Ventilateur', 'Fer et petit electromenager']],
  'Plomberie': ['', 'Fuites, evacuations bouchees, installation de sanitaires.', ['Detection de fuite', 'Douche / baignoire', 'Fosse septique', 'Installation sanitaire']],
  'Electricite': ['', 'Panne de courant, installation, tableau electrique.', ['Mise a la terre', 'Prises et interrupteurs', 'Ventilateur de plafond', 'Tableau electrique']],
  'Mecanique': ['', 'Panne de voiture, entretien, reparation moteur.', ['Entretien moteur', 'Freinage', 'Vidange', 'Depannage']],
  'Climatisation': ['', 'Installation, entretien et depannage de climatiseur.', ['Installation clim', 'Recharge gaz', 'Entretien filtre', 'Depannage']]
};

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Base de donnees connectee avec succes.');

    for (const [nom, [_, description, branches]] of Object.entries(NOUVEAUX)) {
      const [service] = await Service.findOrCreate({
        where: { nom },
        defaults: { emoji: '', description, categorie: 'default' }
      });
      console.log(`Service configure : ${nom}`);

      if (ServiceBranche && branches && branches.length > 0) {
        for (const nomBranche of branches) {
          await ServiceBranche.findOrCreate({
            where: { serviceId: service.id, nom: nomBranche },
            defaults: { actif: true }
          });
        }
      }
    }

    console.log('Importation complete des services et branches terminee.');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors de l importation :', err);
    process.exit(1);
  }
})();