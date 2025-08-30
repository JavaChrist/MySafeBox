import React, { useState } from 'react';
import { AlertCircle, RefreshCw, UserPlus, Mail, User, Lock, Eye, EyeOff } from 'lucide-react';
import { firebaseAuthService, type AuthUser } from '../services/firebase-auth';

interface LoginFormProps {
  onLogin: (user: AuthUser) => void;
}

interface LoginFormState {
  email: string;
  password: string;
  displayName: string;
  isLoading: boolean;
  error: string | null;
  isRegisterMode: boolean;
  showPassword: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [state, setState] = useState<LoginFormState>({
    email: '',
    password: '',
    displayName: '',
    isLoading: false,
    error: null,
    isRegisterMode: false,
    showPassword: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation des champs
    if (!state.email.trim() || !state.password.trim()) {
      setState(prev => ({ ...prev, error: 'Veuillez remplir tous les champs' }));
      return;
    }

    if (state.isRegisterMode && !state.displayName.trim()) {
      setState(prev => ({ ...prev, error: 'Veuillez entrer votre nom' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let user: AuthUser;

      if (state.isRegisterMode) {
        // Inscription
        user = await firebaseAuthService.register(
          state.email.trim(),
          state.password,
          state.displayName.trim()
        );
      } else {
        // Connexion
        user = await firebaseAuthService.login(
          state.email.trim(),
          state.password
        );
      }

      onLogin(user);
    } catch (error) {
      console.error('Auth error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur d\'authentification'
      }));
    }
  };

  const handleInputChange = (field: keyof Pick<LoginFormState, 'email' | 'password' | 'displayName'>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setState(prev => ({
        ...prev,
        [field]: e.target.value,
        error: null // Clear error when user types
      }));
    };

  const toggleMode = () => {
    setState(prev => ({
      ...prev,
      isRegisterMode: !prev.isRegisterMode,
      error: null,
      email: '',
      password: '',
      displayName: '',
      showPassword: false
    }));
  };

  const togglePasswordVisibility = () => {
    setState(prev => ({ ...prev, showPassword: !prev.showPassword }));
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
          <p className="text-gray-400">
            {state.isRegisterMode ? 'Créer un compte' : 'Coffre-fort numérique sécurisé'}
          </p>
        </div>

        {/* Formulaire de connexion/inscription */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Message d'erreur */}
            {state.error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-400 text-sm">{state.error}</span>
              </div>
            )}

            {/* Champ nom (inscription uniquement) */}
            {state.isRegisterMode && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nom complet
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={state.displayName}
                  onChange={handleInputChange('displayName')}
                  className="input-standard"
                  placeholder="Votre nom complet"
                  autoComplete="name"
                  disabled={state.isLoading}
                  required={state.isRegisterMode}
                />
              </div>
            )}

            {/* Champ email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                id="email"
                type="email"
                value={state.email}
                onChange={handleInputChange('email')}
                className="input-standard"
                placeholder="votre@email.com"
                autoComplete="email"
                disabled={state.isLoading}
                required
              />
            </div>

            {/* Champ mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={state.showPassword ? "text" : "password"}
                  value={state.password}
                  onChange={handleInputChange('password')}
                  className="input-standard pr-10"
                  placeholder={state.isRegisterMode ? "Minimum 6 caractères" : "Votre mot de passe"}
                  autoComplete={state.isRegisterMode ? "new-password" : "current-password"}
                  disabled={state.isLoading}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  disabled={state.isLoading}
                  tabIndex={-1}
                >
                  {state.showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Bouton principal */}
            <button
              type="submit"
              disabled={state.isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {state.isRegisterMode ? 'Création en cours...' : 'Connexion en cours...'}
                </>
              ) : (
                <>
                  {state.isRegisterMode ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Créer un compte
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </>
              )}
            </button>
          </form>

          {/* Basculer entre connexion et inscription */}
          <div className="mt-6 pt-6 border-t border-gray-700 text-center">
            <button
              type="button"
              onClick={toggleMode}
              disabled={state.isLoading}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors disabled:opacity-50"
            >
              {state.isRegisterMode ? (
                'Déjà un compte ? Se connecter'
              ) : (
                'Pas de compte ? S\'inscrire'
              )}
            </button>
          </div>

          {/* Informations */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="text-center text-sm text-gray-400">
              <p>🔥 Powered by Firebase</p>
              <p className="mt-1">Authentification et stockage sécurisés</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};