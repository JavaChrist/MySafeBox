import React, { useState } from 'react';
import { LogOut, User as UserIcon, RefreshCw } from 'lucide-react';
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
  const { updateReady, updating, update } = useServiceWorkerUpdate();

  // Timer d'inactivité
  const handleInactivityWarning = () => {
    setShowInactivityWarning(true);
  };

  const { resetTimer } = useInactivityTimer(handleInactivityWarning, 840000); // 14 minutes

  // Rester connecté (fermer warning et reset timer)
  const handleStayConnected = () => {
    setShowInactivityWarning(false);
    resetTimer();
  };

  // Refresh de la connexion
  const handleRefreshConnection = () => {
    resetTimer();
    // TODO: Optionnel - ping API pour vérifier la connexion
  };

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
            {/* SW update banner (compact) */}
            {updateReady && (
              <button
                onClick={update}
                className="px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-300 border border-yellow-600"
                title={updating ? 'Mise à jour en cours...' : 'Nouvelle version disponible'}
              >
                {updating ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
            )}
            {/* Badge connexion mobile */}
            <div className="block md:hidden">
              <ConnectionStatus />
            </div>

            {/* Refresh connexion - Plus petit sur mobile */}
            <button
              onClick={handleRefreshConnection}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
              title="Actualiser la connexion"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Info utilisateur - Responsive */}
            <div className="flex items-center gap-1 sm:gap-3 text-gray-300">
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                <UserIcon className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base truncate max-w-24 sm:max-w-none">
                  {user.displayName && user.displayName.trim().length > 0
                    ? user.displayName
                    : (user.email ? user.email.split('@')[0] : '')}
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
        onStayConnected={handleStayConnected}
        onLogout={onLogout}
      />
    </div>
  );
};