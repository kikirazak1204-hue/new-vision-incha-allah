const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 🔧 Génère un token JWT
const generateToken = (user) => {
    return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

// 📝 Inscription
exports.register = async (req, res) => {
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
            role: role || 'utilisateur' // valeur par défaut
        });

        // Génération du token JWT
        const token = generateToken(user);

        // Réponse
        res.status(201).json({
            success: true,
            message: 'Inscription réussie - Incha Allah',
            token,
            user: {
                id: user.id,
                nom: user.nom,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

// 🔐 Connexion
exports.login = async (req, res) => {
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
        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Connexion réussie - Incha Allah',
            token,
            user: {
                id: user.id,
                nom: user.nom,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

// 🚨 Ici tu peux ajouter d'autres routes Auth si besoin
// router.post('/forgot-password', ...);
// router.post('/reset-password', ...);
