import { useCallback, useEffect, useRef, useState } from 'react';

export type AppUpdateState = {
  updateReady: boolean;
  updating: boolean;
  update: () => void;
  later: () => void;
};

const DISMISS_KEY = 'mysafebox.updateDismissed';
const CHECK_INTERVAL_MS = 60_000;

async function fetchRemoteBuildId(): Promise<string | null> {
  try {
    const response = await fetch('/version.json', { cache: 'no-store' });
    if (!response.ok) return null;
    const payload = (await response.json()) as { buildId?: unknown };
    return typeof payload.buildId === 'string' ? payload.buildId : null;
  } catch {
    return null;
  }
}

function readDismissed(): string | null {
  try {
    return sessionStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

function waitForInstalled(worker: ServiceWorker): Promise<void> {
  if (worker.state !== 'installing') return Promise.resolve();
  return new Promise((resolve) => {
    const onChange = () => {
      if (worker.state === 'installing') return;
      worker.removeEventListener('statechange', onChange);
      resolve();
    };
    worker.addEventListener('statechange', onChange);
  });
}

export function useServiceWorkerUpdate(): AppUpdateState {
  const [swWaiting, setSwWaiting] = useState(false);
  const [remoteBuildId, setRemoteBuildId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(() => readDismissed());
  const [updating, setUpdating] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    let cancelled = false;

    const watch = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting && navigator.serviceWorker.controller) setSwWaiting(true);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            setSwWaiting(true);
          }
        });
      });
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => {
          if (cancelled) return;
          registrationRef.current = registration;
          watch(registration);
        })
        .catch(() => undefined);
    }

    const check = async () => {
      if (!navigator.onLine) return;
      const buildId = await fetchRemoteBuildId();
      if (!cancelled) setRemoteBuildId(buildId);
      await registrationRef.current?.update().catch(() => undefined);
    };

    void check();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check();
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(() => void check(), CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, []);

  const remoteDiffers = remoteBuildId !== null && remoteBuildId !== __BUILD_ID__;
  const offerId = remoteDiffers ? remoteBuildId : swWaiting ? 'service-worker' : null;
  const updateReady = offerId !== null && offerId !== dismissed;

  const later = useCallback(() => {
    if (!offerId) return;
    try {
      sessionStorage.setItem(DISMISS_KEY, offerId);
    } catch {
      // Sans stockage de session, « Plus tard » vaut seulement pour cet affichage.
    }
    setDismissed(offerId);
  }, [offerId]);

  const update = useCallback(async () => {
    setUpdating(true);
    let reloaded = false;
    const reloadOnce = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };

    const registration = registrationRef.current;
    if (!registration) {
      reloadOnce();
      return;
    }
    await registration.update().catch(() => undefined);
    const worker = registration.waiting ?? registration.installing;
    if (!worker) {
      reloadOnce();
      return;
    }
    navigator.serviceWorker.addEventListener('controllerchange', reloadOnce, { once: true });
    window.setTimeout(reloadOnce, 8000);
    await waitForInstalled(worker);
    if (worker.state === 'redundant') {
      reloadOnce();
      return;
    }
    worker.postMessage({ type: 'SKIP_WAITING' });
  }, []);

  return { updateReady, updating, update: () => void update(), later };
}
