# 📋 MySafeBox - Spécifications Complètes

## 🎯 Vue d'ensemble

**MySafeBox** : Coffre-fort numérique familial PWA pour NAS Synology via FileStation API

## 🏗️ Architecture Technique

### Stack Technologique

- **Frontend** : React 18 + TypeScript
- **Styling** : Tailwind CSS
- **Icons** : Lucide React
- **Build** : Vite
- **PWA** : Service Worker + Manifest
- **Backend** : FileStation API Synology (REST)

### Structure des dossiers

```
src/
├── components/           # Composants React
│   ├── LoginForm.tsx    # Formulaire de connexion
│   ├── Dashboard.tsx    # Interface principale
│   ├── FileExplorer.tsx # Explorateur de fichiers
│   ├── FileUpload.tsx   # Upload de fichiers
│   ├── Modal.tsx        # Composant modal réutilisable
│   ├── ConnectionStatus.tsx # Badge réseau Local/Distant
│   └── InactivityWarning.tsx # Avertissement déconnexion
├── services/            # Services API
│   ├── api.ts          # Service principal (mode développement/production)
│   └── filestation-api.ts # API FileStation Synology
├── config/
│   └── environment.ts  # Configuration URLs et détection réseau
├── types.ts            # Types TypeScript
├── utils/
│   ├── fileHelpers.ts  # Utilitaires fichiers
│   └── useInactivityTimer.ts # Hook d'inactivité
├── App.tsx             # App principale
├── main.tsx           # Point d'entrée
└── index.css          # Styles globaux
```

## 🎨 Design System

### Palette de couleurs (Tailwind CSS)

```css
/* Dark Theme Principal */
Background: bg-gray-900       (#111827)
Cards: bg-gray-800           (#1f2937)
Borders: border-gray-700     (#374151)
Text Primary: text-white     (#ffffff)
Text Secondary: text-gray-300 (#d1d5db)
Text Muted: text-gray-400    (#9ca3af)

/* Couleurs d'accent */
Primary: bg-blue-600         (#2563eb)
Primary Hover: bg-blue-700   (#1d4ed8)
Success: bg-green-500        (#10b981)
Error: bg-red-500           (#ef4444)
Warning: bg-yellow-500      (#eab308)

/* États des fichiers */
Fichiers: text-gray-300     (#d1d5db)
Dossiers: text-blue-400     (#60a5fa)
Images: text-green-500      (#10b981)
Documents: text-red-500     (#ef4444)
Vidéos: text-purple-500     (#a855f7)
Audio: text-blue-500        (#3b82f6)
```

### Icônes (Lucide React)

```typescript
// Navigation
LogOut, FolderOpen, User, RefreshCw, ArrowLeft;

// Fichiers
Folder, File, Upload, FolderPlus, Download, Trash2;
Image, FileText, CheckSquare, Square;

// Interface
Shield, X, AlertCircle, CheckCircle, Search;

// Connexion
Wifi, WifiOff, Globe, Home;
```

### Composants UI Standards

```css
/* Boutons */
.btn-primary {
  @apply px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md
         transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 
         rounded-md border border-gray-600 transition-colors;
}

/* Inputs */
.input-standard {
  @apply w-full px-3 py-2 border border-gray-600 placeholder-gray-400 
         text-white bg-gray-800 rounded-md focus:outline-none 
         focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

/* Cards */
.card {
  @apply bg-gray-800 rounded-lg border border-gray-700 p-4;
}
```

## 🔧 Fonctionnalités Détaillées

### 1. Authentification

- **Interface** : Formulaire centralisé avec logo
- **Champs** : Username/Password avec autocomplete
- **Validation** : Connexion FileStation API
- **États** : Loading, erreurs contextuelles, succès
- **Session** : Sauvegarde localStorage + timeout 15min

### 2. Dashboard Principal

- **Header** : Logo + nom utilisateur + badge connexion + déconnexion
- **Badge réseau** : 🏠 LAN / 🌐 WAN détection automatique
- **Contenu** : FileExplorer en pleine page
- **Refresh** : Bouton actualisation connexion

