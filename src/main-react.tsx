import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ReactAppWithDevtools } from './ReactApp';
import './styles/global.css';

/**
 * Pure React Entry Point
 * Bootstraps the React-only version of the game
 */

// Enhanced error handling for initialization
const handleInitializationError = (error: Error) => {
  console.error('❌ Failed to initialize React Game App:', error);

  // Create a fallback error UI
  const rootElement = document.getElementById('root') || document.body;
  rootElement.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      text-align: center;
      padding: 2rem;
    ">
      <div style="
        background: rgba(15, 23, 42, 0.8);
        border: 2px solid #dc2626;
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      ">
        <h1 style="color: #dc2626; margin: 0 0 1rem 0;">
          Game Initialization Failed
        </h1>
        <p style="margin: 0 0 1.5rem 0; line-height: 1.5; color: #94a3b8;">
          ${error.message || 'An unknown error occurred during game initialization.'}
        </p>
        <button onclick="window.location.reload()" style="
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        " onmouseover="this.style.background='#2563eb'"
           onmouseout="this.style.background='#3b82f6'">
          Reload Game
        </button>
      </div>
    </div>
  `;
};

// Initialize the React application
const initializeApp = () => {
  try {
    console.log('🚀 Initializing Pure React Game App...');

    // Get or create the root element
    let rootElement = document.getElementById('root');

    if (!rootElement) {
      console.log('📝 Creating root element...');
      rootElement = document.createElement('div');
      rootElement.id = 'root';
      rootElement.style.cssText = `
        width: 100vw;
        height: 100vh;
        margin: 0;
        padding: 0;
        overflow: hidden;
      `;
      document.body.appendChild(rootElement);
    }

    console.log('✅ Root element ready:', {
      id: rootElement.id,
      width: rootElement.offsetWidth,
      height: rootElement.offsetHeight,
      display: window.getComputedStyle(rootElement).display,
      position: window.getComputedStyle(rootElement).position
    });

    // Create React root and render the app
    const root = createRoot(rootElement);

    const isDevelopment = import.meta.env?.DEV || process.env.NODE_ENV === 'development';
    const AppComponent = isDevelopment ? ReactAppWithDevtools : ReactAppWithDevtools; // Always use devtools for now

    root.render(
      <StrictMode>
        <AppComponent />
      </StrictMode>
    );

    console.log('🎮 React Game App mounted successfully');

    // Add development helpers
    if (isDevelopment) {
      // Make app accessible in console for debugging
      (window as any).__REACT_GAME_APP__ = {
        version: '1.0.0',
        mode: 'pure-react',
        root,
        timestamp: new Date().toISOString()
      };

      console.log('🔧 Development mode active - Game accessible via window.__REACT_GAME_APP__');
    }

  } catch (error) {
    handleInitializationError(error instanceof Error ? error : new Error('Unknown initialization error'));
  }
};

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already ready
  initializeApp();
}

// Handle unhandled errors
window.addEventListener('error', (event) => {
  console.error('🔥 Unhandled Error:', event.error);
  // Could send to error reporting service here
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🔥 Unhandled Promise Rejection:', event.reason);
  // Could send to error reporting service here
});

// Export for potential external use
export { initializeApp };