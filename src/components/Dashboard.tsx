import React, { useEffect, useRef, useState } from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import type { AuthUser } from '../services/firebase-auth';
import { APIService } from '../services/api';
import { ConnectionStatus } from './ConnectionStatus';
import { FileExplorer } from './FileExplorer';
import { InactivityWarning } from './InactivityWarning';
import { useInactivityTimer } from '../utils/useInactivityTimer';
import { useServiceWorkerUpdate } from '../utils/useServiceWorkerUpdate';

interface DashboardProps {
  user: AuthUser;
  apiService: APIService;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, apiService, onLogout }) => {
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [updateLater, setUpdateLater] = useState(false);
  const { updateReady, updating, update } = useServiceWorkerUpdate();
  const logoutRef = useRef(onLogout);
  logoutRef.current = onLogout;

  // Timer d'inactivité : avertissement à 14 minutes, puis fermeture au bout d'une minute
  const handleInactivityWarning = () => {
    setShowInactivityWarning(true);
  };

  const { resetTimer } = useInactivityTimer(handleInactivityWarning, 840000, !showInactivityWarning);

  useEffect(() => {
    if (!showInactivityWarning) return;
    let remaining = 60;
    setSecondsLeft(remaining);
    const id = window.setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(id);
        logoutRef.current();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [showInactivityWarning]);

  const handleStayConnected = () => {
    setShowInactivityWarning(false);
    resetTimer();
  };

  // Refresh supprimé du header; le refresh reste dans le FileExplorer

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header - Responsive pour mobile avec safe area iPhone */}
      <header className="bg-gray-800 border-b border-gray-700 px-3 sm:px-6 py-2 sm:py-4 flex-shrink-0 pt-safe-top">
        <div className="flex items-center justify-between">
          {/* Logo et titre - Compact sur mobile */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img src="/MySafeBoxHeader.png" alt="MySafeBox" className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">MySafeBox</h1>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Coffre-fort numérique sécurisé</p>
              </div>
            </div>

            {/* Badge de connexion - Caché sur très petit écran */}
            <div className="hidden md:block">
              <ConnectionStatus />
            </div>
          </div>

          {/* Actions utilisateur - Compact sur mobile */}
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            {/* Badge connexion mobile */}
            <div className="block md:hidden">
              <ConnectionStatus />
            </div>

            {/* Info utilisateur - Responsive */}
            <div className="flex items-center gap-1 sm:gap-3 text-gray-300">
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                <UserIcon className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base truncate max-w-24 sm:max-w-none">
                  {(user.displayName && user.displayName.trim().length > 0)
                    ? user.displayName
                    : (user.email ? user.email.split('@')[0] : 'Utilisateur')}
                </span>
              </div>

              <div className="w-px h-4 sm:h-6 bg-gray-600" />

              {/* Déconnexion - Icon seule sur mobile */}
              <button
                onClick={onLogout}
                className="flex items-center gap-1 sm:gap-2 p-2 sm:px-3 sm:py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:block text-sm">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal - FileExplorer */}
      <main className="flex-1 overflow-hidden">
        <FileExplorer apiService={apiService} user={user} />
      </main>

      {/* Avertissement d'inactivité */}
      <InactivityWarning
        isVisible={showInactivityWarning}
        secondsLeft={secondsLeft}
        onStayConnected={handleStayConnected}
        onLogout={onLogout}
      />

      {updateReady && !updateLater && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="card max-w-md w-full" role="dialog" aria-modal="true" aria-labelledby="update-title">
            <h3 id="update-title" className="text-lg font-semibold text-white mb-2">Nouvelle version disponible</h3>
            <p className="text-gray-300 mb-6">
              Une mise à jour de MySafeBox est prête.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={update}
                disabled={updating}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {updating ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
              <button
                type="button"
                onClick={() => setUpdateLater(true)}
                disabled={updating}
                className="btn-secondary flex-1 disabled:opacity-50"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};