### 3. Explorateur de Fichiers

- **Navigation** : Breadcrumb + bouton retour
- **Listing** : Grille responsive avec icônes typées
- **Actions** : Upload, créer dossier, télécharger, supprimer
- **Sélection** : Multiple avec cases à cocher
- **Tri** : Par nom, taille, date
- **États vides** : Messages d'aide contextuels

### 4. Upload de Fichiers

- **Interface** : Modal avec drag & drop
- **Multi-fichiers** : Support natif
- **Progression** : Barre de progression simulée
- **États** : Pending, uploading, success, error
- **Validation** : Taille et type de fichiers

### 5. Modales et Notifications

- **Modal générique** : Réutilisable (info, success, error)
- **Confirmations** : Suppression, actions destructives
- **Toasts** : Messages de succès/erreur éphémères
- **Loading states** : Spinners et indicateurs

### 6. PWA Features

- **Manifest** : Installation mobile/desktop
  ```json
  {
    "name": "MySafeBox - Coffre-fort numérique familial",
    "short_name": "MySafeBox",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#111827",
    "theme_color": "#1f2937"
  }
  ```
- **Service Worker** : Cache intelligent
  ```javascript
  // Cache-first pour assets statiques
  // Network-first pour API calls
  // Fallback offline vers cache
  ```
- **Offline** : Interface accessible sans internet
- **Icons** : Toutes tailles (favicon.ico, 192x192, 512x512)
- **Installation** : Bouton "Ajouter à l'écran d'accueil" automatique

## 🔌 Services et API

### FileStation API Endpoints

```typescript
// Authentification
POST /webapi/auth.cgi
  - api: SYNO.API.Auth
  - method: login/logout
  - session: FileStation

// Gestion fichiers
GET /webapi/entry.cgi
  - api: SYNO.FileStation.List (listing)
  - api: SYNO.FileStation.Upload (upload)
  - api: SYNO.FileStation.CreateFolder (mkdir)
  - api: SYNO.FileStation.Delete (suppression)
  - api: SYNO.FileStation.Download (téléchargement)
```

### Intégration Synology Complète

#### Gestion Utilisateurs

```typescript
// Utilise les comptes DSM existants (PAS de création)
// Structure automatique : /VaultsBackup/{username}/
// Isolation par utilisateur via permissions FileStation

interface SynologyAuth {
  username: string; // Compte DSM existant
  password: string; // Password DSM
  session: string; // Token de session
}
```

#### Actions Synology Spécifiques

```typescript
// 1. Login via DSM
await fetch("/webapi/auth.cgi", {
  method: "POST",
  body: formData, // username, password, session=FileStation
});

// 2. Création dossier utilisateur auto
await createFolder(`/VaultsBackup/${username}`);

// 3. Navigation sécurisée (seulement dossier user)
await listFiles(`/VaultsBackup/${username}/${currentPath}`);

// 4. Upload avec FormData
const formData = new FormData();
formData.append("path", `/VaultsBackup/${username}/${currentPath}`);
formData.append("create_parents", "true");
formData.append("overwrite", "true");

// 5. Permissions automatiques via FileStation
// Chaque user voit SEULEMENT son dossier
```

#### Configuration NAS Requise

```bash
# 1. Web Station : Activer + Virtual Host
Domain: app.mysafebox.fr
Root: /web/MySafeBox
HTTPS: Activé (Let's Encrypt)

# 2. File Station : API activée
Permissions: Lecture/Écriture sur /VaultsBackup/
Cross-domain: Autorisé pour app.mysafebox.fr

# 3. Utilisateurs DSM
Créer comptes DSM normaux
Donner accès File Station
Pas de droits admin nécessaires
```

### Configuration Environnement

