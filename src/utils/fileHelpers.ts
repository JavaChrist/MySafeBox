import { File, Folder, Image, FileText, Video, Music, Archive, Code, Settings } from 'lucide-react';

// Types de fichiers avec icônes et couleurs
export const getFileIcon = (filename: string, isDirectory: boolean = false) => {
  if (isDirectory) {
    return { icon: Folder, color: 'text-blue-400' };
  }

  const ext = filename.toLowerCase().split('.').pop() || '';

  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return { icon: Image, color: 'text-green-500' };
  }

  // Documents
  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) {
    return { icon: FileText, color: 'text-red-500' };
  }

  // Vidéos
  if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
    return { icon: Video, color: 'text-purple-500' };
  }

  // Audio
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
    return { icon: Music, color: 'text-blue-500' };
  }

  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
    return { icon: Archive, color: 'text-yellow-500' };
  }

  // Code
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'php'].includes(ext)) {
    return { icon: Code, color: 'text-cyan-500' };
  }

  // Config
  if (['config', 'conf', 'ini', 'env', 'yml', 'yaml'].includes(ext)) {
    return { icon: Settings, color: 'text-gray-400' };
  }

  // Défaut
  return { icon: File, color: 'text-gray-300' };
};

// Formatage de la taille des fichiers
export const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes || bytes === 0) return '-';

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(1);

  return `${size} ${sizes[i]}`;
};

// Formatage de la date
export const formatDate = (date: Date | undefined): string => {
  if (!date) return '-';

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } else if (days === 1) {
    return 'Hier';
  } else if (days < 7) {
    return `${days} jours`;
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }
};

// Tri des fichiers
export const sortFiles = (files: any[], sortBy: 'name' | 'size' | 'date' | 'type', order: 'asc' | 'desc') => {
  const sorted = [...files].sort((a, b) => {
    // Dossiers en premier
    if (a.isdir && !b.isdir) return -1;
    if (!a.isdir && b.isdir) return 1;

    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = (a.size || 0) - (b.size || 0);
        break;
      case 'date':
        const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
        const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
        comparison = dateA - dateB;
        break;
      case 'type':
        const extA = a.name.split('.').pop() || '';
        const extB = b.name.split('.').pop() || '';
        comparison = extA.localeCompare(extB);
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
};

export type PreviewKind = 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'unsupported';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogv', 'mov'];
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
const TEXT_EXTENSIONS = [
  'txt', 'md', 'json', 'csv', 'xml', 'log', 'js', 'ts', 'tsx', 'jsx',
  'css', 'html', 'htm', 'yml', 'yaml', 'ini', 'cfg', 'conf', 'py', 'php', 'sql', 'sh'
];

export const getPreviewKind = (filename: string): PreviewKind => {
  const ext = filename.toLowerCase().split('.').pop() || '';
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
  if (AUDIO_EXTENSIONS.includes(ext)) return 'audio';
  if (TEXT_EXTENSIONS.includes(ext)) return 'text';
  return 'unsupported';
};

export const validateEntryName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Veuillez entrer un nom');
  }
  if (trimmed === '.' || trimmed === '..' || trimmed === '.keep') {
    throw new Error('Ce nom est réservé');
  }
  if (trimmed.length > 200) {
    throw new Error('Le nom est trop long');
  }
  if (/[\\/]/.test(trimmed) || /[\u0000-\u001F\u007F]/.test(trimmed)) {
    throw new Error('Le nom contient un caractère interdit');
  }
  return trimmed;
};