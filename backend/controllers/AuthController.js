const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Rôles qu'un utilisateur peut légitimement choisir lui-même à
// l'inscription. 'admin' est volontairement ABSENT de cette liste — un
// compte admin ne doit jamais pouvoir être créé via ce formulaire public.
// Il doit être créé manuellement (script, accès direct base de données,
// ou un futur écran "promouvoir un utilisateur" réservé aux SUPER_ADMIN).
const ROLES_AUTORISES_A_LINSCRIPTION = ['utilisateur', 'fournisseur'];

// 🔧 Génère un token JWT avec protection
const generateToken = (user) => {
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

        // ✅ CORRIGÉ : le rôle demandé n'est accepté QUE s'il fait partie de
        // la liste blanche. Avant, n'importe quelle valeur (y compris
        // 'admin') envoyée dans le corps de la requête était acceptée
        // telle quelle — n'importe qui pouvait s'inscrire directement en
        // tant qu'administrateur.
        const roleDemande = ROLES_AUTORISES_A_LINSCRIPTION.includes(role) ? role : 'utilisateur';

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            nom,
            email,
            password: hashedPassword,
            telephone,
            ville,
            role: roleDemande
        });

        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'Inscription réussie - Incha Allah',
            token,
            user: { id: user.id, nom: user.nom, email: user.email, role: user.role, telephone: user.telephone, ville: user.ville }
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
            user: { id: user.id, nom: user.nom, email: user.email, role: user.role, telephone: user.telephone, ville: user.ville }
        });
    } catch (error) {
        console.error("--- ERREUR CRITIQUE LOGIN ---");
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};