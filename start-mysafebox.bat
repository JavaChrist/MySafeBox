@echo off
echo.
echo 🚀 Démarrage MySafeBox avec URL publique
echo.

REM Configuration des variables d'environnement
set NAS_URL=https://app.mysafebox.fr
set REACT_APP_NAS_URL=https://app.mysafebox.fr

echo 🌐 URL configurée: %NAS_URL%
echo.

REM Démarrage du proxy avec la nouvelle URL
echo 📡 Démarrage du proxy WebDAV...
node server-proxy-working.cjs

pause