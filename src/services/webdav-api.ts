/**
 * Service WebDAV utilisant l'API proxy pour contourner CORS
 * Remplace le service WebDAV direct
 */

import { APIService } from './api';
import { FileItem } from '../types';

export class WebDAVAPIService {
  private apiService: APIService;

  constructor(username: string, password: string, _userName: string) {
    this.apiService = new APIService(username, password);
  }

  async listFiles(path: string = ''): Promise<FileItem[]> {
    try {
      const files = await this.apiService.listFiles(path);

      return files.map((file: any) => ({
        name: file.name,
        type: file.type as 'file' | 'directory',
        size: file.size,
        lastModified: file.lastModified ? new Date(file.lastModified) : undefined,
        path: file.path
      }));
    } catch (error) {
      console.error('Erreur lors de la lecture des fichiers:', error);
      throw new Error('Impossible de lire le contenu du dossier');
    }
  }

  async createDirectory(path: string, name: string): Promise<void> {
    try {
      await this.apiService.createDirectory(path, name);
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
      throw new Error('Impossible de créer le dossier');
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await this.apiService.deleteFile(path);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw new Error('Impossible de supprimer le fichier');
    }
  }

  async uploadFile(path: string, file: File): Promise<void> {
    try {
      await this.apiService.uploadFile(path, file);
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      throw new Error('Impossible d\'uploader le fichier');
    }
  }

  async downloadFile(path: string): Promise<ArrayBuffer> {
    try {
      return await this.apiService.downloadFile(path, '');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw new Error('Impossible de télécharger le fichier');
    }
  }

  async moveFile(fromPath: string, toPath: string): Promise<void> {
    try {
      await this.apiService.moveFile(fromPath, toPath);
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
      throw new Error('Impossible de déplacer le fichier');
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      return await this.apiService.testConnection();
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    }
  }

  async ensureUserDirectory(): Promise<void> {
    try {
      // L'API gère automatiquement la création du dossier utilisateur
      await this.apiService.testConnection();
    } catch (error) {
      console.log(`Erreur lors de la vérification du dossier utilisateur: ${(error as any)?.message || 'Erreur inconnue'}`);
    }
  }
}