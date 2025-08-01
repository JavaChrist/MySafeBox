import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import InactivityWarning from './components/InactivityWarning';
import { useInactivityTimer } from './utils/useInactivityTimer';
import { User } from './types';
import { APIService } from './services/api';

// Configuration de sécurité
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes en millisecondes
const WARNING_DURATION = 30; // 30 secondes de warning
const INACTIVITY_BEFORE_WARNING = INACTIVITY_TIMEOUT - (WARNING_DURATION * 1000); // 14m30s

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);

  useEffect(() => {
    // Vérifier si un utilisateur est déjà connecté ET si la session est valide
    const validateStoredSession = async () => {
      const savedUser = localStorage.getItem('mysafebox-user');
      const sessionTimestamp = localStorage.getItem('mysafebox-session-timestamp');

      if (savedUser && sessionTimestamp) {
        try {
          const user = JSON.parse(savedUser);
          const timestamp = parseInt(sessionTimestamp, 10);
          const now = Date.now();
          const maxSessionAge = 24 * 60 * 60 * 1000; // 24 heures max

          // Vérifier l'âge de la session
          if (now - timestamp > maxSessionAge) {
            console.log('Session expirée (trop ancienne)');
            localStorage.removeItem('mysafebox-user');
            localStorage.removeItem('mysafebox-session-timestamp');
            setIsLoading(false);
            return;
          }

          // Vérifier que les identifiants sont encore valides
          const proxyHealthy = await APIService.checkProxyHealth();

          if (!proxyHealthy) {
            console.log('Proxy non accessible, session annulée');
            localStorage.removeItem('mysafebox-user');
            localStorage.removeItem('mysafebox-session-timestamp');
            setIsLoading(false);
            return;
          }

          // Test de connexion WebDAV
          const apiService = new APIService(user.webdavUsername, user.webdavPassword);
          await apiService.testConnection();

          // Si tout est OK, restaurer la session
          setUser(user);
          // Mettre à jour le timestamp pour cette validation
          localStorage.setItem('mysafebox-session-timestamp', now.toString());

        } catch (error) {
          console.error('Session invalide:', error);
          localStorage.removeItem('mysafebox-user');
          localStorage.removeItem('mysafebox-session-timestamp');
        }
      }

      setIsLoading(false);
    };

    validateStoredSession();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('mysafebox-user', JSON.stringify(userData));
    localStorage.setItem('mysafebox-session-timestamp', Date.now().toString());
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mysafebox-user');
    localStorage.removeItem('mysafebox-session-timestamp');
    setShowInactivityWarning(false);
  };

  // Gestion de l'inactivité - déclenche le warning avant déconnexion
  const handleInactivityWarning = () => {
    if (user) {
      setShowInactivityWarning(true);
    }
  };

  // L'utilisateur choisit de rester connecté
  const handleStayConnected = () => {
    setShowInactivityWarning(false);
    // Le timer sera automatiquement remis à zéro par l'activité de clic
  };

  // Hook de gestion de l'inactivité (seulement si utilisateur connecté)
  const { startTimer, stopTimer } = useInactivityTimer({
    timeout: INACTIVITY_BEFORE_WARNING,
    onTimeout: handleInactivityWarning,
    events: ['mousedown', 'mousemove', 'keypress', 'touchstart', 'click']
  });

  // Démarrer/arrêter le timer selon l'état de connexion
  useEffect(() => {
    if (user && !isLoading) {
      startTimer();
    } else {
      stopTimer();
      setShowInactivityWarning(false);
    }
  }, [user, isLoading, startTimer, stopTimer]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}

      {/* Warning de déconnexion automatique */}
      <InactivityWarning
        isOpen={showInactivityWarning}
        onStayConnected={handleStayConnected}
        onLogout={handleLogout}
        warningDuration={WARNING_DURATION}
      />
    </div>
  );
}

export default App;