// Lightweight SW update hook for Vite + custom public/sw.js
import { useEffect, useRef, useState, useCallback } from 'react';

export type SWUpdateState = {
  updateReady: boolean;
  updating: boolean;
  update: () => void;
};

export function useServiceWorkerUpdate(): SWUpdateState {
  const [updateReady, setUpdateReady] = useState(false);
  const [updating, setUpdating] = useState(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  // Register the SW and detect when a new version is waiting
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js');

        if (registration.waiting) {
          waitingWorkerRef.current = registration.waiting;
          setUpdateReady(true);
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration?.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              waitingWorkerRef.current = registration?.waiting ?? null;
              setUpdateReady(true);
            }
          });
        });
      } catch {
        // ignore
      }
    };

    register();

    // If the page gains focus, check for updates
    const onFocus = () => registration?.update();
    window.addEventListener('focus', onFocus);

    // When controller changes, reload once to activate the new SW
    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      window.removeEventListener('focus', onFocus);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const update = useCallback(() => {
    if (!waitingWorkerRef.current) return;
    setUpdating(true);
    waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
  }, []);

  return { updateReady, updating, update };
}


