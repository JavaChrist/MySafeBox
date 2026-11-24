import React, { useEffect, useState } from 'react';
import { Download, FileQuestion, Loader2, Pencil, X } from 'lucide-react';
import type { FirebaseFileItem } from '../services/filestation-api';
import { APIService } from '../services/api';
import { formatFileSize, getPreviewKind, type PreviewKind } from '../utils/fileHelpers';

interface FilePreviewModalProps {
  file: FirebaseFileItem;
  apiService: APIService;
  onClose: () => void;
  onRename: () => void;
  onDownload: () => Promise<void>;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  apiService,
  onClose,
  onRename,
  onDownload
}) => {
  const [kind, setKind] = useState<PreviewKind>('unsupported');
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [mediaUrl, setMediaUrl] = useState('');
  const [text, setText] = useState('');
  const [failure, setFailure] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    const nextKind = getPreviewKind(file.name);
    setKind(nextKind);
    setText('');
    setMediaUrl('');
    setFailure(null);

    const load = async () => {
      if (nextKind === 'unsupported') {
        setPhase('ready');
        return;
      }
      setPhase('loading');
      const timeout = window.setTimeout(() => {
        if (cancelled) return;
        cancelled = true;
        setPhase('error');
        setFailure('L’affichage prend trop de temps. Vous pouvez télécharger le fichier.');
      }, 15000);
      try {
        if (nextKind === 'text') {
          const content = await apiService.getTextPreview(file.path);
          if (!cancelled) setText(content);
        } else {
          const url = file.downloadUrl || await apiService.getDownloadUrl(file.path);
          if (!cancelled) setMediaUrl(url);
        }
        if (!cancelled) setPhase('ready');
      } catch (error) {
        if (!cancelled) {
          setPhase('error');
          setFailure(error instanceof Error ? error.message : 'Impossible d\'afficher ce fichier');
        }
      } finally {
        window.clearTimeout(timeout);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [apiService, file.downloadUrl, file.name, file.path]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setFailure(null);
      await onDownload();
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Impossible de télécharger ce fichier');
    } finally {
      setDownloading(false);
    }
  };

  const showMediaError = () => {
    setPhase('error');
    setFailure('Ce fichier ne peut pas être affiché dans le navigateur.');
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
        className="bg-gray-800 rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col border border-gray-700"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-700">
          <div className="min-w-0">
            <h3 id="preview-title" className="text-lg font-semibold text-white truncate">
              {file.name}
            </h3>
            <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-md"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-4">
          {phase === 'loading' && (
            <div className="h-64 flex items-center justify-center text-gray-300">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-3">Ouverture...</span>
            </div>
          )}

          {phase === 'error' && (
            <div className="h-64 flex flex-col items-center justify-center text-center text-gray-300 gap-3">
              <FileQuestion className="w-10 h-10 text-gray-400" />
              <p>{failure}</p>
            </div>
          )}

          {phase === 'ready' && kind === 'image' && mediaUrl && (
            <div className="flex items-center justify-center">
              <img
                src={mediaUrl}
                alt={file.name}
                className="max-h-[65vh] max-w-full object-contain"
                onError={showMediaError}
              />
            </div>
          )}

          {phase === 'ready' && kind === 'pdf' && mediaUrl && (
            <iframe
              src={mediaUrl}
              title={file.name}
              className="w-full min-h-[65vh] bg-white rounded-md"
            />
          )}

          {phase === 'ready' && kind === 'video' && mediaUrl && (
            <video
              src={mediaUrl}
              controls
              playsInline
              className="w-full max-h-[65vh] bg-black rounded-md"
              onError={showMediaError}
            />
          )}

          {phase === 'ready' && kind === 'audio' && mediaUrl && (
            <div className="h-40 flex items-center justify-center">
              <audio src={mediaUrl} controls className="w-full" onError={showMediaError} />
            </div>
          )}

          {phase === 'ready' && kind === 'text' && (
            <pre className="whitespace-pre-wrap break-words text-sm text-gray-200 font-mono">
              {text}
            </pre>
          )}

          {phase === 'ready' && kind === 'unsupported' && (
            <div className="h-64 flex flex-col items-center justify-center text-center text-gray-300 gap-3">
              <FileQuestion className="w-10 h-10 text-gray-400" />
              <p>Ce type de fichier ne peut pas être affiché ici.</p>
              <p className="text-sm text-gray-400">Vous pouvez le télécharger pour l’ouvrir avec une autre application.</p>
            </div>
          )}
        </div>

        {failure && phase === 'ready' && (
          <p className="px-4 text-sm text-red-400">{failure}</p>
        )}

        <div className="flex flex-wrap justify-end gap-2 p-4 border-t border-gray-700">
          <button type="button" onClick={onRename} className="btn-secondary inline-flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            Renommer
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Téléchargement...' : 'Télécharger'}
          </button>
          <button type="button" onClick={onClose} className="btn-primary">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
