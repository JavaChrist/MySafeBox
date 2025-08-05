export const CONFIG = {
  NAS_URL: "https://app.mysafebox.fr",
  NAS_LOCAL_URL: "https://192.168.1.82:5006",
  PROXY_URL: "http://localhost:3030",
  APP_NAME: "MySafeBox",
  APP_VERSION: "1.0.0",
  // Alternative HTTP si HTTPS pose problème
  NAS_LOCAL_HTTP: "http://192.168.1.82:5000",
};

// Détection réseau automatique
export const isLocalNetwork = (): boolean => {
  const hostname = window.location.hostname;

  // En développement, toujours considérer comme local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }

  // Patterns IP locales
  const localPatterns = [
    /^192\.168\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^localhost$/,
    /^127\./,
  ];

  return localPatterns.some(pattern => pattern.test(hostname));
};

export const isOnNAS = (): boolean => {
  const hostname = window.location.hostname;
  return hostname === "app.mysafebox.fr" || hostname.includes("mysafebox");
};

export const getAPIUrl = (): string => {
  if (isOnNAS()) {
    return CONFIG.NAS_URL;
  }

  if (isLocalNetwork()) {
    // En développement, utiliser le proxy Vite local
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return window.location.origin; // localhost:5173 ou 127.0.0.1:5173 avec proxy
    }
    // Essayer HTTP si HTTPS pose problème
    return CONFIG.NAS_LOCAL_HTTP || CONFIG.NAS_LOCAL_URL;
  }

  return CONFIG.PROXY_URL;
};