```typescript
export const CONFIG = {
  NAS_URL: "https://app.mysafebox.fr",
  NAS_LOCAL_URL: "https://192.168.1.82:5006",
  PROXY_URL: "http://localhost:3030",
  APP_NAME: "MySafeBox",
  APP_VERSION: "1.0.0",
};

// Détection réseau automatique
export const isLocalNetwork = () => {
  // Détecte IP locales vs publiques
};
```

### Structure Données

```typescript
interface User {
  id: string;
  username: string;
  nasUrl: string;
  webdavUsername: string;
  webdavPassword: string;
}

interface FileItem {
  name: string;
  type: "file" | "directory";
  size?: number;
  lastModified?: Date;
  path: string;
}
```

## 🛣️ Feuille de Route Reconstruction

### Phase 1 : Setup Base (2h)

1. **Initialiser projet Vite + React + TypeScript**
2. **Configurer Tailwind CSS**
3. **Installer Lucide React**
4. **Structure dossiers de base**
5. **Configuration PWA (manifest.json, service worker)**

### Phase 2 : Authentification (3h)

1. **Composant LoginForm**
   - Interface utilisateur
   - Validation des champs
   - États de loading
2. **Service FileStation API**
   - Authentification
   - Gestion des erreurs
3. **Configuration environnement**
   - Détection réseau Local/Distant
   - URLs dynamiques

### Phase 3 : Dashboard et Navigation (2h)

1. **Composant Dashboard principal**
   - Header avec logo et user info
   - Badge de connexion
   - Zone principale
2. **Composant ConnectionStatus**
   - Détection LAN/WAN
   - Indicateurs visuels
3. **Gestion de session**
   - LocalStorage
   - Timer d'inactivité

### Phase 4 : Explorateur de Fichiers (4h)

1. **Composant FileExplorer de base**
   - Listing des fichiers
   - Navigation (breadcrumb, retour)
   - Icônes typées par extension
2. **Actions fichiers**
   - Création de dossiers
   - Suppression
   - Sélection multiple
3. **Interface responsive**
   - Grille adaptative
   - Mode mobile

### Phase 5 : Upload et Gestion Fichiers (3h)

1. **Composant FileUpload**
   - Modal avec drag & drop
   - Multi-fichiers
   - Barre de progression
2. **Service upload**
   - FormData pour FileStation
   - Gestion des erreurs
3. **Download et actions**
   - Téléchargement
   - Actions contextuelles

### Phase 6 : UI/UX et Polish (2h)

1. **Composant Modal générique**
   - Types : info, success, error
   - Réutilisable
2. **États vides et loading**
   - Messages d'aide
   - Spinners et animations
3. **Responsive final**
   - Mobile optimization
   - Touch gestures

### Phase 7 : PWA et Déploiement (2h)

1. **Service Worker (sw.js)**

   ```javascript
   // Cache statique : /, index.html, assets/
   // Cache dynamique : API responses
   // Mode offline : fallback vers cache
   // Installation : skipWaiting() pour MAJ immédiate
   ```

2. **Manifest PWA (manifest.json)**

   ```json
   {
     "start_url": "/",
     "display": "standalone",
     "orientation": "portrait-primary",
     "categories": ["productivity", "utilities"]
   }
   ```

3. **Meta tags PWA (index.html)**

   ```html
   <meta name="mobile-web-app-capable" content="yes" />
   <meta name="apple-mobile-web-app-capable" content="yes" />
   <link rel="apple-touch-icon" sizes="180x180" href="/logo-180.png" />
   ```

4. **Déploiement NAS**

   ```bash
   # Build production
   npm run build

   # Copier dist/ vers NAS
   /volume1/web/app.mysafebox.fr/

   # Configuration Web Station
   Virtual Host: app.mysafebox.fr → /web/MySafeBox
   HTTPS: Let's Encrypt auto

   # Permissions FileStation
   /VaultsBackup/ → Lecture/Écriture users
   ```

## 📋 Checklist Complète

### Fonctionnalités Core

- [ ] Authentification FileStation
- [ ] Navigation dossiers
- [ ] Upload multi-fichiers
- [ ] Téléchargement
- [ ] Création/suppression dossiers
- [ ] Suppression fichiers
- [ ] Session management
- [ ] Déconnexion auto (15min)

