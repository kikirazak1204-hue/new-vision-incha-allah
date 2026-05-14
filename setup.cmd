@echo off
setlocal enabledelayedexpansion

:: Définir les chemins
set "PROJECT=%~dp0"
set "FRONT=%PROJECT%frontend"
set "BACK=%PROJECT%backend"

:: Créer la structure du projet
echo 📁 Création du projet...
mkdir "%FRONT%"
mkdir "%BACK%"
mkdir "%FRONT%\src"
mkdir "%FRONT%\src\pages"
mkdir "%FRONT%\src\components"
mkdir "%FRONT%\public"
mkdir "%FRONT%\public\images"
mkdir "%FRONT%\public\backgrounds"
mkdir "%BACK%\routes"

:: Initialiser le frontend
cd /d "%FRONT%"
call npx create-react-app . --template cra-template
call npm install -D tailwindcss postcss autoprefixer
call npx tailwindcss init -p

:: Surcharger tailwind.config.js
(
echo /** @type {import('tailwindcss').Config} */
echo module.exports = {
echo   content: ["./src/**/*.{js,jsx,ts,tsx}"],
echo   theme: {
echo     extend: {},
echo   },
echo   plugins: [],
echo };
) > tailwind.config.js

:: Créer les fichiers frontend
echo 📄 Génération des fichiers frontend...
cd src

:: App.jsx
(
echo import React from 'react';
echo import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
echo import Home from './pages/Home';
echo import Login from './pages/Login';
echo import Register from './pages/Register';
echo import Fournisseurs from './pages/Fournisseurs';
echo import DashboardFournisseur from './pages/DashboardFournisseur';
echo import Header from './components/Header';
echo import Footer from './components/Footer';
echo import BackgroundRotator from './components/BackgroundRotator';
echo.
echo function App() {
echo   return (
echo     ^<Router^>
echo       ^<div className="relative min-h-screen bg-gray-100 overflow-hidden"^>
echo         ^<BackgroundRotator /^>
echo         ^<Header /^>
echo         ^<Routes^>
echo           ^<Route path="/" element={^<Home /^>} /^>
echo           ^<Route path="/login" element={^<Login /^>} /^>
echo           ^<Route path="/register" element={^<Register /^>} /^>
echo           ^<Route path="/fournisseurs" element={^<Fournisseurs /^>} /^>
echo           ^<Route path="/dashboard" element={^<DashboardFournisseur /^>} /^>
echo         ^</Routes^>
echo         ^<Footer /^>
echo       ^</div^>
echo     ^</Router^>
echo   );
echo }
echo.
echo export default App;
) > App.jsx

:: index.js
(
echo import React from 'react';
echo import ReactDOM from 'react-dom/client';
echo import './index.css';
echo import App from './App';
echo.
echo const root = ReactDOM.createRoot(document.getElementById('root'));
echo root.render(
echo   ^<React.StrictMode^>
echo     ^<App /^>
echo   ^</React.StrictMode^>
echo );
) > index.js

:: index.css
(
echo @tailwind base;
echo @tailwind components;
echo @tailwind utilities;
) > index.css

:: api.js
(
echo import axios from 'axios';
echo.
echo const api = axios.create({
echo   baseURL: 'http://localhost:5000/api',
echo   withCredentials: true,
echo });
echo.
echo export default api;
) > api.js

:: Pages
(
echo import React from 'react';
echo const Login = () => ^<div className="p-4"^>Login Page^</div^>;
echo export default Login;
) > pages\Login.jsx

(
echo import React from 'react';
echo const Register = () => ^<div className="p-4"^>Register Page^</div^>;
echo export default Register;
) > pages\Register.jsx

(
echo import React from 'react';
echo const Home = () => ^<div className="p-4"^>Welcome to New Life^</div^>;
echo export default Home;
) > pages\Home.jsx

(
echo import React from 'react';
echo const Fournisseurs = () => ^<div className="p-4"^>Liste des fournisseurs^</div^>;
echo export default Fournisseurs;
) > pages\Fournisseurs.jsx

(
echo import React from 'react';
echo const DashboardFournisseur = () => ^<div className="p-4"^>Dashboard Fournisseur^</div^>;
echo export default DashboardFournisseur;
) > pages\DashboardFournisseur.jsx

:: Composants
(
echo import React from 'react';
echo const Header = () => ^<header className="bg-blue-600 text-white p-4"^>New Life Platform^</header^>;
echo export default Header;
) > components\Header.jsx

(
echo import React from 'react';
echo const Footer = () => ^<footer className="bg-gray-800 text-white p-4 mt-auto"^>© 2025 New Life^</footer^>;
echo export default Footer;
) > components\Footer.jsx

(
echo import React, { useEffect, useState } from 'react';
echo const images = ['bg1.jpg', 'bg2.jpg', 'bg3.jpg'];
echo const BackgroundRotator = () => {
echo   const [index, setIndex] = useState(0);
echo   useEffect(() => {
echo     const interval = setInterval(() => {
echo       setIndex((index + 1) %% images.length);
echo     }, 5000);
echo     return () => clearInterval(interval);
echo   }, [index]);
echo   return ^<img src={`/images/${images[index]}`} className="absolute top-0 left-0 w-full h-full object-cover -z-10" /^>;
echo };
echo export default BackgroundRotator;
) > components\BackgroundRotator.jsx

:: Backend
cd /d "%BACK%"
(
echo const express = require('express');
echo const cors = require('cors');
echo const dotenv = require('dotenv');
echo const authRoutes = require('./routes/auth');
echo const fournisseurRoutes = require('./routes/fournisseurs');
echo.
echo dotenv.config();
echo const app = express();
echo app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
echo app.use(express.json());
echo.
echo app.use('/api/auth', authRoutes);
echo app.use('/api/fournisseurs', fournisseurRoutes);
echo.
echo app.listen(5000, () => console.log('✅ Backend lancé sur le port 5000'));
) > server.js

(
echo const mysql = require('mysql2');
echo const db = mysql.createConnection({
echo   host: 'localhost',
echo   user: 'root',
echo   password: '',
echo   database: 'newlife'
echo });
echo module.exports = db;
) > db.js

(
echo DB_HOST=localhost
echo DB_USER=root
echo DB_PASSWORD=
echo DB_NAME=newlife
echo JWT_SECRET=inchaallahsecret
) > .env

(
echo const express = require('express');
echo const router = express.Router();
echo router.post('/login', (req, res) => {
echo   res.json({ message: 'Login OK' });
echo });
echo module.exports = router;
) > routes\auth.js

(
echo const express = require('express');
echo const router = express.Router();
echo router.get('/', (req, res) => {
echo   res.json([{ id: 1, nom: 'Fournisseur A' }]);
echo });
echo module.exports = router;
) > routes\fournisseurs.js
