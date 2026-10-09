# KANARI SERVICE — GEMINI PROJECT INSTRUCTIONS

## 1. IDENTITÉ DU PROJET

Tu travailles sur Kanari Service, une plateforme de coordination de services destinée initialement à Niamey, au Niger.

Kanari n'est PAS simplement un annuaire ou une plateforme de mise en relation.

Son objectif est de coordonner une demande de service de bout en bout :
demande client → réservation → organisation/attribution → intervention → suivi → validation → paiement → notation → historique.

Le projet existe déjà et est en phase avancée de développement.
Le code existant est prioritaire sur toute supposition.

IMPORTANT :
Tu ne dois jamais considérer que l'application doit être reconstruite depuis zéro.

---

# 2. MISSION PRINCIPALE

Ta mission est d'abord de COMPRENDRE l'application existante avant de la modifier.

Tu dois être capable de :

1. analyser le frontend ;
2. analyser le backend ;
3. analyser les API ;
4. analyser les modèles et la base de données ;
5. analyser l'authentification ;
6. analyser les rôles ;
7. analyser les réservations ;
8. analyser les prestataires ;
9. analyser les services ;
10. analyser les missions ;
11. analyser les statuts ;
12. analyser les notifications ;
13. analyser la géolocalisation ;
14. analyser les paiements ;
15. analyser les tableaux de bord ;
16. analyser l'administration ;
17. analyser le déploiement ;
18. identifier les dépendances entre toutes ces parties.

Tu dois comparer le fonctionnement réel du code avec les règles métier documentées dans ce projet.

---

# 3. RÈGLE ABSOLUE : NE PAS CASSER L'EXISTANT

L'application est déjà fonctionnelle sur de nombreuses parties.

Tu dois donc appliquer la règle suivante :

COMPRENDRE AVANT DE MODIFIER.

Tu ne dois jamais :

- réécrire toute l'application sans nécessité ;
- supprimer une fonctionnalité fonctionnelle ;
- remplacer une architecture simplement parce qu'une autre te paraît meilleure ;
- modifier massivement le code pour résoudre un problème local ;
- supprimer des routes API sans analyse ;
- supprimer des modèles ou colonnes de base de données sans analyse ;
- modifier les contrats API sans vérifier leurs consommateurs ;
- modifier une logique métier uniquement sur une supposition ;
- inventer une fonctionnalité et la considérer comme obligatoire.

Toute modification importante doit être justifiée.

Privilégier la correction minimale, robuste et maintenable.

---

# 4. PRIORITÉ DES INFORMATIONS

Lorsque plusieurs informations semblent contradictoires, utiliser cette hiérarchie :

1. Code réel actuellement présent dans le dépôt.
2. Structure et contrats réellement utilisés par frontend/backend.
3. Base de données et modèles existants.
4. Documentation officielle du projet présente dans le dépôt.
5. GEMINI.md.
6. Instructions données dans la conversation.
7. Hypothèses générales.

Si une règle métier n'est pas suffisamment claire :

NE PAS INVENTER.

Signaler l'incertitude et demander confirmation lorsque cela est nécessaire.

---

# 5. ARCHITECTURE À COMPRENDRE

Avant toute modification importante, cartographier :

## Frontend
- pages
- composants
- hooks
- services API
- authentification
- stockage local
- navigation
- tableaux de bord
- formulaires
- gestion des erreurs
- géolocalisation
- cartes

## Backend
- serveur
- routes
- contrôleurs
- services
- middleware
- authentification
- autorisations
- modèles
- accès base de données
- validations
- gestion des erreurs

## API
Identifier pour chaque fonctionnalité :
- endpoint
- méthode HTTP
- paramètres
- payload
- réponse
- authentification requise
- rôle autorisé
- frontend consommateur

## Base de données
Identifier :
- tables
- relations
- clés
- contraintes
- statuts
- utilisateurs
- prestataires
- services
- réservations
- missions
- paiements
- évaluations
- données de localisation.

---

# 6. RÔLES PRINCIPAUX

Le système doit être analysé au minimum selon les rôles suivants :

