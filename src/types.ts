export interface User {
  id: string;
  username: string;
  nasUrl: string;
  webdavUsername: string;
  webdavPassword: string;
}

export interface FileItem {
  name: string;
  type: "file" | "directory";
  size?: number;
  lastModified?: Date;
  path: string;
  isdir?: boolean;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

export interface ConnectionInfo {
  type: "LOCAL" | "DISTANT";
  url: string;
  displayUrl: string;
  isSecure: boolean;
  icon: string;
  badge: string;
}