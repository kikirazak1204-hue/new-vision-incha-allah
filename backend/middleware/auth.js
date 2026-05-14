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
            telephone: user.telephone,   // ajouté
            ville: user.ville,           // ajouté
            avatar: user.avatar,         // optionnel
            verified: user.verified      // optionnel
        };

        next();
    } catch (error) {
        console.error('Erreur vérification token:', error);
        return res.status(401).json({ success: false, message: 'Token invalide', error: error.message });
    }
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

module.exports = { protect, authorize };