## CLIENT
Peut notamment :
- consulter les services ;
- effectuer une demande ;
- réserver ;
- suivre une demande ;
- recevoir les informations nécessaires ;
- valider une intervention ;
- évaluer ;
- consulter son historique.

## PRESTATAIRE
Peut notamment :
- être enregistré et contrôlé ;
- être associé à des services ;
- recevoir/voir des demandes selon les règles prévues ;
- accepter/refuser selon le fonctionnement existant ;
- effectuer une mission ;
- signaler l'état de son intervention ;
- fournir les informations nécessaires à la mission.

## ADMIN / KANARI
Peut notamment :
- gérer les utilisateurs ;
- gérer les prestataires ;
- contrôler les prestataires ;
- gérer les services ;
- gérer les réservations ;
- organiser les missions ;
- suivre les interventions ;
- gérer les statuts ;
- consulter les informations nécessaires ;
- superviser la géolocalisation ;
- gérer les opérations administratives.

Ne jamais supposer qu'un rôle possède une permission sans vérifier le code.

---

# 7. LOGIQUE DE RÉSERVATION

Kanari doit être analysé autour de deux logiques importantes :

## Réservation par prestataire/service
Le client peut demander un service et, selon le fonctionnement actuel, choisir ou être orienté vers un prestataire.

## « KANARI S'EN OCCUPE »
Le client peut demander à Kanari de prendre en charge l'organisation de la prestation.

Dans ce cas, Kanari peut organiser/attribuer la mission conformément au fonctionnement réel du projet.

Ne jamais modifier cette logique sans comprendre l'implémentation actuelle.

---

# 8. CYCLE D'UNE DEMANDE

Les statuts métier connus du projet comprennent notamment :

EN_ATTENTE
ACCEPTEE
EN_PREPARATION
EN_COURS
TERMINEE
VALIDEE
ANNULEE

Avant de modifier cette logique :

- rechercher tous les endroits où chaque statut est utilisé ;
- vérifier frontend ;
- vérifier backend ;
- vérifier base de données ;
- vérifier filtres ;
- vérifier notifications ;
- vérifier tableaux de bord ;
- vérifier transitions autorisées.

Ne jamais modifier un statut dans un seul fichier en supposant que le reste suivra automatiquement.

---

# 9. PRESTATAIRES

Les statuts connus comprennent notamment :

EN_ATTENTE
EN_EVALUATION
CONFORME
SUSPENDU

Le contrôle des prestataires est une partie importante de Kanari.

Analyser :
- inscription ;
- informations d'identité ;
- service ;
- validation ;
- disponibilité ;
- association au service ;
- statut ;
- suspension ;
- utilisation dans les réservations.

---

# 10. MISSION / INTERVENTION

Une réservation peut conduire à une mission.

Le système doit être analysé concernant :

- création de mission ;
- attribution ;
- prestataire ;
- client ;
- service ;
- statut ;
- suivi ;
- bon d'intervention ;
- facture ;
- validation ;
- notation ;
- paiement.

Le bon d'intervention et la facture peuvent être liés à une même intervention.

Ne pas casser les relations existantes.

---

# 11. GÉOLOCALISATION

La géolocalisation fait partie du fonctionnement prévu de Kanari.

Le fonctionnement existant doit être étudié avant modification.

Il peut notamment permettre :
- localisation du client lorsque nécessaire ;
- localisation du prestataire ;
- suivi du déplacement ;
- visualisation côté administration ;
- recherche/filtrage d'une mission ou d'un prestataire ;
- affichage sur carte.

La géolocalisation doit être traitée avec prudence pour les questions de sécurité et de confidentialité.

Ne jamais exposer une localisation à un rôle qui n'est pas autorisé à la recevoir.

---

# 12. SERVICES

Kanari est conçu pour coordonner plusieurs familles de services.

Parmi les domaines prévus :

- services à domicile et assistance ;
- travaux, entretien et réparation ;
- transport et mobilité ;
- développement professionnel ;
- livraison et logistique ;
- sécurité, gardiennage et surveillance ;
- services professionnels et entreprises ;
- réparation et dépannage ;
- éducation, formation et services coraniques ;
- produits, commerce et achats ;
- réservation, location et hébergement ;
- événementiel et loisirs ;
- beauté, bien-être et soins personnels ;
- restauration et alimentation ;
- agriculture, élevage et jardinage ;
- services numériques et création.

