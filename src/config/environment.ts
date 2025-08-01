/**
 * Configuration d'environnement MySafeBox
 * Gestion des URLs et détection local/distant
 */

// URLs de configuration - Modifiez ces valeurs selon vos besoins
export const CONFIG = {
  // URL principale publique - MODIFIEZ ICI pour changer l'URL
  NAS_URL: 'https://app.mysafebox.fr',

  // URL locale de fallback (développement/diagnostic)
  NAS_LOCAL_URL: 'https://192.168.1.82:5006',

  // URL du proxy local
  PROXY_URL: 'http://localhost:3030',

  // Configuration PWA
  APP_NAME: 'MySafeBox',
  APP_VERSION: '1.0.0'
} as const;

/**
 * Détecte si l'utilisateur accède depuis le réseau local
 */
export const isLocalNetwork = (): boolean => {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;

  // Vérifier si c'est une IP locale
  const localPatterns = [
    /^192\.168\./,           // 192.168.x.x
    /^10\./,                 // 10.x.x.x
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.x.x - 172.31.x.x
    /^127\./,                // 127.x.x.x (localhost)
    /^localhost$/            // localhost
  ];

  return localPatterns.some(pattern => pattern.test(hostname));
};

/**
 * Retourne l'URL WebDAV appropriée selon le contexte
 */
export const getWebDAVUrl = (): string => {
  // Toujours utiliser l'URL configurée
  return CONFIG.NAS_URL;
};

/**
 * Détecte le type de connexion (LOCAL/DISTANT)
 */
export const getConnectionType = (): 'LOCAL' | 'DISTANT' => {
  return isLocalNetwork() ? 'LOCAL' : 'DISTANT';
};

/**
 * Retourne les informations de connexion pour l'affichage
 */
export const getConnectionInfo = () => {
  const type = getConnectionType();
  const url = getWebDAVUrl();

  return {
    type,
    url,
    displayUrl: url.replace('https://', ''),
    isSecure: url.startsWith('https://'),
    icon: type === 'LOCAL' ? '🏠' : '🌐',
    badge: type === 'LOCAL' ? 'LAN' : 'WAN'
  };
};