import { useEffect, useCallback, useRef } from 'react';

export const useInactivityTimer = (
  onTimeout: () => void,
  timeout: number = 900000 // 15 minutes par défaut
) => {
  const timerRef = useRef<number | null>(null);
  const onTimeoutRef = useRef(onTimeout);

  // Mettre à jour la référence du callback
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Réinitialiser le timer
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      onTimeoutRef.current();
    }, timeout);
  }, [timeout]);

  // Démarrer le timer
  const startTimer = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Arrêter le timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Configuration des événements d'activité
  useEffect(() => {
    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll',
      'touchstart', 'click', 'keydown'
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Ajouter les listeners d'événements
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Démarrer le timer
    startTimer();

    // Nettoyage
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      stopTimer();
    };
  }, [resetTimer, startTimer, stopTimer]);

  return {
    resetTimer,
    startTimer,
    stopTimer
  };
};