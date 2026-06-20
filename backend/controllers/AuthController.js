const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 🔧 Génère un token JWT avec protection
const generateToken = (user) => {
    // Vérification de sécurité pour le secret
    if (!process.env.JWT_SECRET) {
        console.error("❌ CRITIQUE : JWT_SECRET est manquant dans le fichier .env");
        throw new Error("Configuration serveur incomplète");
    }

    return jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// 📝 Inscription
exports.register = async (req, res) => {
    try {
        const { nom, email, password, telephone, ville, role } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            nom,
            email,
            password: hashedPassword,
            telephone,
            ville,
            role: role || 'utilisateur'
        });

        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'Inscription réussie - Incha Allah',
            token,
            user: { id: user.id, nom: user.nom, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error("DEBUG REGISTER ERROR:", error);
        res.status(500).json({ success: false, message: 'Erreur serveur lors de l\'inscription', error: error.message });
    }
};

// 🔐 Connexion
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Tentative de connexion pour:", email);

        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.log("Échec : Utilisateur non trouvé");
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("Échec : Mot de passe incorrect");
            return res.status(401).json({ success: false, message: 'Mot de passe incorrect' });
        }

        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Connexion réussie - Incha Allah',
            token,
            user: { id: user.id, nom: user.nom, email: user.email, role: user.role }
        });
    } catch (error) {
        // CE LOG APPARAÎTRA DANS VOTRE TERMINAL BACKEND
        console.error("--- ERREUR CRITIQUE LOGIN ---");
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};