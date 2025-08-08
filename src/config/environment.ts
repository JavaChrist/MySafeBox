export const CONFIG = {
  APP_NAME: "MySafeBox",
  APP_VERSION: "1.0.0",
  // Configuration Firebase Storage
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_FILE_TYPES: [
    'image/*',
    'video/*',
    'audio/*',
    'application/pdf',
    'text/*',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx'
  ],
};

// Environnement de déploiement
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV;
};

export const isProduction = (): boolean => {
  return import.meta.env.PROD;
};