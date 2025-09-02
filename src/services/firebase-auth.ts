import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User,
  type AuthError
} from 'firebase/auth';
import { auth } from '../config/firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export class FirebaseAuthService {

  // Connexion avec email/mot de passe
  async login(email: string, password: string, rememberMe: boolean = false): Promise<AuthUser> {
    try {
      // Persistance: session par défaut, locale si "se souvenir de moi"
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Si aucun displayName (anciens comptes), définir un nom par défaut basé sur l'email
      if (!user.displayName) {
        const fallbackName = user.email ? user.email.split('@')[0] : 'Utilisateur';
        try {
          await updateProfile(user, { displayName: fallbackName });
        } catch (e) {
          // ignore si non critique
        }
      }

      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      const authError = error as AuthError;
      throw new Error(this.getErrorMessage(authError.code));
    }
  }

  // Inscription avec email/mot de passe  
  async register(email: string, password: string, displayName: string): Promise<AuthUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Mettre à jour le profil avec le nom
      await updateProfile(user, { displayName });

      return {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: user.photoURL
      };
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      const authError = error as AuthError;
      throw new Error(this.getErrorMessage(authError.code));
    }
  }

  // Déconnexion
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      throw error;
    }
  }

  // Mettre à jour le nom complet de l'utilisateur courant
  async updateDisplayName(displayName: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Aucun utilisateur connecté');
    }
    await updateProfile(user, { displayName });
  }

  // Réinitialisation du mot de passe
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('Email de réinitialisation envoyé à:', email);
    } catch (error) {
      console.error('Erreur réinitialisation mot de passe:', error);
      const authError = error as AuthError;
      throw new Error(this.getErrorMessage(authError.code));
    }
  }

  // Écouter les changements d'état d'authentification
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
      } else {
        callback(null);
      }
    });
  }

  // Utilisateur actuel
  getCurrentUser(): AuthUser | null {
    const user = auth.currentUser;
    if (user) {
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };
    }
    return null;
  }

  // Messages d'erreur traduits
  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Aucun utilisateur trouvé avec cet email';
      case 'auth/wrong-password':
        return 'Mot de passe incorrect';
      case 'auth/email-already-in-use':
        return 'Cet email est déjà utilisé';
      case 'auth/weak-password':
        return 'Le mot de passe doit contenir au moins 6 caractères';
      case 'auth/invalid-email':
        return 'Email invalide';
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Réessayez plus tard';
      default:
        return 'Erreur d\'authentification';
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService();
