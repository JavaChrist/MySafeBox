# MySafeBox

MySafeBox est un coffre-fort numérique personnel. Une personne crée un compte avec son adresse e-mail, puis dépose, classe, consulte, renomme, déplace, télécharge et supprime ses propres fichiers depuis un navigateur, sur ordinateur ou sur téléphone.

L’application s’adresse à toute personne qui souhaite un espace en ligne réservé à son compte. Le code ne prévoit ni partage entre plusieurs personnes, ni espace familial commun, ni offre payante.

## Fonctionnalités

### Opérationnelles

Ces parcours sont branchés dans les écrans et appellent Firebase.

- **Compte.** Inscription avec nom, e-mail et mot de passe (6 caractères minimum), connexion, déconnexion, et envoi d’un e-mail de réinitialisation du mot de passe.
- **Session.** Avec « Se souvenir de moi », la session reste ouverte après la fermeture du navigateur et l’e-mail est prérempli à la connexion suivante. Sans cette option, la session se termine à la fermeture du navigateur. Un rechargement de la page ne déconnecte pas.
- **Inactivité.** Au bout de 14 minutes sans clic, frappe, défilement ou toucher, une fenêtre affiche un compte à rebours de 60 secondes. Sans réponse, la session se ferme. « Rester connecté » relance le délai.
- **Espace personnel.** Les fichiers sont enregistrés dans Firebase Storage, dans un dossier propre à chaque compte (`users/{identifiant}/`). Les règles de `storage.rules`, publiées sur le projet Firebase, n’autorisent chaque compte qu’à lire et écrire dans son propre dossier.
- **Consultation.** Liste du dossier courant, ouverture des sous-dossiers, fil d’Ariane, retour au dossier précédent, retour à la racine et actualisation.
- **Aperçu.** Un clic sur un fichier l’ouvre dans l’application, sans téléchargement : images, PDF, vidéos, sons, fichiers texte (texte brut, Markdown, JSON, CSV, code…), documents Word `.docx` et classeurs Excel `.xlsx`. Un document Word garde sa mise en page ; un classeur s’affiche feuille par feuille, sous forme de tableau, sans les feuilles masquées. Limites : 2 Mo pour un texte, 4 Mo pour un document Word, 20 Mo pour un classeur dont seules les 500 premières lignes et 50 premières colonnes de chaque feuille sont montrées. Les anciens formats `.doc`, `.xls` et `.ppt` ne sont pas affichés ; la fenêtre propose alors de les télécharger.
- **Renommage.** Un fichier ou un dossier, avec tout son contenu, prend un nouveau nom au même endroit. Le nom est refusé s’il est vide, s’il contient une barre oblique ou s’il est déjà pris.
- **Déplacement.** Un fichier ou un dossier part vers un autre dossier choisi dans une fenêtre de navigation. Un dossier ne peut pas être déplacé dans lui-même.
- **Recherche.** Filtre les noms du dossier ouvert. Elle ne parcourt pas les autres dossiers.
- **Affichage.** Grille ou liste. En liste, tri par nom, taille ou date, et boutons Aperçu, Renommer, Déplacer, Télécharger et Supprimer sur chaque ligne. Les dossiers apparaissent avant les fichiers.
- **Envoi.** Sélection d’un ou plusieurs fichiers, y compris via le sélecteur de fichiers d’Android Chrome lorsque le navigateur le propose. La barre de progression suit le transfert réel. Un fichier de plus de 100 Mo est refusé, et la raison d’un échec s’affiche à l’écran.
- **Dossiers.** Création d’un dossier après saisie de son nom, dans une fenêtre de l’application.
- **Téléchargement.** Depuis l’aperçu, depuis la ligne d’un fichier en vue liste, ou depuis la barre du bas pour un seul fichier sélectionné.
- **Suppression.** Un ou plusieurs éléments sélectionnés, après confirmation dans une fenêtre de l’application. Le message prévient que le contenu d’un dossier part avec lui.
- **Téléphone.** L’interface s’adapte au petit écran. Un manifeste et ses icônes permettent de l’ajouter à l’écran d’accueil. En version construite pour la production, un service worker est enregistré.
- **Mises à jour.** Chaque construction reçoit un numéro de version, inscrit dans `sw.js` et publié dans `/version.json`. L’application le vérifie à l’ouverture, au retour sur l’onglet, puis chaque minute. Quand un nouveau déploiement est en ligne, une fenêtre propose « Mettre à jour » ou « Plus tard », sur l’écran de connexion comme dans le coffre. La nouvelle version n’est activée qu’après un clic sur « Mettre à jour », suivi d’un rechargement de la page. « Plus tard » est mémorisé jusqu’à la fermeture de l’onglet ou jusqu’à la version suivante.
- **Repère d’environnement.** Un badge indique « DEV » pendant le développement local et « CLOUD » dans une version de production. Il reflète le mode de construction, pas un test de connexion réel.

