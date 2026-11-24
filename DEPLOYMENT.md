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

   Les règles sont dans `storage.rules` à la racine du dépôt. Elles n’autorisent chaque compte qu’à lire et écrire dans `users/{son identifiant}/`. Pour les publier avec un compte Firebase qui a accès au projet :

   ```bash
   firebase deploy --only storage --project <identifiant-du-projet>
   ```

   On peut aussi coller le contenu de `storage.rules` dans la console : Storage > Règles.

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

4. **Fonctions serveur**
   - Le dossier `api/` contient deux fonctions Vercel : `rename-storage` (renommage et déplacement) et `preview-text` (aperçu des fichiers texte).
   - Elles sont nécessaires, car Firebase empêche le navigateur de lire directement le contenu d’un fichier stocké.
   - `vercel.json` renvoie toutes les adresses vers `index.html`, sauf celles qui commencent par `/api/`.
   - Après un déploiement, vérifiez qu’un renommage et l’aperçu d’un fichier texte fonctionnent sur le site en ligne.

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

Implémenté :

- Authentification Firebase (connexion, inscription, « Se souvenir de moi », déconnexion après inactivité)
- Stockage Firebase Storage
- Envoi de fichiers avec progression réelle
- Navigation dans les dossiers
- Aperçu des fichiers dans l’application
- Renommage et déplacement de fichiers et de dossiers
- Création de dossiers
- Suppression de fichiers et de dossiers
- Téléchargement de fichiers
- Interface adaptée au téléphone
- Isolation des données par utilisateur (règles `storage.rules`)

Les limites connues sont décrites dans `README.md`.
