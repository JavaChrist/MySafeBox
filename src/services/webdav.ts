import { createClient, WebDAVClient } from 'webdav';
import { FileItem } from '../types';

export class WebDAVService {
  private client: WebDAVClient;
  private basePath: string;

  constructor(url: string, username: string, password: string, userName: string) {
    this.client = createClient(url, {
      username,
      password,
    });
    // Chaque utilisateur a son dossier dans /VaultsBackup/<nom-utilisateur>
    this.basePath = `/VaultsBackup/${userName}`;
  }

  async listFiles(path: string = ''): Promise<FileItem[]> {
    try {
      const fullPath = `${this.basePath}/${path}`.replace(/\/+/g, '/');
      const contents = await this.client.getDirectoryContents(fullPath);

      return Array.isArray(contents) ? contents.map((item: any) => ({
        name: item.basename,
        type: item.type as 'file' | 'directory',
        size: item.size,
        lastModified: new Date(item.lastmod),
        path: item.filename.replace(this.basePath, '').replace(/^\//, '')
      })) : [];
    } catch (error) {
      console.error('Erreur lors de la lecture des fichiers:', error);
      throw new Error('Impossible de lire le contenu du dossier');
    }
  }

  async createDirectory(path: string, name: string): Promise<void> {
    try {
      const fullPath = `${this.basePath}/${path}/${name}`.replace(/\/+/g, '/');
      await this.client.createDirectory(fullPath);
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
      throw new Error('Impossible de créer le dossier');
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const fullPath = `${this.basePath}/${path}`.replace(/\/+/g, '/');
      await this.client.deleteFile(fullPath);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw new Error('Impossible de supprimer le fichier');
    }
  }

  async uploadFile(path: string, file: File): Promise<void> {
    try {
      const fullPath = `${this.basePath}/${path}/${file.name}`.replace(/\/+/g, '/');
      const arrayBuffer = await file.arrayBuffer();
      await this.client.putFileContents(fullPath, arrayBuffer);
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      throw new Error('Impossible d\'uploader le fichier');
    }
  }

  async downloadFile(path: string): Promise<ArrayBuffer> {
    try {
      const fullPath = `${this.basePath}/${path}`.replace(/\/+/g, '/');
      const content = await this.client.getFileContents(fullPath, { format: 'binary' });
      return content as ArrayBuffer;
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw new Error('Impossible de télécharger le fichier');
    }
  }

  async moveFile(fromPath: string, toPath: string): Promise<void> {
    try {
      const fullFromPath = `${this.basePath}/${fromPath}`.replace(/\/+/g, '/');
      const fullToPath = `${this.basePath}/${toPath}`.replace(/\/+/g, '/');
      await this.client.moveFile(fullFromPath, fullToPath);
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
      throw new Error('Impossible de déplacer le fichier');
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      // D'abord, tester la connexion WebDAV de base
      await this.client.getDirectoryContents('/');

      // Ensuite, vérifier/créer le dossier VaultsBackup s'il n'existe pas
      try {
        await this.client.getDirectoryContents('/VaultsBackup');
      } catch (error) {
        console.log('Création du dossier VaultsBackup...');
        await this.client.createDirectory('/VaultsBackup');
      }

      // Enfin, vérifier/créer le dossier utilisateur
      try {
        await this.client.getDirectoryContents(this.basePath);
      } catch (error) {
        console.log(`Création du dossier utilisateur: ${this.basePath}`);
        await this.client.createDirectory(this.basePath);
      }

      return true;
    } catch (error) {
      console.error('Erreur de connexion WebDAV:', error);
      return false;
    }
  }

  async ensureUserDirectory(): Promise<void> {
    try {
      // Vérifier si le dossier utilisateur existe, sinon le créer
      await this.client.getDirectoryContents(this.basePath);
    } catch (error) {
      console.log(`Création du dossier utilisateur: ${this.basePath}`);
      await this.client.createDirectory(this.basePath);
    }
  }
}