### Partielles

- **Téléchargement groupé.** Le bouton est disponible seulement lorsqu’un seul fichier est sélectionné.
- **Suppression des dossiers.** Le service distingue un fichier d’un dossier selon la présence d’un point dans le nom. Un fichier sans extension peut donc être traité comme un dossier, et l’inverse est possible. Le parcours des sous-dossiers imbriqués s’arrête à un niveau supplémentaire.
- **Échecs de création et de suppression.** La création d’un dossier et la suppression signalent seulement un échec, sans en donner la raison.
- **Renommage et déplacement de gros contenus.** L’opération recopie chaque fichier puis retire l’original. Un dossier volumineux peut prendre du temps, et chaque fichier est limité à 100 Mo.
- **Date des dossiers.** La date affichée pour un dossier est le moment où la liste est chargée, pas une date d’enregistrement.
- **Types de fichiers.** Une liste de types autorisés existe dans la configuration, mais l’envoi ne l’applique pas. Seule la limite de 100 Mo est contrôlée.
- **Hors ligne.** Sans connexion, seule la page de l’application et ses icônes restent disponibles depuis le cache. Les fichiers du coffre, eux, ne sont jamais mis en cache et demandent une connexion.
- **Nom affiché et espace occupé.** Le code sait mettre à jour le nom du compte et calculer le volume utilisé. Aucun écran ne propose ces actions.

### Présentes dans le dépôt, non utilisées par l’application actuelle

D’anciens documents (`MYSAFEBOX-COMPLETE-SPECIFICATION.md`, `RECONSTRUCTION-CONTEXT.md`, `DEBUG-PRODUCTION-DEMAIN.md`, `EMAIL-GUIDE-MYSAFEBOX.md`) décrivent un coffre-fort familial relié à un NAS Synology et à son API FileStation. Le code des écrans et des services n’appelle plus cette API.

Il en reste des traces : le nom du fichier `filestation-api.ts`, un type de compte WebDAV non utilisé, un proxy de développement local, et la description « NAS Synology » dans la page d’accueil et le manifeste. Ces traces ne constituent pas une fonction disponible.

## Fonctionnement côté serveur

Firebase empêche le navigateur de lire directement le contenu d’un fichier déjà stocké. Plusieurs opérations passent donc par un petit serveur :

| Adresse | Rôle | En local | En ligne |
| --- | --- | --- | --- |
| `/api/rename-storage` | Recopie un fichier sous un nouveau chemin (renommage et déplacement) | Serveur Vite (`vite.config.ts`) | Fonction Vercel `api/rename-storage.js` |
| `/api/preview-text` | Lit un fichier texte pour l’aperçu | Serveur Vite (`vite.config.ts`) | Fonction Vercel `api/preview-text.js` |
| `/api/preview-docx` | Renvoie un document Word, affiché ensuite dans le navigateur par `docx-preview` | Serveur Vite (`vite.config.ts`) | Fonction Vercel `api/preview-docx.js` |
| `/api/preview-sheet` | Lit un classeur Excel avec `exceljs` et renvoie le contenu des feuilles | Serveur Vite (`vite.config.ts`) | Fonction Vercel `api/preview-sheet.js` |

