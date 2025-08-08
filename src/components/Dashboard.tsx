import React, { useState } from 'react';
import { LogOut, User as UserIcon, RefreshCw } from 'lucide-react';
import type { AuthUser } from '../services/firebase-auth';
import { APIService } from '../services/api';
import { ConnectionStatus } from './ConnectionStatus';
import { FileExplorer } from './FileExplorer';
import { InactivityWarning } from './InactivityWarning';
import { useInactivityTimer } from '../utils/useInactivityTimer';

interface DashboardProps {
  user: AuthUser;
  apiService: APIService;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, apiService, onLogout }) => {
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);

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
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Logo et titre */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/MySafeBoxHeader.png" alt="MySafeBox" className="w-20 h-20" />
              <div>
                <h1 className="text-xl font-bold text-white">MySafeBox</h1>
                <p className="text-sm text-gray-400">Coffre-fort numérique sécurisé</p>
              </div>
            </div>

            {/* Badge de connexion */}
            <ConnectionStatus />
          </div>

          {/* Actions utilisateur */}
          <div className="flex items-center gap-4">
            {/* Refresh connexion */}
            <button
              onClick={handleRefreshConnection}
              className="btn-secondary"
              title="Actualiser la connexion"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Info utilisateur */}
            <div className="flex items-center gap-3 text-gray-300">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                <span className="font-medium">{user.displayName || user.email}</span>
              </div>

              <div className="w-px h-6 bg-gray-600" />

              {/* Déconnexion */}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Déconnexion</span>
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