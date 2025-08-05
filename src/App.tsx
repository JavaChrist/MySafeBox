import { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import type { User } from './types';
import { APIService } from './services/api';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [apiService, setApiService] = useState<APIService | null>(null);

  // Vérifier s'il y a une session existante au démarrage
  useEffect(() => {
    const sessionData = APIService.getSessionData();
    if (sessionData) {
      const sessionUser: User = {
        id: sessionData.username,
        username: sessionData.username,
        nasUrl: sessionData.nasUrl,
        webdavUsername: sessionData.username,
        webdavPassword: '' // On ne stocke pas le mot de passe
      };

      const service = new APIService(sessionUser);

      // Restaurer la session si elle existe
      if (sessionData.sessionId) {
        service.restoreSession(sessionData.sessionId);
      }

      setUser(sessionUser);
      setApiService(service);
    }
  }, []);

  // Gestion de la connexion
  const handleLogin = (loggedUser: User, service: APIService) => {
    setUser(loggedUser);
    setApiService(service);
  };

  // Gestion de la déconnexion
  const handleLogout = async () => {
    if (apiService) {
      await apiService.logout();
    }
    setUser(null);
    setApiService(null);
  };

  // Si pas d'utilisateur connecté, afficher le formulaire de connexion
  if (!user || !apiService) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Dashboard principal avec FileExplorer
  return (
    <Dashboard
      user={user}
      apiService={apiService}
      onLogout={handleLogout}
    />
  );
}

export default App;