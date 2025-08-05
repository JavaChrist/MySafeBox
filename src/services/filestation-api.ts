import type { User, FileItem } from '../types';

export class FileStationService {
  private baseUrl: string;
  private user: User;
  private sessionId: string | null = null;

  constructor(baseUrl: string, user: User) {
    this.baseUrl = baseUrl;
    this.user = user;
  }

  // Getter/Setter pour sessionId
  getSessionId(): string | null {
    return this.sessionId;
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  // Authentification via FileStation API
  async login(username: string, password: string): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.append('api', 'SYNO.API.Auth');
      params.append('version', '3');
      params.append('method', 'login');
      params.append('account', username);
      params.append('passwd', password);
      params.append('session', 'FileStation');
      params.append('format', 'sid');

      console.log('🔗 API URL utilisée:', `${this.baseUrl}/webapi/auth.cgi`);
      console.log('📊 Paramètres:', params.toString());

      const response = await fetch(`${this.baseUrl}/webapi/auth.cgi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });

      const data = await response.json();
      console.log('🔍 Réponse complète:', data);

      if (data.success) {
        this.sessionId = data.data?.sid || 'authenticated';
        console.log('Connexion réussie !');
        return true;
      } else {
        console.error('Login failed:', data);
        console.error('Code erreur:', data.error?.code);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  // Déconnexion
  async logout(): Promise<void> {
    if (!this.sessionId) return;

    try {
      const formData = new FormData();
      formData.append('api', 'SYNO.API.Auth');
      formData.append('version', '3');
      formData.append('method', 'logout');
      formData.append('session', 'FileStation');

      await fetch(`${this.baseUrl}/webapi/auth.cgi`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      this.sessionId = null;
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Lister les fichiers d'un répertoire
  async listFiles(path: string): Promise<FileItem[]> {
    if (!this.sessionId) throw new Error('Not authenticated');

    try {
      // Si c'est la racine, lister les shared folders d'abord
      if (path === '/') {
        console.log('Listing shared folders...');

        const params = new URLSearchParams({
          api: 'SYNO.FileStation.List',
          version: '2',
          method: 'list_share',
          _sid: this.sessionId
        });

        console.log('🔗 Shared folders params:', params.toString());

        const response = await fetch(`${this.baseUrl}/webapi/entry.cgi?${params}`);
        const data = await response.json();

        console.log('🔍 Shared folders response:', data);
        console.log('Nombre de dossiers partagés:', data.data?.shares?.length || 0);
        console.log('📋 Liste des dossiers:', data.data?.shares?.map((s: any) => s.name) || []);

        if (data.success) {
          return data.data.shares.map((share: any) => ({
            name: share.name,
            type: 'directory',
            size: 0,
            lastModified: new Date(),
            path: share.path,
            isdir: true
          }));
        } else {
          throw new Error(data.error?.code || 'Failed to list shared folders');
        }
      } else {
        // Pour les autres chemins, lister normalement
        const params = new URLSearchParams({
          api: 'SYNO.FileStation.List',
          version: '2',
          method: 'list',
          folder_path: path,
          additional: '["real_path","size","time","perm","type"]',
          _sid: this.sessionId
        });

        console.log('🔗 Listing path:', path);
        console.log('📊 List params:', params.toString());

        const response = await fetch(`${this.baseUrl}/webapi/entry.cgi?${params}`);
        const data = await response.json();

        console.log('🔍 List response:', data);
        console.log('Exemple de fichier:', data.data?.files?.[0]);

        if (data.success) {
          return data.data.files.map((file: any) => ({
            name: file.name,
            type: file.isdir ? 'directory' : 'file',
            size: file.size || 0,
            lastModified: file.time?.mtime ? new Date(file.time.mtime * 1000) : new Date(),
            path: file.path,
            isdir: file.isdir
          }));
        } else {
          throw new Error(data.error?.code || 'Failed to list files');
        }
      }
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  }

  // Créer un dossier
  async createFolder(path: string, name: string): Promise<boolean> {
    if (!this.sessionId) throw new Error('Not authenticated');

    try {
      const params = new URLSearchParams({
        api: 'SYNO.FileStation.CreateFolder',
        version: '2',
        method: 'create',
        folder_path: path,
        name: name,
        _sid: this.sessionId
      });

      console.log('Creating folder:', name, 'in:', path);

      const response = await fetch(`${this.baseUrl}/webapi/entry.cgi?${params}`);
      const data = await response.json();

      console.log('🔍 Create folder response:', data);

      if (!data.success && data.error) {
        console.error('Create folder error code:', data.error.code);
        throw new Error(`Erreur ${data.error.code}: Impossible de créer le dossier`);
      }

      return data.success;
    } catch (error) {
      console.error('Create folder error:', error);
      return false;
    }
  }

  // Upload un fichier
  async uploadFile(file: File, path: string): Promise<boolean> {
    if (!this.sessionId) throw new Error('Not authenticated');

    try {
      const formData = new FormData();
      formData.append('api', 'SYNO.FileStation.Upload');
      formData.append('version', '2');
      formData.append('method', 'upload');
      formData.append('path', path);
      formData.append('create_parents', 'true');
      formData.append('overwrite', 'true');
      formData.append('_sid', this.sessionId);
      formData.append('file', file);

      console.log('📤 Uploading file:', file.name, 'to:', path);

      const response = await fetch(`${this.baseUrl}/webapi/entry.cgi`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      console.log('🔍 Upload response:', data);

      return data.success;
    } catch (error) {
      console.error('Upload error:', error);
      return false;
    }
  }

  // Supprimer des fichiers/dossiers
  async deleteFiles(paths: string[]): Promise<boolean> {
    if (!this.sessionId) throw new Error('Not authenticated');

    try {
      const params = new URLSearchParams({
        api: 'SYNO.FileStation.Delete',
        version: '2',
        method: 'delete',
        path: paths.join(','),
        _sid: this.sessionId
      });

      console.log('🗑️ Deleting files:', paths);

      const response = await fetch(`${this.baseUrl}/webapi/entry.cgi?${params}`);
      const data = await response.json();

      console.log('🔍 Delete response:', data);

      return data.success;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  // Télécharger un fichier
  async downloadFile(path: string, filename: string): Promise<void> {
    if (!this.sessionId) throw new Error('Not authenticated');

    try {
      const params = new URLSearchParams({
        api: 'SYNO.FileStation.Download',
        version: '2',
        method: 'download',
        path: path,
        mode: 'download',
        _sid: this.sessionId
      });

      console.log('📥 Downloading file:', filename, 'from:', path);

      const response = await fetch(`${this.baseUrl}/webapi/entry.cgi?${params}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log('Download completed:', filename);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  // Créer automatiquement le dossier utilisateur
  async ensureUserFolder(): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('api', 'SYNO.FileStation.CreateFolder');
      formData.append('version', '2');
      formData.append('method', 'create');
      formData.append('folder_path', '/VaultsBackup');
      formData.append('name', this.user.username);

      const response = await fetch(`${this.baseUrl}/webapi/entry.cgi`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();
      // Retourne true même si le dossier existe déjà
      return data.success || data.error?.code === 406;
    } catch (error) {
      console.error('Ensure user folder error:', error);
      return false;
    }
  }
}