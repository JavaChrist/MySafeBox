import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, RefreshCw, Upload, FolderPlus, Download, Trash2,
  Search, Grid, List, ChevronRight, Home, CheckSquare, Square,
  SortAsc, SortDesc
} from 'lucide-react';
import type { AuthUser } from '../services/firebase-auth';
import { APIService } from '../services/api';
import type { FirebaseFileItem } from '../services/filestation-api';
import { getFileIcon, formatFileSize, formatDate, sortFiles } from '../utils/fileHelpers';

interface FileExplorerProps {
  apiService: APIService;
  user: AuthUser;
}

interface FileExplorerState {
  files: FirebaseFileItem[];
  currentPath: string;
  selectedFiles: string[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  viewMode: 'grid' | 'list';
  sortBy: 'name' | 'size' | 'date' | 'type';
  sortOrder: 'asc' | 'desc';
  showCreateFolderModal: boolean;
  showUploadModal: boolean;
  showDeleteModal: boolean;
  newFolderName: string;
  uploadProgress: number;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ apiService, user }) => {
  const [state, setState] = useState<FileExplorerState>({
    files: [],
    currentPath: '',
    selectedFiles: [],
    isLoading: true,
    error: null,
    searchTerm: '',
    viewMode: 'grid',
    sortBy: 'name',
    sortOrder: 'asc',
    showCreateFolderModal: false,
    showUploadModal: false,
    showDeleteModal: false,
    newFolderName: '',
    uploadProgress: 0
  });

  // Ref pour éviter les dépendances cycliques
  const currentPathRef = useRef(state.currentPath);
  currentPathRef.current = state.currentPath;

  // Charger les fichiers
  const loadFiles = useCallback(async (path: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const files = await apiService.listFiles(path);

      setState(prev => ({
        ...prev,
        files,
        currentPath: path,
        isLoading: false,
        selectedFiles: [] // Reset sélection
      }));
    } catch (error) {
      console.error('Load files error:', error);

      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des fichiers',
        isLoading: false
      }));
    }
  }, [apiService]);

  // Chargement initial
  useEffect(() => {
    loadFiles('');
  }, [loadFiles]);

  // Navigation vers un dossier
  const navigateToFolder = useCallback((folderName: string) => {
    const newPath = currentPathRef.current === ''
      ? folderName
      : `${currentPathRef.current}/${folderName}`;
    loadFiles(newPath);
  }, [loadFiles]);

  // Retour en arrière
  const goBack = useCallback(() => {
    if (currentPathRef.current === '') return;

    const pathParts = currentPathRef.current.split('/').filter(p => p);
    pathParts.pop();
    const newPath = pathParts.length === 0 ? '' : pathParts.join('/');
    loadFiles(newPath);
  }, [loadFiles]);

  // Recharger le dossier actuel
  const reloadCurrentFolder = useCallback(() => {
    loadFiles(currentPathRef.current);
  }, [loadFiles]);

  // Aller à la racine
  const goHome = useCallback(() => {
    loadFiles('');
  }, [loadFiles]);

  // Gestion de la sélection (fichiers ET dossiers)
  const toggleFileSelection = (filename: string) => {
    setState(prev => ({
      ...prev,
      selectedFiles: prev.selectedFiles.includes(filename)
        ? prev.selectedFiles.filter(f => f !== filename)
        : [...prev.selectedFiles, filename]
    }));
  };

  // Navigation vers un dossier (double-clic ou icône spéciale)
  const handleItemClick = (file: FirebaseFileItem, event: React.MouseEvent) => {
    if (file.isdir) {
      // Pour les dossiers : Ctrl+clic = sélection, clic simple = navigation
      if (event.ctrlKey || event.metaKey) {
        toggleFileSelection(file.name);
      } else {
        navigateToFolder(file.name);
      }
    } else {
      // Pour les fichiers : toujours sélection
      toggleFileSelection(file.name);
    }
  };

  // Sélectionner tout / Désélectionner tout
  const toggleSelectAll = () => {
    setState(prev => ({
      ...prev,
      selectedFiles: prev.selectedFiles.length === prev.files.length
        ? []
        : prev.files.map(f => f.name)
    }));
  };

  // Créer un nouveau dossier
  const handleCreateFolder = async () => {
    // Validation du nom de dossier
    if (!state.newFolderName.trim()) {
      setState(prev => ({
        ...prev,
        error: 'Veuillez entrer un nom de dossier'
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const success = await apiService.createFolder(currentPathRef.current, state.newFolderName);

      if (success) {
        // Recharger les fichiers et fermer la modal
        await reloadCurrentFolder();
        setState(prev => ({
          ...prev,
          showCreateFolderModal: false,
          newFolderName: '',
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Create folder error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur lors de la création du dossier',
        isLoading: false,
        showCreateFolderModal: false,
        newFolderName: ''
      }));
    }
  };

  // Upload de fichiers
  const handleUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, uploadProgress: 0 }));

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;

        await apiService.uploadFile(file, currentPathRef.current, (fileProgress) => {
          const totalProgress = ((i / files.length) * 100) + (fileProgress / files.length);
          setState(prev => ({ ...prev, uploadProgress: totalProgress }));
        });

        setState(prev => ({ ...prev, uploadProgress: progress }));
      }

      // Recharger les fichiers
      await reloadCurrentFolder();
      setState(prev => ({
        ...prev,
        showUploadModal: false,
        isLoading: false,
        uploadProgress: 0
      }));
    } catch (error) {
      console.error('Upload error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'upload',
        isLoading: false,
        uploadProgress: 0
      }));
    }
  };

  // Ouvrir la modale de suppression
  const openDeleteModal = () => {
    if (state.selectedFiles.length === 0) return;
    setState(prev => ({ ...prev, showDeleteModal: true }));
  };

  // Supprimer les fichiers sélectionnés
  const handleDeleteSelected = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, showDeleteModal: false }));

      const pathsToDelete = state.selectedFiles.map(filename => {
        return currentPathRef.current === '' ? filename : `${currentPathRef.current}/${filename}`;
      });

      const success = await apiService.deleteFiles(pathsToDelete);

      if (success) {
        // Recharger les fichiers
        await reloadCurrentFolder();
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Delete error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression',
        isLoading: false
      }));
    }
  };

  // Télécharger un fichier
  const handleDownload = async (file: FirebaseFileItem) => {
    if (file.isdir) return; // Ne pas télécharger les dossiers

    try {
      const filePath = currentPathRef.current === '' ? file.name : `${currentPathRef.current}/${file.name}`;
      await apiService.downloadFile(filePath, file.name);
    } catch (error) {
      console.error('Download error:', error);
      setState(prev => ({
        ...prev,
        error: 'Erreur lors du téléchargement'
      }));
    }
  };

  // Tri
  const handleSort = (newSortBy: typeof state.sortBy) => {
    setState(prev => ({
      ...prev,
      sortBy: newSortBy,
      sortOrder: prev.sortBy === newSortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Fichiers filtrés et triés
  const filteredAndSortedFiles = React.useMemo(() => {
    let filtered = state.files;

    // Filtrage par recherche
    if (state.searchTerm) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(state.searchTerm.toLowerCase())
      );
    }

    // Tri
    return sortFiles(filtered, state.sortBy, state.sortOrder);
  }, [state.files, state.searchTerm, state.sortBy, state.sortOrder]);

  // Breadcrumb
  const breadcrumbParts = state.currentPath === '' ? [] : state.currentPath.split('/').filter(p => p);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header avec navigation */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        {/* Barre de navigation */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={goBack}
            disabled={state.currentPath === '/'}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={goHome}
            className="btn-secondary"
          >
            <Home className="w-4 h-4" />
          </button>

          <button
            onClick={reloadCurrentFolder}
            disabled={state.isLoading}
            className="btn-secondary disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${state.isLoading ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex-1" />

          {/* Actions */}
          <input
            type="file"
            multiple
            className="hidden"
            id="file-upload"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
          {state.currentPath !== '/' && (
            <button
              className="btn-primary"
              onClick={() => document.getElementById('file-upload')?.click()}
              title="Upload de fichiers"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </button>
          )}

          {state.currentPath !== '/' && (
            <button
              className="btn-secondary"
              onClick={() => setState(prev => ({ ...prev, showCreateFolderModal: true }))}
              title="Nouveau dossier"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Nouveau
            </button>
          )}

          {state.selectedFiles.length > 0 && (
            <button
              className="btn-secondary bg-red-600 hover:bg-red-700 text-white"
              onClick={openDeleteModal}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </button>
          )}
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-gray-300 mb-4">
          <span className="text-blue-400 cursor-pointer" onClick={goHome}>
            {user.displayName || user.email}
          </span>
          {breadcrumbParts.map((part, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-4 h-4 text-gray-500" />
              <span
                className={index === breadcrumbParts.length - 1 ? 'text-white' : 'text-blue-400 cursor-pointer'}
                onClick={() => {
                  if (index < breadcrumbParts.length - 1) {
                    const newPath = '/' + breadcrumbParts.slice(0, index + 1).join('/');
                    loadFiles(newPath);
                  }
                }}
              >
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Barre de recherche et options */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher des fichiers..."
              value={state.searchTerm}
              onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="input-standard pl-10"
            />
          </div>

          <div className="flex gap-1 bg-gray-700 rounded-md p-1">
            <button
              onClick={() => setState(prev => ({ ...prev, viewMode: 'grid' }))}
              className={`p-2 rounded ${state.viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, viewMode: 'list' }))}
              className={`p-2 rounded ${state.viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-auto p-4">
        {state.isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-300">Chargement...</span>
          </div>
        ) : state.error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-400 mb-2">{state.error}</div>
              <button onClick={reloadCurrentFolder} className="btn-primary">
                Réessayer
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header de liste avec tri */}
            {state.viewMode === 'list' && filteredAndSortedFiles.length > 0 && (
              <div className="flex items-center gap-4 pb-2 mb-4 border-b border-gray-700 text-sm text-gray-400">
                <div className="w-8">
                  <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white">
                    {state.selectedFiles.length === state.files.length ?
                      <CheckSquare className="w-4 h-4" /> :
                      <Square className="w-4 h-4" />
                    }
                  </button>
                </div>
                <div className="flex-1 cursor-pointer flex items-center gap-1" onClick={() => handleSort('name')}>
                  Nom
                  {state.sortBy === 'name' && (
                    state.sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                  )}
                </div>
                <div className="w-24 cursor-pointer flex items-center gap-1" onClick={() => handleSort('size')}>
                  Taille
                  {state.sortBy === 'size' && (
                    state.sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                  )}
                </div>
                <div className="w-32 cursor-pointer flex items-center gap-1" onClick={() => handleSort('date')}>
                  Modifié
                  {state.sortBy === 'date' && (
                    state.sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                  )}
                </div>
                <div className="w-20">Actions</div>
              </div>
            )}

            {/* Message informatif dans le dossier racine */}
            {state.currentPath === '' && (
              <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 text-blue-300">
                  <Home className="w-5 h-5" />
                  <div>
                    <div className="font-medium">Bienvenue {user.displayName || user.email}</div>
                    <div className="text-sm text-blue-400">
                      Voici votre coffre-fort personnel sécurisé sur Firebase
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Liste/Grille des fichiers */}
            {filteredAndSortedFiles.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                {state.searchTerm ? 'Aucun fichier trouvé' : 'Ce dossier est vide'}
              </div>
            ) : state.viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredAndSortedFiles.map((file) => {
                  const { icon: IconComponent, color } = getFileIcon(file.name, file.isdir);
                  const isSelected = state.selectedFiles.includes(file.name);

                  return (
                    <div
                      key={file.name}
                      className={`card hover:bg-gray-700 cursor-pointer transition-colors relative ${isSelected ? 'ring-2 ring-blue-500' : ''
                        }`}
                      onClick={(e) => handleItemClick(file, e)}
                    >
                      <div className="text-center">
                        <IconComponent className={`w-12 h-12 mx-auto mb-2 ${color}`} />
                        <div className="text-sm text-white truncate" title={file.name}>
                          {file.name}
                        </div>
                        {!file.isdir && (
                          <div className="text-xs text-gray-400 mt-1">
                            {formatFileSize(file.size)}
                          </div>
                        )}
                      </div>

                      {/* Checkbox pour fichiers ET dossiers */}
                      <div
                        className="absolute top-2 right-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFileSelection(file.name);
                        }}
                      >
                        {isSelected ?
                          <CheckSquare className="w-4 h-4 text-blue-500" /> :
                          <Square className="w-4 h-4 text-gray-400 hover:text-white" />
                        }
                      </div>


                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredAndSortedFiles.map((file) => {
                  const { icon: IconComponent, color } = getFileIcon(file.name, file.isdir);
                  const isSelected = state.selectedFiles.includes(file.name);

                  return (
                    <div
                      key={file.name}
                      className={`flex items-center gap-4 p-3 rounded-md hover:bg-gray-800 cursor-pointer transition-colors ${isSelected ? 'bg-gray-800 ring-2 ring-blue-500' : ''
                        }`}
                      onClick={(e) => handleItemClick(file, e)}
                    >
                      <div className="w-8">
                        {/* Checkbox pour fichiers ET dossiers */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFileSelection(file.name);
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          {isSelected ?
                            <CheckSquare className="w-4 h-4 text-blue-500" /> :
                            <Square className="w-4 h-4" />
                          }
                        </button>
                      </div>

                      <IconComponent className={`w-6 h-6 ${color} flex-shrink-0`} />

                      <div className="flex-1 min-w-0">
                        <div className="text-white truncate">{file.name}</div>
                      </div>

                      <div className="w-24 text-sm text-gray-400 text-right">
                        {formatFileSize(file.size)}
                      </div>

                      <div className="w-32 text-sm text-gray-400">
                        {formatDate(file.lastModified)}
                      </div>

                      <div className="w-20 flex gap-1">
                        {!file.isdir && (
                          <>
                            <button
                              className="p-1 text-gray-400 hover:text-white rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Download action
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1 text-gray-400 hover:text-red-400 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Delete action
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer avec actions sélection */}
      {state.selectedFiles.length > 0 && (
        <div className="bg-gray-800 border-t border-gray-700 p-4 flex items-center gap-4">
          <span className="text-gray-300">
            {state.selectedFiles.length} fichier(s) sélectionné(s)
          </span>
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              onClick={() => {
                // Télécharger le premier fichier sélectionné (pour l'instant)
                const selectedFile = state.files.find(f => f.name === state.selectedFiles[0]);
                if (selectedFile) handleDownload(selectedFile);
              }}
              disabled={state.selectedFiles.length !== 1}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </button>
            <button
              className="btn-secondary text-red-400 hover:text-red-300"
              onClick={openDeleteModal}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </button>
          </div>
        </div>
      )}

      {/* Modal création de dossier */}
      {state.showCreateFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Nouveau dossier</h3>
            <input
              type="text"
              placeholder="Nom du dossier"
              value={state.newFolderName}
              onChange={(e) => setState(prev => ({ ...prev, newFolderName: e.target.value }))}
              className="input-standard w-full mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                className="btn-secondary"
                onClick={() => setState(prev => ({
                  ...prev,
                  showCreateFolderModal: false,
                  newFolderName: ''
                }))}
              >
                Annuler
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateFolder}
                disabled={!state.newFolderName.trim() || state.isLoading}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {state.showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Confirmer la suppression</h3>
            <p className="text-gray-300 mb-6">
              Êtes-vous sûr de vouloir supprimer {state.selectedFiles.length} élément(s) ?
              <br />
              <span className="text-yellow-400 text-sm">
                ⚠️ Les dossiers seront supprimés avec tout leur contenu
              </span>
              <br />
              <span className="text-red-400 text-sm">Cette action est irréversible.</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="btn-secondary"
                onClick={() => setState(prev => ({ ...prev, showDeleteModal: false }))}
              >
                Annuler
              </button>
              <button
                className="btn-primary bg-red-600 hover:bg-red-700"
                onClick={handleDeleteSelected}
                disabled={state.isLoading}
              >
                {state.isLoading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};