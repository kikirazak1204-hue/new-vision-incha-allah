const jwt = require('jsonwebtoken');
const { User } = require('../models');

// 🔐 Middleware pour vérifier le token JWT
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Accès refusé : token manquant' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        // ✅ On expose toutes les infos utiles dans req.user
        req.user = {
            id: user.id,
            role: user.role,
            nom: user.nom,
            email: user.email,
            telephone: user.telephone,
            ville: user.ville,
            avatar: user.avatar,
            verified: user.verified
        };

        next();
    } catch (error) {
        console.error('Erreur vérification token:', error);
        return res.status(401).json({ success: false, message: 'Token invalide', error: error.message });
    }
};

// ➕ AJOUT : authentification OPTIONNELLE.
// Remplit req.user si un token valide est présent ; sinon la requête
// continue comme visiteur (route publique), sans jamais renvoyer d'erreur.
const optionalProtect = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (header && header.startsWith('Bearer')) {
            const token = header.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.id);
            if (user) {
                req.user = {
                    id: user.id,
                    role: user.role,
                    nom: user.nom,
                    email: user.email,
                    telephone: user.telephone,
                    ville: user.ville,
                    avatar: user.avatar,
                    verified: user.verified
                };
            }
        }
    } catch (err) {
        // Token invalide ou expiré : on continue en visiteur
    }
    next();
};

// 🔐 Middleware pour vérifier les rôles autorisés
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Accès interdit : rôle non autorisé' });
        }
        next();
    };
};

// Alias pratique pour les routes admin-only
const adminOnly = authorize('admin');

// ✏️ MODIFIÉ : optionalProtect ajouté à l'export
module.exports = { protect, optionalProtect, authorize, adminOnly };