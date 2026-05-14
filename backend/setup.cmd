@echo off
setlocal enabledelayedexpansion

echo 🔧 Réorganisation sécurisée du projet New Vision...

:: 1. Création des dossiers si non existants
for %%D in (config models routes scripts) do (
    if not exist %%D (
        mkdir %%D
        echo 📁 Dossier créé : %%D
    ) else (
        echo 📁 Dossier déjà présent : %%D
    )
)

:: 2. Déplacement sécurisé des fichiers
call :moveIfSafe database.js config\database.js
call :moveIfSafe User.js models\User.js
call :moveIfSafe Fournisseur.js models\Fournisseur.js
call :moveIfSafe Produit.js models\Produit.js
call :moveIfSafe Commande.js models\Commande.js
call :moveIfSafe CommandeProduit.js models\CommandeProduit.js
call :moveIfSafe Facture.js models\Facture.js
call :moveIfSafe index.js models\index.js
call :moveIfSafe auth.js routes\auth.js
call :moveIfSafe users.js routes\users.js
call :moveIfSafe fournisseurs.js routes\fournisseurs.js
call :moveIfSafe produits.js routes\produits.js
call :moveIfSafe commandes.js routes\commandes.js
call :moveIfSafe commandeProduits.js routes\commandeProduits.js
call :moveIfSafe factures.js routes\factures.js
call :moveIfSafe setup-test.js scripts\setup-test.js

:: 3. Installation des dépendances
echo 📦 Installation des dépendances...
npm install

:: 4. Lancement du serveur
echo 🚀 Lancement du serveur New Vision...
npm run dev

goto :eof

:moveIfSafe
set "source=%~1"
set "target=%~2"
if exist "!source!" (
    if not exist "!target!" (
        move "!source!" "!target!" >nul
        echo ✅ Déplacé : !source! → !target!
    ) else (
        echo ⚠️  Déjà présent : !target! — déplacement ignoré
    )
) else (
    echo ⛔ Fichier introuvable : !source!
)
goto :eof
