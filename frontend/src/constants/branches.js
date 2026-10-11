const normaliser = (t = '') =>
  t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export const BRANCHES = {
  'accessoires': ['Accessoires de mode', 'Téléphones et accessoires', 'Articles de maison', 'Sacs et chaussures', 'Bijoux'],
  'alimentation': ['Épicerie', 'Grossiste', 'Fruits et légumes', 'Viande et poisson', 'Boissons', 'Produits locaux'],
  'artisanat': ['Objets décoratifs', 'Cadeaux', 'Maroquinerie', 'Poterie / sculpture', 'Tissage / vannerie', 'Création sur commande'],
  'assurance': ['Auto / moto', 'Habitation', 'Santé', 'Professionnelle', 'Conseil en protection'],
  'avocat et juridique': ['Conseil juridique', 'Contrats', 'Droit des affaires', 'Droit de la famille', 'Litiges', 'Démarches administratives'],
  'benevolat': ['Aide sociale', 'Éducation', 'Santé communautaire', 'Environnement', 'Événements solidaires'],
  'climatisation': ['Installation', 'Entretien / recharge gaz', 'Dépannage', 'Réfrigérateur / congélateur', 'Chambre froide'],
  'coiffure et beaute': ['Coiffure femme', 'Coiffure homme', 'Tresses', 'Maquillage', 'Soins de beauté', 'Manucure / pédicure', 'À domicile'],
  'couture': ['Couture sur mesure', 'Retouches', 'Tenues de cérémonie', 'Broderie', 'Uniformes'],
  'divertissement': ['DJ / sonorisation', 'Animation', 'Mariage', 'Baptême / anniversaire', 'Décoration événement', 'Location de matériel'],
  'education': ['Soutien primaire', 'Collège / lycée', 'Langues', 'Informatique', 'Cours du soir', 'Formation professionnelle'],
  'electricite': ['Panne / court-circuit', 'Installation neuve', 'Tableau électrique', 'Éclairage', 'Groupe électrogène', 'Panneaux solaires', 'Onduleur / batteries'],
  'fleuriste': ['Bouquets', 'Décoration florale', 'Mariage / cérémonie', 'Livraison de fleurs', "Plantes d'intérieur"],
  'fournisseur de produits': ['Grossiste', 'Distributeur', 'Matériaux de construction', 'Produits électroniques', 'Produits ménagers', 'Autre produit'],
  'hotellerie': ['Hôtel', "Maison d'hôtes", 'Résidence meublée', 'Salle de réunion', 'Séjour longue durée'],
  'jardinage': ['Tonte / désherbage', 'Taille', 'Arrosage', 'Plantation', 'Entretien régulier'],
  'livraison': ['Colis', 'Documents', 'Repas', 'Course urgente', 'Livraison à moto', 'Livraison programmée'],
  'location': ['Maison / appartement', 'Salle', 'Véhicule', 'Matériel de chantier', 'Matériel de fête', 'Chaises et bâches'],
  'maconnerie': ['Maçonnerie', 'Carrelage', 'Enduit / crépissage', 'Clôture / mur', 'Dalle / fondations', 'Rénovation', 'Peinture'],
  'mecanique': ['Vidange / entretien', 'Freins', 'Moteur', 'Électricité auto', 'Pneus / vulcanisation', 'Dépannage sur place', 'Mécanique moto'],
  'medecine': ['Consultation à domicile', 'Soins infirmiers', 'Garde-malade', 'Kinésithérapie', 'Aide aux personnes âgées', 'Livraison de médicaments'],
  'menage': ['Maison / appartement', 'Bureau / commerce', 'Vitres', 'Après chantier', 'Canapés et matelas', 'Désinfection', 'Ménage régulier'],
  'menuiserie': ['Portes et fenêtres', 'Meubles sur mesure', 'Réparation de meubles', 'Placards / cuisine', 'Charpente'],
  'mission et freelance': ['Rédaction', 'Graphisme / design', 'Traduction', 'Développement web / mobile', 'Marketing / réseaux sociaux', 'Saisie / assistance', 'Photo / vidéo'],
  'plomberie': ["Fuite d'eau", 'Robinet / tuyauterie', 'Sanitaire (WC, lavabo, douche)', 'Chauffe-eau', 'Canalisation / débouchage', 'Pompe / surpresseur', 'Installation neuve'],
  'prise de rendez-vous': ['Salon de coiffure / beauté', 'Cabinet médical', 'Atelier / garage', 'Cabinet juridique', 'Autre rendez-vous'],
  'reparation': ['Téléphone', 'Ordinateur', 'Télévision', 'Électroménager', 'Appareil électronique', 'Climatiseur / ventilateur'],
  'securite': ['Gardiennage de jour', 'Gardiennage de nuit', 'Planton', 'Agent de sécurité', 'Événement', 'Vidéosurveillance'],
  'sport et fitness': ['Coach à domicile', 'Musculation', 'Cours collectifs', 'Football / sports collectifs', 'Yoga / bien-être', 'Club partenaire'],
  'transport': ['Chauffeur à la journée', 'Transport de personnes', 'Transport de marchandises', 'Déménagement', 'Course en ville', 'Voyage interurbain'],
};

export const BRANCHES_GENERIQUES = [
  'Dépannage / urgence',
  'Installation',
  'Entretien régulier',
  'Réparation',
  'Conseil / devis',
  'Autre (à préciser)',
];

export const branchesDuService = (nomService = '') =>
  BRANCHES[normaliser(nomService)] || BRANCHES_GENERIQUES;
