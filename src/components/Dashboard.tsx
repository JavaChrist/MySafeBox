import React, { useState, useEffect } from 'react';
import { LogOut, FolderOpen, User, RefreshCw } from 'lucide-react';
import { User as UserType } from '../types';
import { WebDAVAPIService } from '../services/webdav-api';
import FileExplorer from './FileExplorer';
import Modal from './Modal';
import ConnectionStatus from './ConnectionStatus';

interface DashboardProps {
  user: UserType;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [webdavService, setWebdavService] = useState<WebDAVAPIService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'error' | 'success' | 'info'
  });

  useEffect(() => {
    initializeWebDAV();
  }, [user]);

  const initializeWebDAV = async () => {
    try {
      setIsLoading(true);
      // Utiliser le nom d'utilisateur WebDAV pour le dossier personnel
      const userName = user.webdavUsername;

      const service = new WebDAVAPIService(
        user.webdavUsername,
        user.webdavPassword,
        userName // Nom du dossier utilisateur
      );

      const connected = await service.checkConnection();
      if (connected) {
        setWebdavService(service);
        setIsConnected(true);
        showMessage('Connexion réussie', `Connecté au coffre-fort personnel de ${user.username}`, 'success');
      } else {
        showMessage('Erreur de connexion', 'Impossible de se connecter au coffre-fort via le proxy.', 'error');
      }
    } catch (error) {
      console.error('Erreur d\'initialisation WebDAV:', error);
      showMessage('Erreur', 'Erreur lors de l\'initialisation de la connexion via le proxy', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (title: string, message: string, type: 'error' | 'success' | 'info') => {
    setModalConfig({ title, message, type });
    setShowModal(true);
  };

  const handleRefresh = () => {
    initializeWebDAV();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-white mx-auto mb-4" />
          <p className="text-white">Connexion au NAS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img
                src="/MySafeBoxHeader.png"
                alt="MySafeBox Logo"
                className="h-20 w-20 object-contain"
              />
              <div>
                <h1 className="text-xl font-semibold text-white">MySafeBox</h1>
                <p className="text-sm text-gray-400">Coffre-fort de {user.username}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Statut de connexion WebDAV */}
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-300">
                  {isConnected ? 'Connecté' : 'Déconnecté'}
                </span>
              </div>

              {/* Statut réseau Local/Distant */}
              <ConnectionStatus showDetails={false} />

              <button
                onClick={handleRefresh}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Actualiser la connexion"
              >
                <RefreshCw className="h-5 w-5" />
              </button>

              <div className="flex items-center space-x-2 text-gray-300">
                <User className="h-5 w-5" />
                <span className="text-sm">{user.username}</span>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isConnected && webdavService ? (
          <FileExplorer
            webdavService={webdavService}
            onError={(message) => showMessage('Erreur', message, 'error')}
            onSuccess={(message) => showMessage('Succès', message, 'success')}
          />
        ) : (
          <div className="text-center py-12">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              Connexion non établie
            </h3>
            <p className="text-gray-500 mb-4">
              Impossible de se connecter à votre espace de stockage.
            </p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </button>
          </div>
        )}
      </main>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
};

export default Dashboard;