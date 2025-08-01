import React, { useState, useEffect } from 'react';
import {
  Folder,
  File,
  Upload,
  FolderPlus,
  ArrowLeft,
  Download,
  Trash2,
  Image,
  FileText,
  RefreshCw,
  CheckSquare,
  Square
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
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    setIsLoading(true);
    // Réinitialiser la sélection quand on change de dossier
    setSelectedFiles(new Set());
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

  const handleMultipleDownload = async () => {
    if (selectedFiles.size === 0) {
      onError('Aucun élément sélectionné');
      return;
    }

    setIsDownloading(true);
    const filesToDownload = files.filter(file =>
      file.type === 'file' && selectedFiles.has(file.path)
    );

    if (filesToDownload.length === 0) {
      onError('Aucun fichier sélectionné (les dossiers ne peuvent pas être téléchargés)');
      setIsDownloading(false);
      return;
    }

    try {
      for (const file of filesToDownload) {
        await handleDownload(file);
        // Petite pause entre les téléchargements
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      onSuccess(`${filesToDownload.length} fichier(s) téléchargé(s)`);
      setSelectedFiles(new Set());
    } catch (error) {
      onError('Erreur lors du téléchargement multiple');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMultipleDelete = async () => {
    if (selectedFiles.size === 0) {
      onError('Aucun élément sélectionné');
      return;
    }

    const itemsToDelete = files.filter(file => selectedFiles.has(file.path));

    try {
      for (const item of itemsToDelete) {
        await webdavService.deleteFile(item.path);
      }
      const fileCount = itemsToDelete.filter(item => item.type === 'file').length;
      const folderCount = itemsToDelete.filter(item => item.type === 'directory').length;

      let message = '';
      if (fileCount > 0 && folderCount > 0) {
        message = `${fileCount} fichier(s) et ${folderCount} dossier(s) supprimé(s)`;
      } else if (fileCount > 0) {
        message = `${fileCount} fichier(s) supprimé(s)`;
      } else {
        message = `${folderCount} dossier(s) supprimé(s)`;
      }

      onSuccess(message);
      setSelectedFiles(new Set());
      loadFiles();
    } catch (error) {
      onError('Erreur lors de la suppression multiple');
    }
  };

  const toggleFileSelection = (filePath: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const selectAllFiles = () => {
    const allItemPaths = files.map(file => file.path);
    setSelectedFiles(new Set(allItemPaths));
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  const handleDeleteFile = async () => {
    if (!selectedFile) return;

    try {
      await webdavService.deleteFile(selectedFile.path);
      onSuccess(`"${selectedFile.name}" supprimé avec succès`);
      loadFiles();
    } catch (error) {
      onError('Erreur lors de la suppression');
    }
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
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 hover:shadow-lg rounded-md transition-all shadow-md"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Nouveau dossier</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 hover:shadow-lg rounded-md transition-all shadow-md"
          >
            <Upload className="h-4 w-4" />
            <span>Uploader</span>
          </button>
          <button
            onClick={handleMultipleDownload}
            disabled={selectedFiles.size === 0 || isDownloading}
            className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white rounded-md transition-all shadow-md ${selectedFiles.size === 0 || isDownloading
                ? 'bg-orange-500 opacity-50 cursor-not-allowed saturate-75'
                : 'bg-orange-500 hover:bg-orange-600 hover:shadow-lg'
              }`}
          >
            <Download className="h-4 w-4" />
            <span>{isDownloading ? 'Téléchargement...' : `Télécharger (${files.filter(f => f.type === 'file' && selectedFiles.has(f.path)).length})`}</span>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={selectedFiles.size === 0}
            className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white rounded-md transition-all shadow-md ${selectedFiles.size === 0
                ? 'bg-red-500 opacity-50 cursor-not-allowed saturate-75'
                : 'bg-red-500 hover:bg-red-600 hover:shadow-lg'
              }`}
          >
            <Trash2 className="h-4 w-4" />
            <span>Supprimer ({selectedFiles.size})</span>
          </button>
        </div>
      </div>

      {/* Selection Controls */}
      {files.length > 0 && (
        <div className="px-4 pb-2 border-b border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-3">
              <button
                onClick={selectAllFiles}
                className="hover:text-white transition-colors"
              >
                Sélectionner tout
              </button>
              <span>•</span>
              <button
                onClick={clearSelection}
                className="hover:text-white transition-colors"
              >
                Désélectionner tout
              </button>
            </div>
            <span>{selectedFiles.size} élément(s) sélectionné(s)</span>
          </div>
        </div>
      )}

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
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${selectedFiles.has(file.path)
                  ? 'bg-blue-700 hover:bg-blue-600'
                  : 'bg-gray-700 hover:bg-gray-600'
                  } cursor-pointer`}
              >
                <div className="flex items-center space-x-3">
                  {/* Checkbox pour tous les éléments */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFileSelection(file.path);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {selectedFiles.has(file.path) ? (
                      <CheckSquare className="h-4 w-4 text-blue-400" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>

                  <div
                    onClick={() => file.type === 'directory' ? handleFolderClick(file) : toggleFileSelection(file.path)}
                    className="flex items-center space-x-3 flex-1"
                  >
                    {getFileIcon(file)}
                    <div>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-gray-400 text-sm">
                        {file.type === 'file' && file.size && formatFileSize(file.size)}
                        {file.lastModified && ` • ${formatDate(file.lastModified)}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



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
          setSelectedFiles(new Set());
        }}
        title="Confirmer la suppression"
        message={selectedFiles.size > 0
          ? (() => {
            const selectedItems = files.filter(f => selectedFiles.has(f.path));
            const fileCount = selectedItems.filter(item => item.type === 'file').length;
            const folderCount = selectedItems.filter(item => item.type === 'directory').length;

            let itemText = '';
            if (fileCount > 0 && folderCount > 0) {
              itemText = `${fileCount} fichier(s) et ${folderCount} dossier(s)`;
            } else if (fileCount > 0) {
              itemText = `${fileCount} fichier(s)`;
            } else {
              itemText = `${folderCount} dossier(s)`;
            }

            return `Êtes-vous sûr de vouloir supprimer ${itemText} sélectionné(s) ? Cette action est irréversible.`;
          })()
          : selectedFile
            ? `Êtes-vous sûr de vouloir supprimer "${selectedFile.name}" ? Cette action est irréversible.`
            : 'Aucun élément sélectionné'
        }
        type="error"
        onConfirm={() => {
          if (selectedFiles.size > 0) {
            handleMultipleDelete();
          } else if (selectedFile) {
            handleDeleteFile();
            setSelectedFile(null);
          }
          setShowDeleteModal(false);
        }}
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