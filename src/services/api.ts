import { FirebaseStorageService, type FirebaseFileItem } from './filestation-api';
import type { AuthUser } from './firebase-auth';

export class APIService {
  private storageService: FirebaseStorageService;
  private user: AuthUser;

  constructor(user: AuthUser) {
    this.user = user;
    this.storageService = new FirebaseStorageService(user.uid);
  }

  // Lister les fichiers
  async listFiles(path: string = ''): Promise<FirebaseFileItem[]> {
    return await this.storageService.listFiles(path);
  }

  // Créer un dossier
  async createFolder(path: string, name: string): Promise<boolean> {
    return await this.storageService.createFolder(path, name);
  }

  // Upload un fichier
  async uploadFile(
    file: File,
    path: string = '',
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    return await this.storageService.uploadFile(file, path, onProgress);
  }

  // Télécharger un fichier
  async downloadFile(path: string, filename: string): Promise<void> {
    return await this.storageService.downloadFile(path, filename);
  }

  // Supprimer des fichiers
  async deleteFiles(paths: string[]): Promise<boolean> {
    return await this.storageService.deleteFiles(paths);
  }

  // Obtenir l'URL de téléchargement
  async getDownloadUrl(path: string): Promise<string> {
    return await this.storageService.getDownloadUrl(path);
  }

  // Obtenir les métadonnées d'un fichier
  async getFileMetadata(path: string): Promise<any> {
    return await this.storageService.getFileMetadata(path);
  }

  // Obtenir l'espace utilisé
  async getTotalUsedSpace(): Promise<number> {
    return await this.storageService.getTotalUsedSpace();
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser(): AuthUser {
    return this.user;
  }
}