Aucun service extérieur n’intervient dans l’aperçu des documents Office. La limite de 4 Mo pour Word vient de la taille maximale d’une réponse de fonction Vercel.

La logique commune est dans le dossier `server/`. Le serveur n’accepte que des chemins sous `users/` et des adresses de téléchargement Firebase correspondant au fichier demandé. L’écriture se fait avec la session de la personne connectée, donc les règles Storage s’appliquent.

Un hébergement purement statique (sans fonctions) affiche les images, PDF, vidéos et sons, mais le renommage, le déplacement et l’aperçu des fichiers texte, Word et Excel y échouent.

## Stack

- Interface : React 19 et TypeScript
- Construction et serveur local : Vite 7
- Styles : Tailwind CSS 3
- Icônes : Lucide React
- Compte et fichiers : Firebase Authentication et Firebase Storage
- Fonctions serveur : Node.js (Vercel Functions en ligne, serveur Vite en local)
- Hébergement prévu : Vercel (`vercel.json`, script `deploy.sh`)

Le fichier `package.json` indique la version `0.0.0`. Une version `1.0.0` est écrite dans la configuration, mais elle n’est affichée nulle part.

## Installation

Prérequis : Node.js 20.19 ou plus récent, ou Node.js 22.12 ou plus récent, ainsi que npm. Ce besoin vient de Vite 7. Le dépôt ne fixe pas lui-même de version de Node.js.

```bash
npm install
```

Créer un fichier `.env.local` à la racine, puis renseigner les variables listées ci-dessous. Aucun fichier d’exemple n’est fourni dans le dépôt.

Lancer l’application en local :

```bash
npm run dev
```

Le serveur de développement écoute sur `http://127.0.0.1:5173`. Il sert aussi les deux adresses `/api` décrites plus haut.

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

### Règles Storage

Les règles sont versionnées dans `storage.rules` et déclarées dans `firebase.json`. Pour les publier, avec un compte Firebase qui a accès au projet :

```bash
firebase deploy --only storage --project <identifiant-du-projet>
```

## Commandes utiles

| Commande | Effet |
| --- | --- |
| `npm run dev` | Démarre l’application et les adresses `/api` en local |
| `npm run build` | Vérifie TypeScript puis construit le site dans `dist` |
| `npm run preview` | Sert localement le dossier `dist`, sans les adresses `/api` |
| `npm run lint` | Lance ESLint |
| `firebase deploy --only storage` | Publie les règles de `storage.rules` |
| `bash deploy.sh` | Construit le site puis lance un déploiement Vercel de production si la clé Firebase est présente dans l’environnement |

Le site en ligne est hébergé sur Vercel (voir « Adresse du site »).

## Adresse du site

[https://www.mysafebox.fr](https://www.mysafebox.fr/). L’adresse `https://mysafebox.fr` y redirige.

Les deux fonctions serveur répondent sur cette adresse (`/api/rename-storage` et `/api/preview-text`). D’anciens documents citent aussi `https://app.mysafebox.fr` pour la version NAS : cette adresse n’est pas décrite ici.

## Documents du dépôt

- `FICHE_IDENTITE.md` : présentation courte de l’application.
- `DEPLOYMENT.md` : mise en place Firebase et Vercel.
- `MYSAFEBOX-COMPLETE-SPECIFICATION.md`, `RECONSTRUCTION-CONTEXT.md`, `DEBUG-PRODUCTION-DEMAIN.md` et `EMAIL-GUIDE-MYSAFEBOX.md` : documents de l’ancienne version NAS. Ils ne décrivent pas le comportement du code actuel.
