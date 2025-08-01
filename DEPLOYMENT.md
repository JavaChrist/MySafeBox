# 🚀 Guide de déploiement MySafeBox sur Vercel

## Configuration actuelle

- **URL publique configurée** : `https://app.mysafebox.fr`
- **Détection automatique** : Local (LAN) vs Distant (WAN)
- **PWA complète** : iOS + Android + Desktop
- **Build prêt** : Compilation sans erreurs TypeScript ✅

## Déploiement sur Vercel

### 1. Préparation

```bash
# Build local pour vérifier
npm run build

# Doit afficher : ✓ built in X.XXs (sans erreurs)
```

### 2. Déploiement

1. **Push sur GitHub** (si pas encore fait)
2. **Connecter à Vercel** : Import depuis GitHub
3. **Configuration automatique** :
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 3. Configuration domaine

- **Domaine par défaut** : `votre-app.vercel.app`
- **Domaine personnalisé** : Configurer `app.mysafebox.fr`

## Fichiers critiques pour Vercel

### ✅ Présents et configurés

- `vercel.json` : Configuration SPA + headers sécurité
- `package.json` : Scripts de build
- `vite.config.ts` : Configuration Vite
- `index.html` : PWA headers + manifest
- `public/manifest.json` : Configuration PWA
- `public/favicon.ico` + logos : Icônes PWA

### ✅ Code nettoyé

- Erreurs TypeScript corrigées ✅
- Variables inutilisées supprimées ✅
- Imports obsolètes nettoyés ✅
- Fichiers documentation supprimés ✅

## Fonctionnalités post-déploiement

### Détection automatique

- 🏠 **LAN** : Utilisateur sur réseau local
- 🌐 **WAN** : Utilisateur distant via internet

### Gestion d'erreurs

- Certificat SSL invalide
- Service hors ligne
- Problèmes DNS
- Maintenance/surcharge

### PWA

- Installation sur iPhone (Safari)
- Installation sur Android (Chrome)
- Installation Desktop
- Mode offline basique

## Changer l'URL après déploiement

1. **Modifier** `src/config/environment.ts` :

```typescript
export const CONFIG = {
  NAS_URL: "https://nouveau-domaine.com",
  // ...
};
```

2. **Commit + Push** → Déploiement automatique Vercel

## Variables d'environnement (optionnel)

Si besoin de configuration dynamique :

```bash
# Dans Vercel Dashboard > Settings > Environment Variables
VITE_NAS_URL=https://app.mysafebox.fr
```

## Tests post-déploiement

### ✅ À vérifier

1. **Page de connexion** : Logo + badges LAN/WAN
2. **Authentification** : Test avec identifiants WebDAV
3. **Upload/Download** : Test fichiers
4. **PWA** : Installation mobile + desktop
5. **Inactivité** : Déconnexion auto après 15 min
6. **Erreurs** : Messages adaptés au contexte

### 🛠️ Debug

- **Console navigateur** : Erreurs JavaScript
- **Network tab** : Requêtes WebDAV
- **Vercel logs** : Erreurs build/runtime

## Statut actuel

- ✅ **Code prêt** : Compilation sans erreurs
- ✅ **Assets optimisés** : Images + favicon
- ✅ **Configuration Vercel** : `vercel.json` présent
- ✅ **PWA complète** : Manifest + icônes
- ✅ **Sécurité** : Headers + HTTPS
- ✅ **URL publique** : `app.mysafebox.fr` configurée

**🚀 Prêt pour le déploiement Vercel !**
