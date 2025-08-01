import { useEffect, useRef, useCallback } from 'react';

interface UseInactivityTimerOptions {
  timeout: number; // Durée d'inactivité en millisecondes
  onTimeout: () => void; // Fonction appelée lors du timeout
  events?: string[]; // Événements à surveiller
}

/**
 * Hook personnalisé pour gérer la déconnexion automatique après inactivité
 * Surveille les événements utilisateur et déclenche une action après un délai d'inactivité
 */
export const useInactivityTimer = ({
  timeout,
  onTimeout,
  events = ['mousedown', 'mousemove', 'keypress', 'keydown', 'scroll', 'touchstart', 'click', 'focus']
}: UseInactivityTimerOptions) => {
  const timeoutRef = useRef<number | null>(null);
  const isActiveRef = useRef(true);
  const lastMouseMoveRef = useRef(0);

  // Fonction pour réinitialiser le timer
  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      isActiveRef.current = false;
      onTimeout();
    }, timeout);
  }, [timeout, onTimeout]);

  // Fonction de gestion des événements d'activité
  const handleActivity = useCallback((event: Event) => {
    if (!isActiveRef.current) {
      isActiveRef.current = true;
    }

    // Throttling pour mousemove (éviter trop d'événements)
    if (event.type === 'mousemove') {
      const now = Date.now();
      if (now - lastMouseMoveRef.current < 500) { // Max une fois par 500ms
        return;
      }
      lastMouseMoveRef.current = now;
    }

    resetTimer();
  }, [resetTimer]);

  // Fonction pour démarrer le timer manuellement
  const startTimer = useCallback(() => {
    isActiveRef.current = true;
    resetTimer();
  }, [resetTimer]);

  // Fonction pour arrêter le timer
  const stopTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isActiveRef.current = false;
  }, []);

  // Fonction pour obtenir le statut actuel
  const isActive = useCallback(() => isActiveRef.current, []);

  useEffect(() => {
    // Ajouter les écouteurs d'événements
    events.forEach(event => {
      if (event === 'focus') {
        window.addEventListener(event, handleActivity, true);
      } else {
        document.addEventListener(event, handleActivity, true);
      }
    });

    // Démarrer le timer initial
    resetTimer();

    // Nettoyer les écouteurs et le timer au démontage
    return () => {
      events.forEach(event => {
        if (event === 'focus') {
          window.removeEventListener(event, handleActivity, true);
        } else {
          document.removeEventListener(event, handleActivity, true);
        }
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [events, handleActivity, resetTimer]);

  return {
    startTimer,
    stopTimer,
    resetTimer,
    isActive
  };
};