import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Configuration Firebase depuis les variables d'environnement
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Services Firebase
export const auth = getAuth(app);

// Normalisation du bucket Storage pour éviter les erreurs (iOS/Android)
const rawBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined;
let bucketUrl: string | undefined;
if (rawBucket) {
  if (rawBucket.startsWith('gs://')) {
    bucketUrl = rawBucket;
  } else if (rawBucket.endsWith('.appspot.com')) {
    bucketUrl = `gs://${rawBucket}`;
  } else if (rawBucket.endsWith('.firebasestorage.app')) {
    const projectId = rawBucket.replace('.firebasestorage.app', '');
    bucketUrl = `gs://${projectId}.appspot.com`;
  } else {
    bucketUrl = `gs://${rawBucket}`;
  }
}

export const storage = bucketUrl ? getStorage(app, bucketUrl) : getStorage(app);

export default app;
