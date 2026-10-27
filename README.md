# MySafeBox

MySafeBox est un coffre-fort numérique personnel. Une personne crée un compte avec son adresse e-mail, puis dépose, classe, retrouve, télécharge et supprime ses propres fichiers depuis un navigateur, sur ordinateur ou sur téléphone.

L’application s’adresse à toute personne qui souhaite un espace en ligne réservé à son compte. Le code ne prévoit ni partage entre plusieurs personnes, ni espace familial commun, ni offre payante.

## Fonctionnalités

### Opérationnelles

Ces parcours sont branchés dans les écrans et appellent Firebase.

- **Compte.** Inscription avec nom, e-mail et mot de passe (6 caractères minimum), connexion, déconnexion, et envoi d’un e-mail de réinitialisation du mot de passe.
- **Session.** L’option « Se souvenir de moi » conserve la session sur l’appareil. Sans cette option, la session dure le temps du navigateur.
- **Espace personnel.** Les fichiers sont enregistrés dans Firebase Storage, dans un dossier propre à chaque compte (`users/{identifiant}/`).
- **Consultation.** Liste du dossier courant, ouverture des sous-dossiers, fil d’Ariane, retour au dossier précédent, retour à la racine et actualisation.
- **Recherche.** Filtre les noms du dossier ouvert. Elle ne parcourt pas les autres dossiers.
- **Affichage.** Grille ou liste. En liste, tri par nom, taille ou date. Les dossiers apparaissent avant les fichiers.
- **Envoi.** Sélection d’un ou plusieurs fichiers, y compris via le sélecteur de fichiers d’Android Chrome lorsque le navigateur le propose. Un fichier de plus de 100 Mo est refusé par le service.
- **Dossiers.** Création d’un dossier après saisie de son nom, dans une fenêtre de l’application.
- **Téléchargement.** Depuis la barre du bas, pour un seul élément sélectionné qui est un fichier.
- **Suppression.** Un ou plusieurs éléments sélectionnés, après confirmation dans une fenêtre de l’application. Le message prévient que le contenu d’un dossier part avec lui.
- **Téléphone.** L’interface s’adapte au petit écran. Un manifeste permet de l’ajouter à l’écran d’accueil. En version construite pour la production, un service worker est enregistré et un bouton « Mettre à jour » apparaît lorsqu’une nouvelle version est prête.
- **Repère d’environnement.** Un badge indique « DEV » pendant le développement local et « CLOUD » dans une version de production. Il reflète le mode de construction, pas un test de connexion réel.

### Partielles

- **Avertissement d’inactivité.** Au bout de 14 minutes sans clic, frappe, défilement ou toucher, une fenêtre propose de rester connecté ou de se déconnecter. Aucun minuteur ne coupe ensuite la session tout seul.
- **Fermeture de l’onglet sur ordinateur.** L’application tente une déconnexion. Les navigateurs n’attendent en général pas la fin de cette opération. Rien n’est tenté sur téléphone.
- **Téléchargement groupé.** Le bouton est disponible seulement lorsqu’un seul fichier est sélectionné.
- **Suppression des dossiers.** Le service distingue un fichier d’un dossier selon la présence d’un point dans le nom. Un fichier sans extension peut donc être traité comme un dossier, et l’inverse est possible. Le parcours des sous-dossiers imbriqués s’arrête à un niveau supplémentaire.
- **Échecs peu visibles.** L’envoi, la création d’un dossier et la suppression peuvent échouer sans message à l’écran, car le service avale souvent l’erreur au lieu de la transmettre.
- **Date des dossiers.** La date affichée pour un dossier est le moment où la liste est chargée, pas une date d’enregistrement.
- **Types de fichiers.** Une liste de types autorisés existe dans la configuration, mais l’envoi ne l’applique pas. Seule la limite de 100 Mo est contrôlée.
- **Installation sur téléphone.** Le manifeste et les balises d’installation sont en place. Les images citées (`MySafeBoxHeader.png`, `MySafeBox.png`, `logo-180.png`, `logo-192.png`, `logo-512.png`, `favicon.ico`) sont absentes du dossier `public`.
- **Mise en cache hors ligne.** Le service worker prévoit une mise en cache, puis efface tous les caches au moment de son activation. Le fonctionnement hors ligne n’est donc pas fiable.
- **Nom affiché et espace occupé.** Le code sait mettre à jour le nom du compte et calculer le volume utilisé. Aucun écran ne propose ces actions.

### Simulées

- **Progression de l’envoi.** La barre avance fichier par fichier. Pour chaque fichier, le pourcentage passe à 100 % une fois le transfert terminé. Il n’y a pas de mesure pendant le transfert.

