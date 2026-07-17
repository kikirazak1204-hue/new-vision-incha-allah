const multer = require('multer');
const path = require('path');

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Assure-toi que ce dossier existe à la racine
    },
    filename: (req, file, cb) => {
        // Renomme le fichier avec un timestamp pour éviter les doublons
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Le middleware, SANS AUCUN FILTRE (accepte tout)
const upload = multer({ storage: storage });

module.exports = upload;