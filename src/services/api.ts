import { FileStationService } from './filestation-api';
import type { User, FileItem } from '../types';
import { getAPIUrl } from '../config/environment';

export class APIService {
  private fileStationService: FileStationService;

  constructor(user: User) {
    const apiUrl = getAPIUrl();
    this.fileStationService = new FileStationService(apiUrl, user);
  }

  // Authentification
  async login(username: string, password: string): Promise<boolean> {
    const success = await this.fileStationService.login(username, password);

    if (success) {
      // Créer automatiquement le dossier utilisateur
      await this.fileStationService.ensureUserFolder();

      // Sauvegarder la session
      this.saveSession(username);
    }

    return success;
  }

  // Déconnexion
  async logout(): Promise<void> {
    await this.fileStationService.logout();
    this.clearSession();
  }

  // Lister les fichiers
  async listFiles(path: string = '/'): Promise<FileItem[]> {
    return await this.fileStationService.listFiles(path);
  }

  // Créer un dossier
  async createFolder(path: string, name: string): Promise<boolean> {
    return await this.fileStationService.createFolder(path, name);
  }

  // Upload un fichier
  async uploadFile(file: File, path: string = '/'): Promise<boolean> {
    return await this.fileStationService.uploadFile(file, path);
  }

  // Télécharger un fichier
  async downloadFile(path: string, filename: string): Promise<void> {
    return await this.fileStationService.downloadFile(path, filename);
  }

  // Supprimer des fichiers
  async deleteFiles(paths: string[]): Promise<boolean> {
    return await this.fileStationService.deleteFiles(paths);
  }

  // Gestion de session
  private saveSession(username: string): void {
    const sessionData = {
      username,
      timestamp: Date.now(),
      nasUrl: getAPIUrl(),
      sessionId: this.fileStationService.getSessionId()
    };
    localStorage.setItem('mysafebox_session', JSON.stringify(sessionData));
  }

  private clearSession(): void {
    localStorage.removeItem('mysafebox_session');
  }

  // Vérifier si la session est valide (15 minutes)
  static isSessionValid(): boolean {
    const sessionData = localStorage.getItem('mysafebox_session');
    if (!sessionData) return false;

    try {
      const { timestamp } = JSON.parse(sessionData);
      const now = Date.now();
      const sessionAge = now - timestamp;
      const maxAge = 15 * 60 * 1000; // 15 minutes

      return sessionAge < maxAge;
    } catch {
      return false;
    }
  }

  // Récupérer les données de session
  static getSessionData(): { username: string; nasUrl: string; sessionId?: string } | null {
    const sessionData = localStorage.getItem('mysafebox_session');
    if (!sessionData || !APIService.isSessionValid()) return null;

    try {
      return JSON.parse(sessionData);
    } catch {
      return null;
    }
  }

  // Restaurer la session existante
  restoreSession(sessionId: string): void {
    this.fileStationService.setSessionId(sessionId);
  }
}