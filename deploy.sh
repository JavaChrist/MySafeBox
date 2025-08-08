#!/bin/bash

# Script de déploiement MySafeBox vers Vercel

echo "🚀 Déploiement MySafeBox vers Vercel..."

# Vérifier que les variables d'environnement sont configurées
if [ -z "$VITE_FIREBASE_API_KEY" ]; then
    echo "❌ Variables d'environnement Firebase manquantes!"
    echo "📖 Consultez DEPLOYMENT.md pour les instructions"
    exit 1
fi

# Build du projet
echo "📦 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build réussi!"
    
    # Déploiement avec Vercel CLI
    if command -v vercel &> /dev/null; then
        echo "🚀 Déploiement en cours..."
        vercel --prod
    else
        echo "📝 Pour déployer:"
        echo "1. Installez Vercel CLI: npm i -g vercel"
        echo "2. Connectez votre projet: vercel"
        echo "3. Déployez: vercel --prod"
    fi
else
    echo "❌ Erreur lors du build"
    exit 1
fi
