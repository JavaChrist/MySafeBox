import { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { firebaseAuthService, type AuthUser } from './services/firebase-auth';
import { APIService } from './services/api';

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [apiService, setApiService] = useState<APIService | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Écouter les changements d'authentification Firebase
  useEffect(() => {
    const unsubscribe = firebaseAuthService.onAuthStateChange((authUser) => {
      if (authUser) {
        console.log('👤 Utilisateur connecté:', authUser.email);
        setUser(authUser);
        setApiService(new APIService(authUser));
      } else {
        console.log('👤 Utilisateur déconnecté');
        setUser(null);
        setApiService(null);
      }
      setIsLoading(false);
    });

    // Nettoyage
    return () => unsubscribe();
  }, []);

  // Gestion de la connexion
  const handleLogin = (loggedUser: AuthUser) => {
    // La mise à jour se fera automatiquement via onAuthStateChange
    console.log('✅ Connexion réussie pour:', loggedUser.email);
  };

  // Gestion de la déconnexion
  const handleLogout = async () => {
    try {
      await firebaseAuthService.logout();
      // La mise à jour se fera automatiquement via onAuthStateChange
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  // Chargement initial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

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