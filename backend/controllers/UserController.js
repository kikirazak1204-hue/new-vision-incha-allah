const User = require('../models/User');

// 🔍 Obtenir tous les utilisateurs (admin)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

// 🔍 Obtenir un utilisateur par ID
exports.getUserById = async (req, res) => {
    try {
        if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé'
            });
        }

        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

// ✏️ Modifier un utilisateur
exports.updateUser = async (req, res) => {
    try {
        if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé'
            });
        }

        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Ne pas permettre de modifier le rôle sauf admin
        if (req.body.role && req.user.role !== 'admin') {
            delete req.body.role;
        }

        const updated = await user.update(req.body);

        const userResponse = updated.toJSON();
        delete userResponse.password;

        res.json({
            success: true,
            message: 'Profil mis à jour - Incha Allah',
            data: userResponse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour',
            error: error.message
        });
    }
};
