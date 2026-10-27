# Déploiement MySafeBox sur Vercel + Firebase

## Configuration Firebase

1. **Créer un projet Firebase**

   - Allez sur [Firebase Console](https://console.firebase.google.com/)
   - Créez un nouveau projet
   - Activez Authentication (Email/Password)
   - Activez Storage

2. **Configuration Authentication**

   ```
   Authentication > Sign-in method > Email/Password > Activer
   ```

3. **Configuration Storage**

   ```
   Storage > Règles > Remplacer par :
   ```

   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /users/{userId}/{allPaths=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

4. **Récupérer la configuration**
   - Project Settings > General > Your apps > Web app
   - Copiez les valeurs de `firebaseConfig`

## Variables d'environnement Vercel

Dans votre projet Vercel, ajoutez ces variables d'environnement :

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Déploiement

1. **Connecter le repository à Vercel**

   - Importez votre projet GitHub dans Vercel
   - La configuration `vercel.json` sera automatiquement détectée

2. **Configuration automatique**

   - Framework: Vite (détecté automatiquement)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Variables d'environnement**
   - Ajoutez toutes les variables Firebase dans l'onglet "Environment Variables"
   - Pour chaque environnement : Production, Preview, Development

## Structure des données Firebase

Les fichiers sont organisés comme suit dans Firebase Storage :

```
users/
  ├── {userId}/
  │   ├── documents/
  │   ├── images/
  │   └── autres_fichiers...
```

Chaque utilisateur ne peut accéder qu'à ses propres fichiers grâce aux règles de sécurité.

## Fonctionnalités

✅ **Implémenté :**

- Authentification Firebase (connexion/inscription)
- Stockage Firebase Storage
- Upload de fichiers avec progress
- Navigation dans les dossiers
- Création de dossiers
- Suppression de fichiers/dossiers
- Téléchargement de fichiers
- Interface responsive
- Sécurité (isolation des données par utilisateur)

🚀 **Prêt pour la production !**
