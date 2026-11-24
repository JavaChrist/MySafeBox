import React, { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useServiceWorkerUpdate } from '../utils/useServiceWorkerUpdate';

export const UpdatePrompt: React.FC = () => {
  const { updateReady, updating, update, later } = useServiceWorkerUpdate();

  useEffect(() => {
    if (!updateReady || updating) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') later();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [updateReady, updating, later]);

  if (!updateReady) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4">
      <div className="card max-w-md w-full" role="dialog" aria-modal="true" aria-labelledby="update-title">
        <div className="flex items-center gap-3 mb-2">
          <RefreshCw className="w-5 h-5 text-blue-400 shrink-0" />
          <h3 id="update-title" className="text-lg font-semibold text-white">Nouvelle version disponible</h3>
        </div>
        <p className="text-gray-300 mb-6">
          Une mise à jour de MySafeBox est prête. La page sera rechargée.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={later}
            disabled={updating}
            className="btn-secondary flex-1 disabled:opacity-50"
          >
            Plus tard
          </button>
          <button
            type="button"
            onClick={update}
            disabled={updating}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {updating ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
        </div>
      </div>
    </div>
  );
};
