import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,

  type UploadMetadata
} from 'firebase/storage';
import { storage } from '../config/firebase';
import type { FileItem } from '../types';
import { CONFIG } from '../config/environment';

export interface FirebaseFileItem extends FileItem {
  downloadUrl?: string;
  fullPath: string;
}

export class FirebaseStorageService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Obtenir la référence du dossier utilisateur
  private getUserPath(path: string = ''): string {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `users/${this.userId}/${cleanPath}`;
  }

  // Lister les fichiers d'un répertoire
  async listFiles(path: string = ''): Promise<FirebaseFileItem[]> {
    try {
      const userPath = this.getUserPath(path);
      const listRef = ref(storage, userPath);

      console.log('📁 Listing files in:', userPath);

      const result = await listAll(listRef);
      const files: FirebaseFileItem[] = [];

      // Traiter les dossiers
      for (const folderRef of result.prefixes) {
        const folderName = folderRef.name;
        files.push({
          name: folderName,
          type: 'directory',
          size: 0,
          lastModified: new Date(),
          path: path ? `${path}/${folderName}` : folderName,
          isdir: true,
          fullPath: folderRef.fullPath,
        });
      }

      // Traiter les fichiers (ignorer les fichiers .keep)
      for (const fileRef of result.items) {
        // Ignorer les fichiers .keep utilisés pour créer des dossiers
        if (fileRef.name === '.keep') continue;

        try {
          const metadata = await getMetadata(fileRef);
          const downloadUrl = await getDownloadURL(fileRef);

          files.push({
            name: fileRef.name,
            type: 'file',
            size: metadata.size || 0,
            lastModified: new Date(metadata.timeCreated),
            path: path ? `${path}/${fileRef.name}` : fileRef.name,
            isdir: false,
            fullPath: fileRef.fullPath,
            downloadUrl
          });
        } catch (error) {
          console.warn('Erreur métadonnées pour:', fileRef.name, error);
          // Ajouter le fichier sans métadonnées si erreur (sauf .keep)
          if (fileRef.name !== '.keep') {
            files.push({
              name: fileRef.name,
              type: 'file',
              size: 0,
              lastModified: new Date(),
              path: path ? `${path}/${fileRef.name}` : fileRef.name,
              isdir: false,
              fullPath: fileRef.fullPath
            });
          }
        }
      }

      // Trier : dossiers d'abord, puis fichiers par nom
      files.sort((a, b) => {
        if (a.isdir && !b.isdir) return -1;
        if (!a.isdir && b.isdir) return 1;
        return a.name.localeCompare(b.name);
      });

      console.log('📁 Found', files.length, 'items');
      return files;
    } catch (error) {
      console.error('Erreur listage fichiers:', error);
      throw new Error('Impossible de lister les fichiers');
    }
  }

  // Créer un dossier (virtuel)
  async createFolder(path: string, name: string): Promise<boolean> {
    try {
      // Dans Firebase Storage, on crée un fichier placeholder pour simuler un dossier
      const folderPath = path ? `${path}/${name}` : name;
      const userPath = this.getUserPath(`${folderPath}/.keep`);
      const folderRef = ref(storage, userPath);

      // Créer un fichier vide pour matérialiser le dossier
      const emptyFile = new Blob([''], { type: 'text/plain' });
      await uploadBytes(folderRef, emptyFile);

      console.log('📁 Dossier créé:', folderPath);
      return true;
    } catch (error) {
      console.error('Erreur création dossier:', error);
      return false;
    }
  }

  // Upload un fichier
  async uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    try {
      // Vérification taille
      if (file.size > CONFIG.MAX_FILE_SIZE) {
        throw new Error(`Fichier trop volumineux. Taille maximum: ${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }

      const filePath = path ? `${path}/${file.name}` : file.name;
      const userPath = this.getUserPath(filePath);
      const fileRef = ref(storage, userPath);

      console.log('📤 Upload vers:', userPath);

      // Métadonnées du fichier
      const metadata: UploadMetadata = {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          size: file.size.toString()
        }
      };

      // Upload avec suivi de progression si callback fourni
      if (onProgress) {
        // Pour l'instant, simple upload direct
        // TODO: Implémenter uploadBytesResumable pour le suivi de progression
        await uploadBytes(fileRef, file, metadata);
        onProgress(100);
      } else {
        await uploadBytes(fileRef, file, metadata);
      }

      console.log('✅ Upload réussi:', file.name);
      return true;
    } catch (error) {
      console.error('Erreur upload:', error);
      return false;
    }
  }

  // Supprimer des fichiers/dossiers
  async deleteFiles(paths: string[]): Promise<boolean> {
    console.log('🚀 DÉBUT SUPPRESSION - Paths reçus:', paths);

    try {
      const deletePromises = paths.map(async (path) => {
        console.log('🔍 TRAITEMENT PATH:', path);

        try {
          const userPath = this.getUserPath(path);

          console.log('🔍 Analyse suppression:', {
            path,
            userPath,
            containsDot: path.includes('.'),
            endsWith: path.endsWith('/')
          });

          // Déterminer si c'est un fichier ou un dossier
          // Un fichier contient généralement une extension (point)
          const pathContainsDot = path.includes('.') && !path.endsWith('/');

          if (pathContainsDot) {
            // C'est probablement un fichier (a une extension)
            console.log('📄 Suppression fichier:', path, '→', userPath);
            const fileRef = ref(storage, userPath);
            await deleteObject(fileRef);
            console.log('✅ Fichier supprimé de Firebase Storage');

            // Après suppression d'un fichier, vérifier si le dossier parent ne contient plus que .keep
            console.log('🧹 APPEL cleanupEmptyFolder pour:', path);
            await this.cleanupEmptyFolder(path);
            console.log('🧹 RETOUR cleanupEmptyFolder');
          } else {
            // C'est probablement un dossier
            console.log('📁 Suppression dossier:', path, '→', userPath);
            const listRef = ref(storage, userPath);
            const result = await listAll(listRef);

            console.log('📁 Contenu dossier:', {
              items: result.items.map(i => i.name),
              prefixes: result.prefixes.map(p => p.name)
            });

            // Supprimer tout le contenu du dossier récursivement
            const allDeletePromises = [
              ...result.items.map(item => deleteObject(item)),
              ...result.prefixes.map(async (prefix) => {
                const subResult = await listAll(prefix);
                return Promise.all(subResult.items.map(item => deleteObject(item)));
              })
            ];
            await Promise.all(allDeletePromises);
          }

          console.log('🗑️ Supprimé:', path);
        } catch (error) {
          console.error('Erreur suppression:', path, error);
          throw error;
        }
      });

      await Promise.all(deletePromises);
      console.log('✅ Suppression réussie pour', paths.length, 'éléments');
      return true;
    } catch (error) {
      console.error('Erreur suppression fichiers:', error);
      return false;
    }
  }

  // Nettoyer un dossier qui ne contient plus que .keep
  private async cleanupEmptyFolder(filePath: string): Promise<void> {
    try {
      // Extraire le chemin du dossier parent
      const pathParts = filePath.split('/');
      console.log('🧹 Nettoyage - analyse chemin:', { filePath, pathParts });

      if (pathParts.length <= 1) {
        console.log('🧹 Pas de dossier parent, abandon nettoyage');
        return; // Pas de dossier parent ou à la racine
      }

      pathParts.pop(); // Enlever le nom du fichier
      const folderPath = pathParts.join('/');
      const userFolderPath = this.getUserPath(folderPath);

      console.log('🧹 Vérification dossier:', { folderPath, userFolderPath });

      const listRef = ref(storage, userFolderPath);
      const result = await listAll(listRef);

      console.log('🧹 Contenu après suppression:', {
        allItems: result.items.map(i => i.name),
        prefixes: result.prefixes.map(p => p.name)
      });

      // Si le dossier ne contient plus que le fichier .keep, le supprimer aussi
      const realFiles = result.items.filter(item => item.name !== '.keep');
      const keepFiles = result.items.filter(item => item.name === '.keep');

      console.log('🧹 Analyse:', {
        realFiles: realFiles.length,
        keepFiles: keepFiles.length,
        prefixes: result.prefixes.length
      });

      if (realFiles.length === 0 && result.prefixes.length === 0) {
        // Ne reste que .keep (ou rien), GARDER .keep pour maintenir le dossier
        console.log('🧹 Dossier vide détecté, mais on garde .keep pour maintenir le dossier');
        console.log('📁 Le dossier', folderPath, 'restera visible et vide');
      } else {
        console.log('🧹 Dossier non vide, pas de nettoyage nécessaire');
      }
    } catch (error) {
      // Ignore les erreurs de nettoyage, ce n'est pas critique
      console.error('❌ Erreur nettoyage dossier:', error);
    }
  }

    // Télécharger un fichier
  async downloadFile(path: string, filename: string): Promise<void> {
    try {
      const userPath = this.getUserPath(path);
      const fileRef = ref(storage, userPath);
      
      console.log('📥 Téléchargement:', userPath);
      
      const downloadUrl = await getDownloadURL(fileRef);
      
      // Détection mobile pour adapter la méthode
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      console.log('🔍 Détection appareil:', { isMobile, isIOS, userAgent: navigator.userAgent });
      
      if (isIOS) {
        // iOS : Méthode spéciale pour contourner les restrictions Safari
        console.log('📱 iOS détecté - Méthode spéciale');
        
        // Créer un lien temporaire et forcer le clic immédiat
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        
        // Ajouter temporairement au DOM pour que le clic fonctionne
        document.body.appendChild(a);
        
        // Déclencher immédiatement (pas d'await)
        setTimeout(() => {
          a.click();
          document.body.removeChild(a);
        }, 0);
        
      } else if (isMobile) {
        // Android : ouverture nouvel onglet
        console.log('📱 Android détecté - Nouvel onglet');
        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Desktop : téléchargement classique
        console.log('💻 Desktop détecté - Téléchargement direct');
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      console.log('✅ Téléchargement initié:', filename);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      throw new Error('Impossible de télécharger le fichier');
    }
  }

  // Obtenir l'URL de téléchargement direct
  async getDownloadUrl(path: string): Promise<string> {
    try {
      const userPath = this.getUserPath(path);
      const fileRef = ref(storage, userPath);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Erreur URL de téléchargement:', error);
      throw new Error('Impossible d\'obtenir l\'URL de téléchargement');
    }
  }

  // Obtenir les métadonnées d'un fichier
  async getFileMetadata(path: string): Promise<any> {
    try {
      const userPath = this.getUserPath(path);
      const fileRef = ref(storage, userPath);
      return await getMetadata(fileRef);
    } catch (error) {
      console.error('Erreur métadonnées:', error);
      throw new Error('Impossible d\'obtenir les métadonnées');
    }
  }

  // Vérifier la taille totale utilisée par l'utilisateur (approximation)
  async getTotalUsedSpace(): Promise<number> {
    try {
      const files = await this.listFilesRecursive('');
      return files.reduce((total, file) => total + (file.size || 0), 0);
    } catch (error) {
      console.error('Erreur calcul espace utilisé:', error);
      return 0;
    }
  }

  // Lister tous les fichiers récursivement
  private async listFilesRecursive(path: string = ''): Promise<FirebaseFileItem[]> {
    const files = await this.listFiles(path);
    const allFiles: FirebaseFileItem[] = [];

    for (const file of files) {
      if (file.isdir) {
        const subFiles = await this.listFilesRecursive(file.path);
        allFiles.push(...subFiles);
      } else {
        allFiles.push(file);
      }
    }

    return allFiles;
  }
}