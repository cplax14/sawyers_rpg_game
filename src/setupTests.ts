// Jest test setup file
import '@testing-library/jest-dom';
import 'whatwg-fetch'; // Polyfill fetch for Firebase and other APIs

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => {
  const React = require('react');

  // Create a mock motion component that accepts Framer Motion props
  const createMotionComponent = (component: string) => {
    return React.forwardRef(({ children, onAnimationComplete, onExitComplete, ...props }: any, ref: any) => {
      // Call lifecycle callbacks immediately in tests
      React.useEffect(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, [onAnimationComplete]);

      return React.createElement(component, { ...props, ref }, children);
    });
  };

  return {
    motion: {
      div: createMotionComponent('div'),
      button: createMotionComponent('button'),
      input: createMotionComponent('input'),
      span: createMotionComponent('span'),
      img: createMotionComponent('img'),
    },
    AnimatePresence: ({ children, onExitComplete }: { children: React.ReactNode, onExitComplete?: () => void }) => {
      // Call exit callback immediately in tests
      React.useEffect(() => {
        return () => {
          if (onExitComplete) {
            onExitComplete();
          }
        };
      }, [onExitComplete]);

      return children;
    },
  };
});

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage for save system tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock IndexedDB for save system tests
const indexedDBMock = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
  cmp: jest.fn(),
};
global.indexedDB = indexedDBMock as any;

// Mock uuid for ES module compatibility
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4')
}));

// Mock Firebase configuration to avoid import.meta issues
jest.mock('./config/firebase', () => {
  const mockAuth = {
    currentUser: null,
    config: {},
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
  };

  const mockFirestore = {
    app: {},
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
  };

  const mockStorage = {
    app: {},
    ref: jest.fn(),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(),
  };

  const mockApp = {
    name: '[DEFAULT]',
    options: {},
    automaticDataCollectionEnabled: false,
  };

  return {
    initializeFirebase: jest.fn(() => ({
      app: mockApp,
      auth: mockAuth,
      firestore: mockFirestore,
      storage: mockStorage,
    })),
    getFirebaseServices: jest.fn(() => ({
      app: mockApp,
      auth: mockAuth,
      firestore: mockFirestore,
      storage: mockStorage,
    })),
    getFirebaseAuth: jest.fn(() => mockAuth),
    getFirebaseFirestore: jest.fn(() => mockFirestore),
    getFirebaseStorage: jest.fn(() => mockStorage),
    isFirebaseConfigured: jest.fn(() => true),
    checkFirebaseConnection: jest.fn(async () => ({
      connected: true,
      services: {
        auth: true,
        firestore: true,
        storage: true,
      },
    })),
    app: mockApp,
    auth: mockAuth,
    firestore: mockFirestore,
    storage: mockStorage,
  };
});

// Mock import.meta for Vite compatibility
// This is needed for Firebase config and other Vite-specific imports
(global as any).import = {
  meta: {
    env: {
      NODE_ENV: 'test',
      VITE_FIREBASE_API_KEY: 'mock-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'mock-auth-domain',
      VITE_FIREBASE_PROJECT_ID: 'mock-project-id',
      VITE_FIREBASE_STORAGE_BUCKET: 'mock-storage-bucket',
      VITE_FIREBASE_MESSAGING_SENDER_ID: 'mock-sender-id',
      VITE_FIREBASE_APP_ID: 'mock-app-id',
      VITE_USE_FIREBASE_EMULATOR: 'false'
    }
  }
};