### Prévues dans le code, pas encore reliées à un comportement utile

- Suivi réel de l’envoi pendant le transfert (commentaire dans le service de stockage).
- Boutons Télécharger et Supprimer de chaque ligne en vue liste : ils sont affichés, et leurs actions sont vides.
- Fenêtre d’envoi : un état est prévu, mais aucun écran ne s’ouvre. L’envoi passe par le sélecteur de fichiers.

### Présentes dans le dépôt, non utilisées par l’application actuelle

D’anciens documents (`MYSAFEBOX-COMPLETE-SPECIFICATION.md`, `RECONSTRUCTION-CONTEXT.md`, `DEBUG-PRODUCTION-DEMAIN.md`, `EMAIL-GUIDE-MYSAFEBOX.md`) décrivent un coffre-fort familial relié à un NAS Synology et à son API FileStation. Le code des écrans et des services n’appelle plus cette API.

Il en reste des traces : le nom du fichier `filestation-api.ts`, un type de compte WebDAV non utilisé, un proxy de développement local, la description « NAS Synology » dans la page d’accueil et le manifeste, et des commentaires du service worker. Ces traces ne constituent pas une fonction disponible.

## Stack

- Interface : React 19 et TypeScript
- Construction et serveur local : Vite 7
- Styles : Tailwind CSS 3
- Icônes : Lucide React
- Compte et fichiers : Firebase Authentication et Firebase Storage
- Hébergement prévu : Vercel (`vercel.json`, script `deploy.sh`)

Le fichier `package.json` indique la version `0.0.0`. Une version `1.0.0` est écrite dans la configuration, mais elle n’est affichée nulle part.

## Installation

Prérequis : Node.js 20.19 ou plus récent, ou Node.js 22.12 ou plus récent, ainsi que npm. Ce besoin vient de Vite 7. Le dépôt ne fixe pas lui-même de version de Node.js.

```bash
npm install
```

Créer un fichier `.env` à la racine, puis renseigner les variables listées ci-dessous. Aucun fichier d’exemple n’est fourni dans le dépôt.

Lancer l’application en local :

```bash
npm run dev
```

Le serveur de développement écoute sur `http://127.0.0.1:5173`.

## Configuration

Les valeurs sont lues au démarrage par Vite. Elles se règlent dans le projet Firebase (Authentication par e-mail et mot de passe, Storage) puis dans l’environnement local ou dans les variables d’environnement de Vercel.

| Variable | Rôle |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Clé de l’application web Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domaine d’authentification |
| `VITE_FIREBASE_PROJECT_ID` | Identifiant du projet |
| `VITE_FIREBASE_STORAGE_BUCKET` | Emplacement de stockage des fichiers |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Identifiant d’expéditeur |
| `VITE_FIREBASE_APP_ID` | Identifiant de l’application web |

`DEPLOYMENT.md` décrit aussi des règles Storage à coller dans la console Firebase, pour qu’un compte ne lise et n’écrive que son propre dossier. Ces règles ne sont pas versionnées dans ce dépôt : leur présence réelle sur le projet Firebase est à confirmer. Sans elles, le préfixe de dossier côté navigateur ne suffit pas à isoler les comptes.

## Commandes utiles

| Commande | Effet |
| --- | --- |
| `npm run dev` | Démarre l’application en local |
| `npm run build` | Vérifie TypeScript puis construit le site dans `dist` |
| `npm run preview` | Sert localement le dossier `dist` |
| `npm run lint` | Lance ESLint |
| `bash deploy.sh` | Construit le site puis lance un déploiement Vercel de production si la clé Firebase est présente dans l’environnement |

Le script `deploy.sh` et le fichier `vercel.json` préparent un hébergement. Leur présence ne signifie pas qu’un site est en ligne.

## Adresse du site

À confirmer. Le code actuel ne contient pas d’adresse de production. D’anciens documents citent `https://mysafebox.fr` et `https://app.mysafebox.fr` pour la version NAS. Ces adresses ne sont pas vérifiées pour l’application Firebase actuelle.

## Documents du dépôt

- `FICHE_IDENTITE.md` : présentation courte de l’application.
- `DEPLOYMENT.md` : mise en place Firebase et Vercel. Il annonce l’application prête pour la production ; le code comporte encore les limites décrites plus haut.
- `MYSAFEBOX-COMPLETE-SPECIFICATION.md`, `RECONSTRUCTION-CONTEXT.md`, `DEBUG-PRODUCTION-DEMAIN.md` et `EMAIL-GUIDE-MYSAFEBOX.md` : documents de l’ancienne version NAS. Ils ne décrivent pas le comportement du code actuel.