### UI/UX

- [ ] Design dark theme
- [ ] Icons typées par fichier
- [ ] Responsive mobile
- [ ] Loading states
- [ ] Messages d'erreur contextuels
- [ ] Confirmations actions destructives
- [ ] Badge réseau Local/Distant

### PWA

- [ ] Installation mobile
- [ ] Service Worker
- [ ] Manifest complet
- [ ] Icons toutes tailles
- [ ] Mode offline basique

### Technique

- [ ] TypeScript strict
- [ ] Configuration environnement
- [ ] Gestion d'erreurs robuste
- [ ] Build optimisé
- [ ] Déploiement NAS

## ⚙️ Configuration Technique Complète

### Dependencies (package.json)

```json
{
  "name": "mysafebox",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.298.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

### Configuration Vite (vite.config.ts)

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
  },
});
```

### Configuration Tailwind (tailwind.config.js)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### Configuration TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### PostCSS (postcss.config.js)

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

## 🧩 Interfaces et Types Complets

### Types Principaux (src/types.ts)

```typescript
export interface User {
  id: string;
  username: string;
  nasUrl: string;
  webdavUsername: string;
  webdavPassword: string;
}

export interface FileItem {
  name: string;
  type: "file" | "directory";
  size?: number;
  lastModified?: Date;
  path: string;
  isdir?: boolean;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

export interface ConnectionInfo {
  type: "LOCAL" | "DISTANT";
  url: string;
  displayUrl: string;
  isSecure: boolean;
  icon: string;
  badge: string;
}
```

## 🎯 Logique Métier Détaillée

### Service API Principal (src/services/api.ts)

```typescript
import { FileStationService } from "./filestation-api";

export class APIService {
  private fileStationService: FileStationService;

  constructor(baseUrl: string, user: User) {
    this.fileStationService = new FileStationService(baseUrl, user);
  }

  // Méthodes principales
  async login(): Promise<boolean>;
  async logout(): Promise<void>;
  async listFiles(path: string): Promise<FileItem[]>;
  async createFolder(path: string, name: string): Promise<boolean>;
  async uploadFile(file: File, path: string): Promise<boolean>;
  async downloadFile(path: string, filename: string): Promise<void>;
  async deleteFile(path: string): Promise<boolean>;
}
```

### Hook d'Inactivité (src/utils/useInactivityTimer.ts)

```typescript
import { useEffect, useCallback } from "react";

export const useInactivityTimer = (
  onTimeout: () => void,
  timeout: number = 900000
) => {
  // 15 minutes par défaut

  const resetTimer = useCallback(() => {
    // Reset timer logic
  }, []);

  const startTimer = useCallback(() => {
    // Start timer logic
  }, [onTimeout, timeout]);

  useEffect(() => {
    // Setup event listeners
    return () => {
      // Cleanup
    };
  }, [resetTimer, startTimer]);

  return { resetTimer, startTimer };
};
```

## 🔧 Composants - Structure Détaillée

### LoginForm Props et États

```typescript
interface LoginFormProps {
  onLogin: (user: User) => void;
}

interface LoginFormState {
  username: string;
  password: string;
  isLoading: boolean;
  error: string | null;
}
```

### FileExplorer Props et États

```typescript
interface FileExplorerProps {
  apiService: APIService;
  user: User;
}

interface FileExplorerState {
  files: FileItem[];
  currentPath: string;
  selectedFiles: string[];
  isLoading: boolean;
  error: string | null;
  showUploadModal: boolean;
}
```

### Modal Props Générique

```typescript
interface ModalProps {
  type: "info" | "success" | "error" | "confirm";
  title: string;
  message: string;
  isVisible: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
}
```

## 🎯 Temps Total Estimé : 18-20 heures

Cette spécification ULTRA-COMPLÈTE permet maintenant à une IA de reconstruire MySafeBox intégralement avec tous les détails techniques ! 🚀
