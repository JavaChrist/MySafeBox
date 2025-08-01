import React, { useState, useRef } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';
import { WebDAVAPIService } from '../services/webdav-api';

interface FileUploadProps {
  isOpen: boolean;
  onClose: () => void;
  webdavService: WebDAVAPIService;
  currentPath: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface UploadFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  isOpen,
  onClose,
  webdavService,
  currentPath,
  onSuccess,
  onError
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const uploadFiles = selectedFiles.map(file => ({
      file,
      status: 'pending' as const,
      progress: 0
    }));
    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    const uploadFiles = droppedFiles.map(file => ({
      file,
      status: 'pending' as const,
      progress: 0
    }));
    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i];

      if (uploadFile.status !== 'pending') continue;

      try {
        // Mise à jour du statut en cours d'upload
        setFiles(prev => prev.map((f, index) =>
          index === i ? { ...f, status: 'uploading' as const, progress: 0 } : f
        ));

        // Simulation du progrès (WebDAV ne supporte pas le progress natif)
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map((f, index) =>
            index === i ? { ...f, progress: Math.min(f.progress + 10, 90) } : f
          ));
        }, 100);

        await webdavService.uploadFile(currentPath, uploadFile.file);

        clearInterval(progressInterval);

        // Upload réussi
        setFiles(prev => prev.map((f, index) =>
          index === i ? { ...f, status: 'success' as const, progress: 100 } : f
        ));

        successCount++;
      } catch (error) {
        // Upload échoué
        setFiles(prev => prev.map((f, index) =>
          index === i ? {
            ...f,
            status: 'error' as const,
            progress: 0,
            error: 'Erreur lors de l\'upload'
          } : f
        ));

        errorCount++;
      }
    }

    setIsUploading(false);

    // Messages de résultat
    if (successCount > 0 && errorCount === 0) {
      onSuccess(`${successCount} fichier(s) uploadé(s) avec succès`);
    } else if (successCount > 0 && errorCount > 0) {
      onSuccess(`${successCount} fichier(s) uploadé(s), ${errorCount} erreur(s)`);
    } else if (errorCount > 0) {
      onError(`Erreur lors de l'upload de ${errorCount} fichier(s)`);
    }

    // Auto-fermeture si tout s'est bien passé
    if (errorCount === 0) {
      setTimeout(() => {
        handleClose();
      }, 1500);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFiles([]);
      onClose();
    }
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'uploading':
        return <Upload className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return <File className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Upload de fichiers
          </h3>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drop Zone */}
        <div className="p-6 border-b border-gray-200">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Glissez-déposez vos fichiers ici
            </p>
            <p className="text-gray-500">
              ou cliquez pour sélectionner des fichiers
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-6">
          {files.length === 0 ? (
            <p className="text-gray-500 text-center">Aucun fichier sélectionné</p>
          ) : (
            <div className="space-y-3">
              {files.map((uploadFile, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {getStatusIcon(uploadFile.status)}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadFile.file.size)}
                    </p>

                    {uploadFile.status === 'uploading' && (
                      <div className="mt-1">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadFile.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {uploadFile.error && (
                      <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                    )}
                  </div>

                  {uploadFile.status === 'pending' && !isUploading && (
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={uploadFiles}
            disabled={files.length === 0 || isUploading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
          >
            {isUploading ? 'Upload en cours...' : `Uploader ${files.length} fichier(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;