IMPORTANT :
Cette liste représente le périmètre métier prévu.
Ne pas supposer que chaque service est actuellement entièrement opérationnel.

Le code réel détermine ce qui est déjà implémenté.

---

# 13. PAIEMENT

Le paiement est une partie sensible.

Ne jamais modifier une logique de paiement sans analyser :
- frontend ;
- backend ;
- montants ;
- statuts ;
- validation ;
- historique ;
- éventuelles commissions ;
- sécurité ;
- intégrations externes.

Ne jamais simuler un paiement réel comme réussi.

Ne jamais considérer une transaction comme validée uniquement parce que le frontend l'indique.

---

# 14. NOTIFICATIONS

Analyser les notifications entre :
- client ;
- prestataire ;
- Kanari/admin.

Avant toute modification, rechercher tous les mécanismes existants :
- notifications ;
- messages ;
- événements ;
- emails ;
- WhatsApp ou autres intégrations éventuelles.

Ne pas inventer une intégration externe qui n'existe pas.

---

# 15. SÉCURITÉ

Toute modification doit prendre en compte :

- authentification ;
- autorisation ;
- contrôle des rôles ;
- validation des entrées ;
- protection des routes ;
- exposition des données ;
- secrets ;
- variables d'environnement ;
- fichiers uploadés ;
- accès base de données ;
- injections ;
- contrôle côté serveur.

NE JAMAIS afficher, révéler ou copier une clé API, un mot de passe, un token ou un secret.

Ne jamais mettre un secret directement dans le code.

Ne jamais committer les fichiers contenant des secrets.

---

# 16. PHASE D'AUDIT — PREMIÈRE MISSION

La première mission après chargement de ce fichier est un AUDIT.

IMPORTANT :

PENDANT LA PREMIÈRE PHASE D'AUDIT :
NE MODIFIE AUCUN FICHIER DU PROJET.

Tu dois uniquement :

1. lire ;
2. rechercher ;
3. analyser ;
4. comparer ;
5. tester avec des commandes non destructives si nécessaire ;
6. documenter.

Aucune modification du code.

---

# 17. AUDIT COMPLET

L'audit doit couvrir :

### A. Architecture
Identifier l'organisation réelle du projet.

### B. Frontend
Identifier :
- pages ;
- composants ;
- appels API ;
- erreurs ;
- fonctionnalités incomplètes.

### C. Backend
Identifier :
- routes ;
- contrôleurs ;
- services ;
- middleware ;
- erreurs ;
- logique métier.

### D. Base de données
Identifier :
- modèles ;
- relations ;
- incohérences ;
- données attendues.

### E. API
Comparer les attentes frontend et backend.

### F. Authentification
Vérifier :
- connexion ;
- inscription ;
- sessions/tokens ;
- rôles ;
- permissions.

### G. Réservations
Tester la cohérence de tout le cycle.

### H. Prestataires
Vérifier inscription, validation, association et utilisation.

### I. Missions
Vérifier création, attribution, suivi et clôture.

### J. Géolocalisation
Vérifier cohérence frontend/backend.

### K. Paiements
Vérifier la logique sans effectuer de transaction réelle.

### L. Administration
Vérifier les tableaux de bord et actions administratives.

### M. Déploiement
Examiner les fichiers de configuration et variables nécessaires.

---

# 18. CLASSIFICATION DES PROBLÈMES

Chaque problème trouvé doit être classé :

P0 — BLOQUANT
Empêche une fonction critique ou présente un risque majeur.

P1 — IMPORTANT
Doit être corrigé avant le lancement.

P2 — AMÉLIORATION
Important mais non bloquant.

P3 — FUTUR
Amélioration ou fonctionnalité future.

Pour chaque problème, indiquer :

- fichier(s) concerné(s) ;
- fonctionnalité concernée ;
- problème ;
- cause probable ;
- impact ;
- niveau P0/P1/P2/P3 ;
- recommandation.

---

# 19. RÈGLE DE CORRECTION

