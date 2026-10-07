const User = require('../models/User'); // Ou require('../models').User selon ton architecture
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize'); // 👈 NOUVEAU : Import nécessaire pour la recherche multiple (OR)

// Rôles qu'un utilisateur peut légitimement choisir lui-même à
// l'inscription. 'admin' est volontairement ABSENT de cette liste.
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

        // ✅ CORRIGÉ : On vérifie si l'email OU le téléphone est déjà utilisé
        const existingUser = await User.findOne({ 
            where: { 
                [Op.or]: [
                    { email: email },
                    { telephone: telephone }
                ]
            } 
        });

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email ou numéro de téléphone déjà utilisé' });
        }

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
        // ✅ NOUVEAU : On récupère l'"identifiant" global (email ou num)
        const { identifiant, password } = req.body;
        console.log("Tentative de connexion pour:", identifiant);

        if (!identifiant || !password) {
             return res.status(400).json({ success: false, message: 'Veuillez fournir un identifiant et un mot de passe.' });
        }

        // ✅ NOUVEAU : Recherche par email OU par téléphone
        const user = await User.findOne({ 
            where: { 
                [Op.or]: [
                    { email: identifiant },
                    { telephone: identifiant }
                ]
            } 
        });

        // 🛡️ SÉCURITÉ : Message générique
        if (!user) {
            console.log("Échec : Utilisateur non trouvé");
            return res.status(401).json({ success: false, message: 'Identifiants incorrects.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        // 🛡️ SÉCURITÉ : Message générique
        if (!isMatch) {
            console.log("Échec : Mot de passe incorrect");
            return res.status(401).json({ success: false, message: 'Identifiants incorrects.' });
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