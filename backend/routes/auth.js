const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// 🔐 POST /api/auth/register — inscription
router.post('/register', async (req, res) => {
  try {
    const { nom, email, password, telephone, ville, role } = req.body;

    // Vérifie si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création du user
    const user = await User.create({
      nom,
      email,
      password: hashedPassword,
      telephone,
      ville,
      role: role || 'utilisateur' // valeur par défaut si role non fourni
    });

    // Génération du token JWT
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // Réponse
    res.status(201).json({
      success: true,
      message: 'Inscription réussie - Incha Allah',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        telephone: user.telephone,
        ville: user.ville,
        adresse: user.adresse,
        avatar: user.avatar,
        verified: user.verified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// 🔐 POST /api/auth/login — connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifie si l'utilisateur existe
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Vérifie le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
    }

    // Génération du token
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // Réponse
    res.json({
      success: true,
      message: 'Connexion réussie - Incha Allah',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        telephone: user.telephone,
        ville: user.ville,
        adresse: user.adresse,
        avatar: user.avatar,
        verified: user.verified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// 🚨 Routes supplémentaires Auth (tu peux les ajouter ici)
router.post('/forgot-password', async (req, res) => {
  // Implémentation du mot de passe oublié
  res.status(501).json({ success: false, message: 'Non implémenté' });
});

router.post('/reset-password', async (req, res) => {
  // Implémentation du reset mot de passe
  res.status(501).json({ success: false, message: 'Non implémenté' });
});

module.exports = router;