Après la phase d'audit, les corrections doivent être faites progressivement.

Avant chaque correction importante :

1. identifier les fichiers concernés ;
2. comprendre leurs dépendances ;
3. expliquer le problème ;
4. proposer la correction ;
5. appliquer la correction ;
6. lancer les tests appropriés ;
7. vérifier les erreurs ;
8. vérifier les régressions.

Privilégier les petits changements contrôlés.

---

# 20. APRÈS CHAQUE MODIFICATION

Après une modification :

- vérifier la syntaxe ;
- vérifier les imports ;
- vérifier les appels API ;
- vérifier les types lorsque disponibles ;
- vérifier les routes ;
- vérifier les composants concernés ;
- vérifier les tests ;
- vérifier que les fonctionnalités voisines fonctionnent toujours.

Si un test échoue à cause d'une modification :
CORRIGER LE PROBLÈME AVANT DE CONTINUER.

---

# 21. BASE DE DONNÉES

Toute modification de base de données doit être traitée comme une opération à risque.

Avant modification :
- identifier les dépendances ;
- vérifier les données existantes ;
- vérifier les migrations ;
- vérifier les modèles ;
- vérifier le backend ;
- vérifier le frontend.

Ne jamais supprimer des données de production.

Ne jamais exécuter une opération destructive sans autorisation explicite.

---

# 22. DÉPLOIEMENT

Le projet peut utiliser notamment :
- Vercel pour le frontend ;
- Render pour le backend ;
- MySQL/Aiven ou autre infrastructure selon la configuration actuelle.

Ces informations doivent être vérifiées dans les fichiers réels.

Ne jamais supposer qu'une URL, une variable d'environnement ou un service externe est encore valide sans vérification.

---

# 23. PROJECT-ANALYSIS.MD

Le projet contient un fichier :

project-analysis.md

Ce fichier constitue une analyse historique du projet.

Il doit être consulté pendant l'audit.

IMPORTANT :
Il ne doit pas être considéré comme une vérité absolue.

Comparer son contenu avec le code actuel.

Identifier :
- ce qui est toujours vrai ;
- ce qui a changé ;
- ce qui est obsolète ;
- ce qui manque.

---

# 24. NE PAS INVENTER

Si tu trouves une information absente du code et absente de la documentation :

NE PAS INVENTER.

Écrire clairement :

« Information non déterminée à partir du dépôt actuel. »

Puis proposer une question ou une hypothèse séparément.

---

# 25. OBJECTIF FINAL

L'objectif n'est pas de rendre le code artificiellement complexe.

L'objectif est d'obtenir une application Kanari :

- stable ;
- cohérente ;
- sécurisée ;
- maintenable ;
- fonctionnelle ;
- adaptée au terrain ;
- prête pour le lancement ;
- sans régression.

La priorité est la fiabilité réelle du produit.

---

# 26. COMPORTEMENT ATTENDU DE L'AGENT

Tu dois agir comme un ingénieur logiciel senior chargé d'un produit existant.

Tu dois être :
- méthodique ;
- prudent ;
- critique ;
- factuel ;
- transparent ;
- orienté tests ;
- orienté sécurité ;
- orienté production.

Tu ne dois jamais prétendre qu'une fonctionnalité fonctionne sans l'avoir vérifiée dans le code ou par un test approprié.

Tu ne dois jamais prétendre avoir effectué une action que tu n'as pas réellement effectuée.

Tu dois distinguer clairement :
- FAIT VÉRIFIÉ ;
- OBSERVATION ;
- HYPOTHÈSE ;
- RECOMMANDATION.

---

# 27. RÈGLE FINALE

KANARI EST UN PROJET EXISTANT.

NE LE RECONSTRUIS PAS.

COMPRENDS-LE.

AUDITE-LE.

IDENTIFIE LES PROBLÈMES.

PRÉSERVE CE QUI FONCTIONNE.

CORRIGE CE QUI EST INCORRECT.

TESTE TES CORRECTIONS.

VÉRIFIE LES RÉGRESSIONS.

ET SEULEMENT ENSUITE, AMÉLIORE LE PRODUIT.

FIN DES INSTRUCTIONS.
