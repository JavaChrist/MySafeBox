/**
 * Utilitaires pour la gestion des fichiers
 */

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  return imageExtensions.includes(getFileExtension(filename));
};

export const isDocumentFile = (filename: string): boolean => {
  const docExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
  return docExtensions.includes(getFileExtension(filename));
};

export const isVideoFile = (filename: string): boolean => {
  const videoExtensions = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'];
  return videoExtensions.includes(getFileExtension(filename));
};

export const isAudioFile = (filename: string): boolean => {
  const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
  return audioExtensions.includes(getFileExtension(filename));
};

export const getFileTypeColor = (filename: string): string => {
  if (isImageFile(filename)) return 'text-green-500';
  if (isDocumentFile(filename)) return 'text-red-500';
  if (isVideoFile(filename)) return 'text-purple-500';
  if (isAudioFile(filename)) return 'text-blue-500';
  return 'text-gray-500';
};

export const sanitizeFilename = (filename: string): string => {
  // Remplace les caractères non autorisés par des underscores
  return filename.replace(/[<>:"/\\|?*]/g, '_');
};

export const validateWebDAVUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

export const generateUserPath = (firstName: string, lastName: string): string => {
  const sanitizedFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sanitizedLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${sanitizedFirst}.${sanitizedLast}`;
};