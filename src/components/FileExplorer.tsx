import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, RefreshCw, Upload, FolderPlus, Download, Trash2,
  Search, Grid, List, ChevronRight, Home, CheckSquare, Square,
  SortAsc, SortDesc, Eye, Pencil
} from 'lucide-react';
import type { AuthUser } from '../services/firebase-auth';
import { APIService } from '../services/api';
import type { FirebaseFileItem } from '../services/filestation-api';
import { getFileIcon, formatFileSize, formatDate, sortFiles, validateEntryName } from '../utils/fileHelpers';
import { FilePreviewModal } from './FilePreviewModal';

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
  previewFile: FirebaseFileItem | null;
  renameTarget: FirebaseFileItem | null;
  renameValue: string;
  renameError: string | null;
  isRenaming: boolean;
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
    uploadProgress: 0,
    previewFile: null,
    renameTarget: null,
    renameValue: '',
    renameError: null,
    isRenaming: false
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

  // Upload (tente d'utiliser le sélecteur fichiers natif Android/Chrome si dispo)
  const handleClickUpload = useCallback(async () => {
    try {
      const isAndroid = /Android/i.test(navigator.userAgent);
      const win = window as unknown as {
        showOpenFilePicker?: (options?: unknown) => Promise<Array<{ getFile: () => Promise<File> }>>;
      };

      if (isAndroid && typeof win.showOpenFilePicker === 'function') {
        // Utilise le File System Access API (Android/Chrome) pour ouvrir "Documents/Fichiers"
        const handles = await win.showOpenFilePicker({
          multiple: true,
          types: [
            {
              description: 'Tous les fichiers',
              accept: { '*/*': ['.'] }
            }
          ]
        });

        setState(prev => ({ ...prev, isLoading: true, uploadProgress: 0 }));
        for (let i = 0; i < handles.length; i++) {
          const file = await handles[i].getFile();
          await apiService.uploadFile(file, currentPathRef.current, (p) => {
            const total = ((i / handles.length) * 100) + (p / handles.length);
            setState(prev => ({ ...prev, uploadProgress: total }));
          });
        }
        await reloadCurrentFolder();
        setState(prev => ({ ...prev, isLoading: false, uploadProgress: 0 }));
        return;
      }
    } catch (err) {
      console.warn('Sélecteur fichiers natif indisponible, fallback input:', err);
    }

    // Fallback: input file caché
    document.getElementById('file-upload')?.click();
  }, [apiService, reloadCurrentFolder]);

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

  const openPreview = (file: FirebaseFileItem) => {
    if (file.isdir) return;
    setState(prev => ({ ...prev, previewFile: file }));
  };

  const openRename = (file: FirebaseFileItem) => {
    setState(prev => ({
      ...prev,
      renameTarget: file,
      renameValue: file.name,
      renameError: null
    }));
  };

  // Dossier : ouverture. Fichier : aperçu. Ctrl/Cmd+clic : sélection.
  const handleItemClick = (file: FirebaseFileItem, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      toggleFileSelection(file.name);
      return;
    }
    if (file.isdir) {
      navigateToFolder(file.name);
      return;
    }
    openPreview(file);
  };

  const handleRename = async () => {
    if (!state.renameTarget) return;

    let safeName = '';
    try {
      safeName = validateEntryName(state.renameValue);
    } catch (error) {
      setState(prev => ({
        ...prev,
        renameError: error instanceof Error ? error.message : 'Nom invalide'
      }));
      return;
    }

    if (safeName === state.renameTarget.name) {
      setState(prev => ({ ...prev, renameTarget: null, renameValue: '', renameError: null }));
      return;
    }

    const target = state.renameTarget;
    setState(prev => ({ ...prev, isRenaming: true, renameError: null }));

    try {
      await apiService.renameItem(target.path, safeName, Boolean(target.isdir));
      setState(prev => ({
        ...prev,
        isRenaming: false,
        renameTarget: null,
        renameValue: '',
        previewFile: prev.previewFile?.path === target.path ? null : prev.previewFile
      }));
      await reloadCurrentFolder();
    } catch (error) {
      console.error('Rename error:', error);
      const message = error instanceof Error ? error.message : 'Impossible de renommer';
      setState(prev => ({
        ...prev,
        isRenaming: false,
        renameError: prev.renameTarget ? message : null,
        error: prev.renameTarget ? prev.error : message
      }));
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
      setState(prev => ({
        ...prev,
        isLoading: true,
        showDeleteModal: false,
        previewFile: null,
        renameTarget: null
      }));

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
  const selectedItems = state.files.filter((file) => state.selectedFiles.includes(file.name));
  const singleSelection = selectedItems.length === 1 ? selectedItems[0] : null;

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
              className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 w-[75px]"
              onClick={handleClickUpload}
              title="Upload de fichiers"
            >
              <Upload className="w-3 h-3 mr-1.5" />
              Upload
            </button>
          )}

          {state.currentPath !== '/' && (
            <button
              className="inline-flex items-center justify-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 w-[75px]"
              onClick={() => setState(prev => ({ ...prev, showCreateFolderModal: true }))}
              title="Nouveau dossier"
            >
              <FolderPlus className="w-3 h-3 mr-1.5" />
              New
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
                <div className="w-36">Actions</div>
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
                        <div className="text-sm text-white truncate" title={file.isdir ? file.name : `Afficher ${file.name}`}>
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

                      <div className="w-36 flex gap-1">
                        {!file.isdir && (
                          <button
                            className="p-1 text-gray-400 hover:text-white rounded"
                            title="Aperçu"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPreview(file);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="p-1 text-gray-400 hover:text-white rounded"
                          title="Renommer"
                          onClick={(e) => {
                            e.stopPropagation();
                            openRename(file);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {!file.isdir && (
                          <button
                            className="p-1 text-gray-400 hover:text-white rounded"
                            title="Télécharger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="p-1 text-gray-400 hover:text-red-400 rounded"
                          title="Supprimer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setState(prev => ({
                              ...prev,
                              selectedFiles: [file.name],
                              showDeleteModal: true
                            }));
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
        <div className="bg-gray-800 border-t border-gray-700 p-4 flex flex-wrap items-center gap-3">
          <span className="text-gray-300">
            {state.selectedFiles.length} élément(s) sélectionné(s)
          </span>
          <div className="flex flex-wrap gap-2">
            {singleSelection && !singleSelection.isdir && (
              <button
                type="button"
                className="btn-secondary inline-flex items-center"
                onClick={() => openPreview(singleSelection)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Aperçu
              </button>
            )}
            {singleSelection && (
              <button
                type="button"
                className="btn-secondary inline-flex items-center"
                onClick={() => openRename(singleSelection)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Renommer
              </button>
            )}
            <button
              type="button"
              className="btn-secondary inline-flex items-center disabled:opacity-50"
              onClick={() => {
                if (singleSelection && !singleSelection.isdir) handleDownload(singleSelection);
              }}
              disabled={!singleSelection || Boolean(singleSelection.isdir)}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </button>
            <button
              type="button"
              className="btn-secondary inline-flex items-center text-red-400 hover:text-red-300"
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
                Les dossiers seront supprimés avec tout leur contenu.
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

      {state.previewFile && (
        <FilePreviewModal
          file={state.previewFile}
          apiService={apiService}
          onClose={() => setState(prev => ({ ...prev, previewFile: null }))}
          onRename={() => {
            if (state.previewFile) openRename(state.previewFile);
          }}
          onDownload={() => apiService.downloadFile(state.previewFile!.path, state.previewFile!.name)}
        />
      )}

      {state.renameTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-title"
            className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                setState(prev => ({ ...prev, renameTarget: null, renameValue: '', renameError: null }));
              }
            }}
          >
            <h3 id="rename-title" className="text-lg font-semibold text-white mb-2">
              Renommer
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {state.renameTarget.isdir
                ? 'Le dossier et son contenu prennent le nouveau nom. Cela peut prendre un moment.'
                : 'Le fichier reste au même endroit, sous son nouveau nom.'}
            </p>
            {state.renameError && (
              <p className="text-sm text-red-400 mb-3">{state.renameError}</p>
            )}
            <input
              type="text"
              value={state.renameValue}
              onChange={(e) => setState(prev => ({ ...prev, renameValue: e.target.value, renameError: null }))}
              className="input-standard w-full mb-4"
              autoFocus
              autoComplete="off"
              disabled={state.isRenaming}
              onFocus={(e) => {
                const value = e.target.value;
                const dot = state.renameTarget?.isdir ? -1 : value.lastIndexOf('.');
                if (dot > 0) {
                  e.target.setSelectionRange(0, dot);
                } else {
                  e.target.select();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation();
                  setState(prev => ({ ...prev, renameTarget: null, renameValue: '', renameError: null }));
                }
              }}
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setState(prev => ({
                  ...prev,
                  renameTarget: null,
                  renameValue: '',
                  renameError: null
                }))}
              >
                Annuler
              </button>
              <button
                className="btn-primary disabled:opacity-50"
                onClick={handleRename}
                disabled={state.isRenaming || !state.renameValue.trim() || state.renameValue.trim() === state.renameTarget.name}
              >
                {state.isRenaming ? 'Renommage...' : 'Renommer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};