import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface InactivityWarningProps {
  isVisible: boolean;
  onStayConnected: () => void;
  onLogout: () => void;
}

export const InactivityWarning: React.FC<InactivityWarningProps> = ({
  isVisible,
  onStayConnected,
  onLogout
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-500/10 rounded-full">
            <AlertCircle className="w-6 h-6 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold text-white">Session inactive</h3>
        </div>

        <p className="text-gray-300 mb-6">
          Votre session va expirer dans quelques instants due à l'inactivité.
          Voulez-vous rester connecté ?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onStayConnected}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Rester connecté
          </button>
          <button
            onClick={onLogout}
            className="btn-secondary flex-1"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};