/**
 * Firebase Configuration
 * Initialize Firebase services for authentication and cloud storage
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration interface
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Environment-based configuration
const getFirebaseConfig = (): FirebaseConfig => {
  // Access environment variables safely in browser environment
  const env = (import.meta as any).env || {};

  const config: FirebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyBe_IhD5D662gd7hfIyXCvDS6UtIKm8pJg',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'sawyers-rpg-game.firebaseapp.com',
    projectId: env.VITE_FIREBASE_PROJECT_ID || 'sawyers-rpg-game',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'sawyers-rpg-game.firebasestorage.app',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '963309553093',
    appId: env.VITE_FIREBASE_APP_ID || '1:963309553093:web:4a989b49ab75f8bafd37ac',
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || 'G-YQ5SKL679K',
  };

  // Validate required configuration
  const requiredFields: (keyof FirebaseConfig)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  for (const field of requiredFields) {
    if (!config[field] || config[field]?.includes('your-')) {
      console.warn(
        `Firebase ${field} is not configured properly. Please set VITE_FIREBASE_${field.toUpperCase()} in your environment variables.`
      );
    }
  }

  return config;
};

// Firebase app instance
let firebaseApp: FirebaseApp;
let firebaseAuth: Auth;
let firebaseFirestore: Firestore;
let firebaseStorage: FirebaseStorage;

/**
 * Initialize Firebase services
 */
export const initializeFirebase = (): {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
} => {
  try {
    if (!firebaseApp) {
      const config = getFirebaseConfig();
      firebaseApp = initializeApp(config);

      // Initialize services
      firebaseAuth = getAuth(firebaseApp);
      firebaseFirestore = getFirestore(firebaseApp);
      firebaseStorage = getStorage(firebaseApp);

      // Connect to emulators in development
      const env = (import.meta as any).env || {};
      if (env.NODE_ENV === 'development' && env.VITE_USE_FIREBASE_EMULATOR === 'true') {
        try {
          // Only connect to emulators if not already connected
          if (!firebaseAuth.config.emulator) {
            connectAuthEmulator(firebaseAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
          }

          // Note: Firestore and Storage emulator connections have different checks
          connectFirestoreEmulator(firebaseFirestore, '127.0.0.1', 8080);
          connectStorageEmulator(firebaseStorage, '127.0.0.1', 9199);

          console.log('Connected to Firebase emulators');
        } catch (error) {
          console.log('Firebase emulators already connected or not available:', error);
        }
      }

      console.log('Firebase initialized successfully');
    }

    return {
      app: firebaseApp,
      auth: firebaseAuth,
      firestore: firebaseFirestore,
      storage: firebaseStorage,
    };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw new Error('Firebase initialization failed. Please check your configuration.');
  }
};

/**
 * Get Firebase services (initializes if needed)
 */
export const getFirebaseServices = () => {
  if (!firebaseApp) {
    return initializeFirebase();
  }

  return {
    app: firebaseApp,
    auth: firebaseAuth,
    firestore: firebaseFirestore,
    storage: firebaseStorage,
  };
};

/**
 * Firebase service getters
 */
export const getFirebaseAuth = (): Auth => {
  const { auth } = getFirebaseServices();
  return auth;
};

export const getFirebaseFirestore = (): Firestore => {
  const { firestore } = getFirebaseServices();
  return firestore;
};

export const getFirebaseStorage = (): FirebaseStorage => {
  const { storage } = getFirebaseServices();
  return storage;
};

/**
 * Check if Firebase is properly configured
 */
export const isFirebaseConfigured = (): boolean => {
  try {
    const config = getFirebaseConfig();
    return !Object.values(config).some(
      value => value && typeof value === 'string' && value.includes('your-')
    );
  } catch {
    return false;
  }
};

/**
 * Firebase connection status
 */
export const checkFirebaseConnection = async (): Promise<{
  connected: boolean;
  services: {
    auth: boolean;
    firestore: boolean;
    storage: boolean;
  };
  error?: string;
}> => {
  try {
    const { auth, firestore, storage } = getFirebaseServices();

    // Test basic connectivity
    const authStatus = !!auth.currentUser || auth.currentUser === null; // null means not signed in but connected

    // For firestore, we can try a simple operation (this won't fail if properly configured)
    const firestoreStatus = !!firestore.app;

    // For storage, we can check if the service is available
    const storageStatus = !!storage.app;

    return {
      connected: authStatus && firestoreStatus && storageStatus,
      services: {
        auth: authStatus,
        firestore: firestoreStatus,
        storage: storageStatus,
      },
    };
  } catch (error) {
    return {
      connected: false,
      services: {
        auth: false,
        firestore: false,
        storage: false,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Export Firebase services for direct use
export {
  firebaseApp as app,
  firebaseAuth as auth,
  firebaseFirestore as firestore,
  firebaseStorage as storage,
};
