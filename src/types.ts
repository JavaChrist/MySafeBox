export interface User {
  id: string;
  username: string;
  webdavUrl: string;
  webdavUsername: string;
  webdavPassword: string;
}

export interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: Date;
  path: string;
}

export interface FolderStructure {
  name: string;
  path: string;
  files: FileItem[];
  folders: FolderStructure[];
}