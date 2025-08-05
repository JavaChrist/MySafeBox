import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Service Worker Registration - PWA iPhone Ready
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.PROD) {
      // Production : Enregistrer le service worker
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('MySafeBox SW: Registered successfully', registration.scope);

          // Vérifier les mises à jour
          registration.addEventListener('updatefound', () => {
            console.log('MySafeBox SW: Update found');
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('MySafeBox SW: New version available');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('MySafeBox SW: Registration failed', error);
        });
    } else {
      // Développement : Désactiver service workers
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (const registration of registrations) {
          registration.unregister()
            .then(() => console.log('MySafeBox SW: Unregistered for dev'));
        }
      });
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
