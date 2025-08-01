# 🌐 Configuration URL MySafeBox

## Configuration automatique

MySafeBox est maintenant configuré pour utiliser **https://app.mysafebox.fr** comme URL principale.

## Variables d'environnement

Créez un fichier `.env` à la racine du projet avec :

```bash
# URL principale du NAS/service MySafeBox (Variables Vite)
VITE_NAS_URL=https://app.mysafebox.fr

# URL locale de fallback (développement)
VITE_NAS_LOCAL_URL=https://192.168.1.82:5006

# URL du proxy local
VITE_PROXY_URL=http://localhost:3030

# Configuration du serveur proxy (Node.js)
NAS_URL=https://app.mysafebox.fr
```

## Détection automatique Local/Distant

L'application détecte automatiquement si l'utilisateur se connecte :

- 🏠 **LOCAL (LAN)** : depuis le réseau local (192.168.x.x, 10.x.x.x, etc.)
- 🌐 **DISTANT (WAN)** : depuis internet

## Gestion des erreurs améliorée

- ✅ Certificats SSL invalides
- ✅ Service hors ligne
- ✅ Connexion refusée
- ✅ DNS non trouvé
- ✅ Maintenance/surcharge

## Utilisation

1. **Développement local** : Démarrez le proxy avec `node server-proxy-working.cjs`
2. **Production** : L'app utilise directement https://app.mysafebox.fr

## Changement d'URL

Pour changer l'URL principale :

1. **Méthode 1** : Modifier le fichier `.env`

```bash
VITE_NAS_URL=https://votre-domaine.com
```

2. **Méthode 2** : Modifier `src/config/environment.ts`

```typescript
NAS_URL: import.meta.env.VITE_NAS_URL || "https://votre-domaine.com";
```

## Sécurité

- ✅ Toujours HTTPS en production
- ✅ Validation des certificats SSL
- ✅ Détection et signalement des problèmes de sécurité
