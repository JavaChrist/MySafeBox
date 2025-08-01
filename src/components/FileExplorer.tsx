import React, { useState, useEffect } from 'react';
import {
  Folder,
  File,
  Upload,
  FolderPlus,
  ArrowLeft,
  Download,
  Trash2,
  MoreVertical,
  Image,
  FileText,
  RefreshCw
} from 'lucide-react';
import { WebDAVAPIService } from '../services/webdav-api';
import { FileItem } from '../types';
import Modal from './Modal';
import FileUpload from './FileUpload';

interface FileExplorerProps {
  webdavService: WebDAVAPIService;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ webdavService, onError, onSuccess }) => {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const fileList = await webdavService.listFiles(currentPath);
      setFiles(fileList.sort((a, b) => {
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      }));
    } catch (error) {
      onError('Erreur lors du chargement des fichiers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = (folder: FileItem) => {
    if (folder.type === 'directory') {
      setCurrentPath(folder.path);
    }
  };

  const handleBackClick = () => {
    const pathParts = currentPath.split('/').filter(part => part !== '');
    pathParts.pop();
    setCurrentPath(pathParts.join('/'));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      onError('Le nom du dossier ne peut pas être vide');
      return;
    }

    try {
      await webdavService.createDirectory(currentPath, newFolderName);
      onSuccess(`Dossier "${newFolderName}" créé avec succès`);
      setNewFolderName('');
      setShowNewFolderModal(false);
      loadFiles();
    } catch (error) {
      onError('Erreur lors de la création du dossier');
    }
  };

  const handleDeleteFile = async () => {
    if (!selectedFile) return;

    try {
      await webdavService.deleteFile(selectedFile.path);
      onSuccess(`"${selectedFile.name}" supprimé avec succès`);
      setShowDeleteModal(false);
      setSelectedFile(null);
      loadFiles();
    } catch (error) {
      onError('Erreur lors de la suppression');
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const content = await webdavService.downloadFile(file.path);
      const blob = new Blob([content]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onSuccess(`"${file.name}" téléchargé avec succès`);
    } catch (error) {
      onError('Erreur lors du téléchargement');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setSelectedFile(file);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'directory') {
      return <Folder className="h-6 w-6 text-blue-500" />;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="h-6 w-6 text-green-500" />;
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(extension || '')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    }
    return <File className="h-6 w-6 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          {currentPath && (
            <button
              onClick={handleBackClick}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Retour"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="text-gray-300">
            <span className="text-sm">
              {currentPath ? `/${currentPath}` : '/'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadFiles}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Actualiser"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Nouveau dossier</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Uploader</span>
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="animate-spin h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400">Chargement...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8">
            <Folder className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Ce dossier est vide</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors"
                onClick={() => handleFolderClick(file)}
                onContextMenu={(e) => handleContextMenu(e, file)}
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div>
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-gray-400 text-sm">
                      {file.type === 'file' && file.size && formatFileSize(file.size)}
                      {file.lastModified && ` • ${formatDate(file.lastModified)}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, file);
                  }}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && selectedFile && (
        <div
          className="fixed bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50 py-2"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
          onMouseLeave={() => setShowContextMenu(false)}
        >
          {selectedFile.type === 'file' && (
            <button
              onClick={() => {
                handleDownload(selectedFile);
                setShowContextMenu(false);
              }}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
              <span>Télécharger</span>
            </button>
          )}
          <button
            onClick={() => {
              setShowDeleteModal(true);
              setShowContextMenu(false);
            }}
            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
          >
            <Trash2 className="h-4 w-4" />
            <span>Supprimer</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={showNewFolderModal}
        onClose={() => {
          setShowNewFolderModal(false);
          setNewFolderName('');
        }}
        title="Créer un nouveau dossier"
        message=""
        onConfirm={handleCreateFolder}
        confirmText="Créer"
      >
        <div className="mb-4">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nom du dossier"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedFile(null);
        }}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedFile?.name}" ? Cette action est irréversible.`}
        type="error"
        onConfirm={handleDeleteFile}
        confirmText="Supprimer"
      />

      <FileUpload
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        webdavService={webdavService}
        currentPath={currentPath}
        onSuccess={(message) => {
          onSuccess(message);
          loadFiles();
        }}
        onError={onError}
      />
    </div>
  );
};

export default FileExplorer;