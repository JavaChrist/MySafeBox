import React, { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { User } from '../types';
import { APIService } from '../services/api';
import { getAPIUrl } from '../config/environment';
import { ConnectionStatus } from './ConnectionStatus';

interface LoginFormProps {
  onLogin: (user: User, apiService: APIService) => void;
}

interface LoginFormState {
  username: string;
  password: string;
  isLoading: boolean;
  error: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [state, setState] = useState<LoginFormState>({
    username: '',
    password: '',
    isLoading: false,
    error: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.username.trim() || !state.password.trim()) {
      setState(prev => ({ ...prev, error: 'Veuillez remplir tous les champs' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Créer l'utilisateur temporaire pour l'API
      const user: User = {
        id: state.username,
        username: state.username,
        nasUrl: getAPIUrl(),
        webdavUsername: state.username,
        webdavPassword: state.password
      };

      // Créer le service API
      const apiService = new APIService(user);

      // Tenter la connexion
      const loginSuccess = await apiService.login(state.username, state.password);

      if (loginSuccess) {
        onLogin(user, apiService);
      } else {
        setState(prev => ({
          ...prev,
          error: 'Nom d\'utilisateur ou mot de passe incorrect',
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({
        ...prev,
        error: 'Erreur de connexion au serveur. Vérifiez votre réseau.',
        isLoading: false
      }));
    }
  };

  const handleInputChange = (field: keyof Pick<LoginFormState, 'username' | 'password'>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setState(prev => ({
        ...prev,
        [field]: e.target.value,
        error: null // Clear error when user types
      }));
    };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/MySafeBoxHeader.png" alt="MySafeBox" className="w-24 h-24" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">MySafeBox</h1>
          <p className="text-gray-400">Coffre-fort numérique sécurisé</p>
        </div>

        {/* Badge de connexion */}
        <div className="flex justify-center mb-4">
          <ConnectionStatus />
        </div>

        {/* Formulaire de connexion */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Message d'erreur */}
            {state.error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-400 text-sm">{state.error}</span>
              </div>
            )}

            {/* Champ nom d'utilisateur */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Nom d'utilisateur
              </label>
              <input
                id="username"
                type="text"
                value={state.username}
                onChange={handleInputChange('username')}
                className="input-standard"
                placeholder="Votre nom d'utilisateur DSM"
                autoComplete="username"
                disabled={state.isLoading}
                required
              />
            </div>

            {/* Champ mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={state.password}
                onChange={handleInputChange('password')}
                className="input-standard"
                placeholder="Votre mot de passe DSM"
                autoComplete="current-password"
                disabled={state.isLoading}
                required
              />
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={state.isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Informations sur la connexion */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="text-center text-sm text-gray-400">
              <p>Utilisez vos identifiants DSM Synology</p>
              <p className="mt-1">URL: <span className="text-blue-400 font-mono text-xs">{getAPIUrl()}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};