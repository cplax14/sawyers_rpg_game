import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Wait for DOM to be ready before mounting React
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('react-root');
  if (!rootElement) {
    console.error('❌ React root element not found');
    return;
  }

  console.log('✅ React root element found:', rootElement);
  console.log('📏 Root element dimensions:', {
    width: rootElement.offsetWidth,
    height: rootElement.offsetHeight,
    display: window.getComputedStyle(rootElement).display,
    position: window.getComputedStyle(rootElement).position,
  });

  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  console.log('🚀 React app mounted');
});
