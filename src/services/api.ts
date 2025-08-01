/**
 * Service API pour communiquer avec le proxy WebDAV
 * Contourne les problèmes CORS en passant par un serveur Express
 */

const API_BASE_URL = 'http://localhost:3030/api';

interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  files?: T;
  details?: string;
  status?: number;
}

export class APIService {
  private username: string;
  private password: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }

  private async makeRequest<T>(endpoint: string, data: any = {}): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
          ...data
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erreur API ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Test de connexion WebDAV
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.makeRequest('/webdav/test');
      return result.success;
    } catch (error: any) {
      throw new Error(`Test de connexion échoué: ${error?.message || 'Erreur inconnue'}`);
    }
  }

  /**
   * Listing des fichiers/dossiers
   */
  async listFiles(path: string = ''): Promise<any[]> {
    try {
      const result = await this.makeRequest('/webdav/list', { path });
      return (result as any).files || [];
    } catch (error: any) {
      throw new Error(`Impossible de lister les fichiers: ${error?.message || 'Erreur inconnue'}`);
    }
  }

  /**
   * Création d'un dossier
   */
  async createDirectory(path: string, name: string): Promise<void> {
    try {
      const result = await this.makeRequest('/webdav/mkdir', { path, name });
      if (!result.success) {
        throw new Error(result.message || 'Création de dossier échouée');
      }
    } catch (error: any) {
      throw new Error(`Impossible de créer le dossier: ${error?.message || 'Erreur inconnue'}`);
    }
  }

  /**
   * Upload d'un fichier
   */
  async uploadFile(path: string, file: File): Promise<void> {
    try {
      // Convertir le fichier en base64
      const fileData = await this.fileToBase64(file);

      const result = await this.makeRequest('/webdav/upload', {
        path,
        fileName: file.name,
        fileData
      });

      if (!result.success) {
        throw new Error(result.message || 'Upload échoué');
      }
    } catch (error: any) {
      throw new Error(`Impossible d'uploader le fichier: ${error?.message || 'Erreur inconnue'}`);
    }
  }

  /**
   * Téléchargement d'un fichier
   */
  async downloadFile(path: string, _filename: string): Promise<ArrayBuffer> {
    try {
      const result = await this.makeRequest('/webdav/download', { path });

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Download échoué');
      }

      // Convertir base64 en ArrayBuffer
      const binaryString = atob((result as any).data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return bytes.buffer;
    } catch (error: any) {
      throw new Error(`Impossible de télécharger le fichier: ${error?.message || 'Erreur inconnue'}`);
    }
  }

  /**
   * Suppression d'un fichier/dossier
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const result = await this.makeRequest('/webdav/delete', { path });
      if (!result.success) {
        throw new Error(result.message || 'Suppression échouée');
      }
    } catch (error: any) {
      throw new Error(`Impossible de supprimer: ${error?.message || 'Erreur inconnue'}`);
    }
  }

  /**
   * Déplacement d'un fichier/dossier
   */
  async moveFile(_fromPath: string, _toPath: string): Promise<void> {
    try {
      // Pour l'instant, on fait un download -> upload -> delete
      // (Le proxy peut être étendu pour supporter MOVE directement)
      throw new Error('Fonctionnalité de déplacement pas encore implémentée via API');
    } catch (error: any) {
      throw new Error(`Impossible de déplacer: ${error?.message || 'Erreur inconnue'}`);
    }
  }

  /**
   * Utilitaire: Convertir File en base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Retirer le préfixe "data:mime/type;base64,"
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Test de santé du proxy
   */
  static async checkProxyHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const result = await response.json();
      return result.status === 'OK';
    } catch (error) {
      console.error('Proxy non accessible:', error);
      return false;
    }
  }
}