import React, { useState, useEffect } from 'react';
import { User, Shield, Loader } from 'lucide-react';
import { APIService } from '../services/api';
import Modal from './Modal';
import ConnectionStatus from './ConnectionStatus';
import { getWebDAVUrl, getConnectionInfo } from '../config/environment';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

interface User {
  id: string;
  username: string;
  webdavUrl: string;
  webdavUsername: string;
  webdavPassword: string;
}

// URL WebDAV dynamique selon la configuration
const WEBDAV_URL = getWebDAVUrl();

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    webdavUsername: '',
    webdavPassword: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Test d'une session déjà active au démarrage
  useEffect(() => {
    const testExistingSession = async () => {
      const savedUser = localStorage.getItem('mysafebox-user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);

          // Vérifier que le proxy est accessible
          const proxyHealthy = await APIService.checkProxyHealth();
          if (!proxyHealthy) {
            console.log('Proxy non accessible, session annulée');
            localStorage.removeItem('mysafebox-user');
            return;
          }

          // Test si la session est encore valide via l'API
          const apiService = new APIService(user.webdavUsername, user.webdavPassword);
          await apiService.testConnection();

          onLogin(user); // Connexion automatique si session valide
        } catch (error) {
          console.error('Session expirée:', error);
          localStorage.removeItem('mysafebox-user');
        }
      }
    };

    testExistingSession();
  }, [onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation des champs obligatoires
    if (!formData.webdavUsername || !formData.webdavPassword) {
      setModalMessage('Tous les champs sont obligatoires');
      setShowModal(true);
      return;
    }

    setIsConnecting(true);

    try {
      // Vérifier d'abord que le proxy est accessible
      const proxyHealthy = await APIService.checkProxyHealth();
      if (!proxyHealthy) {
        throw new Error('PROXY_UNAVAILABLE');
      }

      // Test de connexion via le proxy API
      const apiService = new APIService(formData.webdavUsername, formData.webdavPassword);
      await apiService.testConnection();

      // Si succès, créer l'objet utilisateur
      const user: User = {
        id: formData.webdavUsername.toLowerCase(),
        username: formData.webdavUsername,
        webdavUrl: WEBDAV_URL,
        webdavUsername: formData.webdavUsername,
        webdavPassword: formData.webdavPassword
      };

      onLogin(user);
    } catch (error: any) {
      console.error('Erreur de connexion WebDAV complète:', error);

      let errorMessage = 'Impossible de se connecter au coffre-fort.';
      let debugInfo = '';

      // Analyse détaillée de l'erreur avec gestion connexion publique
      const connectionInfo = getConnectionInfo();
      const isPublicConnection = connectionInfo.type === 'DISTANT';

      if (error.message === 'PROXY_UNAVAILABLE') {
        if (isPublicConnection) {
          errorMessage = 'MySafeBox non accessible.';
          debugInfo = 'Vérifiez que le service est disponible à l\'adresse configurée.';
        } else {
          errorMessage = 'Serveur proxy local non accessible.';
          debugInfo = 'Démarrez le proxy : node server-proxy-working.cjs';
        }
      } else if (error.message && error.message.includes('Test de connexion échoué')) {
        errorMessage = 'Identifiants WebDAV incorrects.';
        debugInfo = 'Vérifiez votre nom d\'utilisateur et mot de passe WebDAV.';
      } else if (error.message && error.message.includes('certificate')) {
        errorMessage = 'Problème de certificat SSL.';
        debugInfo = isPublicConnection
          ? 'Le certificat du serveur n\'est pas valide ou a expiré.'
          : 'Certificat auto-signé du NAS non approuvé par le navigateur.';
      } else if (error.message && error.message.includes('ENOTFOUND')) {
        errorMessage = 'Serveur introuvable.';
        debugInfo = isPublicConnection
          ? 'L\'adresse app.mysafebox.fr n\'est pas accessible depuis votre connexion.'
          : 'Le NAS n\'est pas accessible à l\'adresse locale configurée.';
      } else if (error.message && error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Connexion refusée.';
        debugInfo = isPublicConnection
          ? 'Le service MySafeBox semble être hors ligne.'
          : 'Le NAS est éteint ou le service WebDAV n\'est pas démarré.';
      } else if ((error.message && error.message.includes('fetch')) || error.name === 'TypeError') {
        errorMessage = isPublicConnection ? 'Erreur de connexion distante.' : 'Erreur de connexion au proxy.';
        debugInfo = isPublicConnection
          ? 'Vérifiez votre connexion internet et que le service est disponible.'
          : 'Le serveur proxy local tourne-t-il sur localhost:3030 ?';
      } else if (error.status === 401) {
        errorMessage = 'Identifiants WebDAV incorrects.';
        debugInfo = 'Vérifiez votre nom d\'utilisateur et mot de passe WebDAV.';
      } else if (error.status === 404) {
        errorMessage = 'Service WebDAV introuvable.';
        debugInfo = 'WebDAV est-il activé sur le NAS ou le service MySafeBox ?';
      } else if (error.status === 403) {
        errorMessage = 'Accès WebDAV refusé.';
        debugInfo = 'L\'utilisateur n\'a pas les permissions WebDAV nécessaires.';
      } else if (error.status === 502 || error.status === 503) {
        errorMessage = 'Service temporairement indisponible.';
        debugInfo = isPublicConnection
          ? 'Le service MySafeBox est en maintenance ou surchargé.'
          : 'Le NAS ou le proxy rencontre des difficultés.';
      } else {
        errorMessage = 'Erreur de connexion.';
        debugInfo = `${error.message || 'Erreur inconnue'}`;
      }

      setModalMessage(`${errorMessage}\n\n🔍 Debug: ${debugInfo}\n\n📝 URL testée: ${WEBDAV_URL}`);
      setShowModal(true);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <img
            src="/MySafeBoxHeader.png"
            alt="MySafeBox Logo"
            className="mx-auto h-20 w-20 object-contain"
          />
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            MySafeBox
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Connexion à votre coffre-fort numérique
          </p>

          {/* Statut de connexion */}
          <div className="mt-4 flex justify-center">
            <ConnectionStatus />
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="webdavUsername" className="sr-only">
                Nom d'utilisateur WebDAV
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="webdavUsername"
                  name="webdavUsername"
                  type="text"
                  required
                  className="pl-10 w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom d'utilisateur"
                  value={formData.webdavUsername}
                  onChange={handleInputChange}
                  disabled={isConnecting}
                />
              </div>
            </div>

            <div>
              <label htmlFor="webdavPassword" className="sr-only">
                Mot de passe WebDAV
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="webdavPassword"
                  name="webdavPassword"
                  type="password"
                  required
                  className="pl-10 w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mot de passe"
                  value={formData.webdavPassword}
                  onChange={handleInputChange}
                  disabled={isConnecting}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isConnecting}
              className="group relative w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Test de connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </div>
        </form>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Erreur"
        message={modalMessage}
      />
    </div>
  );
};

export default LoginForm;