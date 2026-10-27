# 🤖 CONTEXTE RECONSTRUCTION - MySafeBox

## 🎯 MISSION

**RECONSTRUIRE ENTIÈREMENT MySafeBox depuis zéro avec seulement MYSAFEBOX-COMPLETE-SPECIFICATION.md**

## 📋 HISTORIQUE

- **Projet** : MySafeBox - Coffre-fort numérique familial PWA
- **Problème résolu** : Migration WebDAV → FileStation API Synology
- **État actuel** : Application fonctionnelle mais code à nettoyer
- **Objectif** : Reconstruction from scratch pour code propre

## 🏗️ ARCHITECTURE CIBLE

- **Frontend** : React 18 + TypeScript + Tailwind CSS
- **Icons** : Lucide React
- **Build** : Vite
- **PWA** : Service Worker + Manifest
- **Backend** : FileStation API Synology (REST)
- **Auth** : Comptes DSM existants (pas de création)
- **Storage** : /VaultsBackup/{username}/ sur NAS

## 🎨 DESIGN REQUIREMENTS

- **Theme** : Dark mode (bg-gray-900, text-white)
- **Responsive** : Mobile-first PWA
- **Colors** : blue-600 primary, green-500 success, red-500 error
- **Badge réseau** : 🏠 LAN / 🌐 WAN détection auto

## 🔧 FONCTIONNALITÉS CORE

1. **Login** : Username/password DSM + session 15min
2. **FileExplorer** : Navigate, upload, download, delete
3. **CreateFolder** : Nouveau dossier
4. **Upload** : Multi-files drag&drop avec progress
5. **PWA** : Installation mobile + offline cache
6. **NetworkDetection** : Badge Local/Distant automatique

## 📁 STRUCTURE ATTENDUE

```
src/
├── components/
│   ├── LoginForm.tsx
│   ├── Dashboard.tsx
│   ├── FileExplorer.tsx
│   ├── FileUpload.tsx
│   ├── Modal.tsx
│   ├── ConnectionStatus.tsx
│   └── InactivityWarning.tsx
├── services/
│   ├── api.ts
│   └── filestation-api.ts
├── config/
│   └── environment.ts
├── utils/
│   ├── fileHelpers.ts
│   └── useInactivityTimer.ts
├── types.ts
├── App.tsx
├── main.tsx
└── index.css
```

## 🌐 URLS CONFIGURATION

- **Production** : https://app.mysafebox.fr (NAS)
- **Local dev** : http://localhost:3000
- **Detection** : Auto via window.location.hostname patterns

## 🔌 SYNOLOGY INTEGRATION

- **Auth** : POST /webapi/auth.cgi (SYNO.API.Auth)
- **Files** : GET /webapi/entry.cgi (SYNO.FileStation.\*)
- **Upload** : FormData avec path, create_parents, overwrite
- **Isolation** : Chaque user → son dossier /VaultsBackup/{username}/

## 🚨 POINTS CRITIQUES

1. **Environment detection** : isLocalNetwork() vs isOnNAS()
2. **No proxy calls** en production (directement FileStation)
3. **PWA manifest** : standalone, background #111827
4. **Service Worker** : Cache-first static, Network-first API
5. **Types consistency** : User interface avec nasUrl

---

## 💬 INSTRUCTIONS POUR L'IA DE RECONSTRUCTION

**Tu as été chargé de reconstruire MySafeBox entièrement.**

**ÉTAPES :**

1. Lire MYSAFEBOX-COMPLETE-SPECIFICATION.md (référence COMPLÈTE)
2. Initialiser projet Vite + React + TypeScript
3. Installer dépendances du package.json spécifié
4. Créer structure de dossiers exacte
5. Implémenter composants un par un
6. Configurer PWA (manifest + service worker)
7. Tester build final

**PRIORITÉS :**

- Suivre EXACTEMENT les spécifications
- Code TypeScript strict
- Design Tailwind cohérent
- PWA fonctionnel
- Synology FileStation API

**L'utilisateur attend une reconstruction 95%+ automatique !**

---

## 🎯 SUCCESS CRITERIA

- ✅ npm run build fonctionne
- ✅ PWA installable sur mobile
- ✅ Login DSM fonctionnel
- ✅ Navigation fichiers/dossiers
- ✅ Upload multi-files
- ✅ Badge réseau Local/Distant
- ✅ Dark theme responsive
- ✅ 15min session timeout
