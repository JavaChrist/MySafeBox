# MySafeBox - Coffre-fort numérique familial

Une application PWA sécurisée pour stocker et gérer vos fichiers confidentiels via WebDAV.

## 🚀 Fonctionnalités

- **Interface moderne** : Design responsive avec Tailwind CSS
- **Sécurité** : Authentification WebDAV et chiffrement HTTPS
- **Gestion des fichiers** : Upload, download, création de dossiers, suppression
- **PWA** : Installation possible sur mobile et desktop
- **Déconnexion automatique** : Sécurité par inactivité (15 minutes)
- **URL publique** : Accessible depuis n'importe où via https://app.mysafebox.fr
- **Détection réseau** : Indication Local (LAN) / Distant (WAN)

## 🛠️ Technologies utilisées

- **Frontend** : React 18 + TypeScript
- **Styling** : Tailwind CSS
- **Icons** : Lucide React
- **WebDAV** : Client WebDAV
- **Build** : Vite
- **PWA** : Service Worker et Web App Manifest
- **Déploiement** : Vercel

## 🌐 Déploiement sur Vercel

### Déploiement automatique

1. **Fork ce repository** sur GitHub

2. **Connecter à Vercel** :

   - Aller sur [vercel.com](https://vercel.com)
   - Importer le projet depuis GitHub
   - Configurer le domaine personnalisé

3. **Configuration automatique** :
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Framework: Vite

### Domaine personnalisé

Pour utiliser votre propre domaine :

1. Ajouter le domaine dans Vercel
2. Configurer les DNS vers Vercel
3. Modifier l'URL dans `src/config/environment.ts`

## ⚙️ Développement local

1. **Cloner le repository**

```bash
git clone <url-du-repo>
cd mysafebox
npm install
```

2. **Démarrer le développement**

```bash
npm run dev
```

3. **Build local**

```bash
npm run build
```

## 🔧 Configuration

### Changer l'URL cible

Modifiez dans `src/config/environment.ts` :

```typescript
export const CONFIG = {
  NAS_URL: "https://votre-domaine.com", // ← Changez ici
  // ...
};
```

### Service WebDAV compatible

L'application fonctionne avec :

- NAS Synology (WebDAV activé)
- Serveurs WebDAV personnalisés
- Services cloud compatibles WebDAV

## 📱 Installation PWA

L'application peut être installée comme une app native :

- **Desktop** : Icône d'installation dans la barre d'adresse
- **iPhone** : "Ajouter à l'écran d'accueil" dans Safari
- **Android** : "Installer l'application" dans Chrome

## 🔒 Sécurité

- ✅ Authentification WebDAV requise
- ✅ Communication HTTPS obligatoire
- ✅ Déconnexion automatique après 15 minutes d'inactivité
- ✅ Headers de sécurité configurés
- ✅ Pas de stockage des mots de passe côté client
- ✅ Détection des problèmes de certificat SSL

## 📂 Structure du projet

```
src/
├── components/         # Composants React
│   ├── ConnectionStatus.tsx  # Badge Local/Distant
│   ├── LoginForm.tsx        # Formulaire de connexion
│   └── Dashboard.tsx        # Interface principale
├── config/            # Configuration
│   └── environment.ts # URLs et détection réseau
├── services/          # Services API et WebDAV
└── types/             # Types TypeScript
```

## 🐛 Dépannage

### URL non accessible

- Vérifiez que le service WebDAV fonctionne
- Testez l'URL dans un navigateur
- Vérifiez les certificats SSL

### Erreur de connexion

- Badge 🏠 LAN : Problème réseau local
- Badge 🌐 WAN : Problème de connexion internet/DNS

### Authentification échouée

- Vérifiez les identifiants WebDAV
- Testez avec un client WebDAV externe

## 📄 Licence

MIT License

---

**MySafeBox** - Votre coffre-fort numérique accessible partout 🌐🔐
