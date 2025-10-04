import React from 'react';
import { createRoot } from 'react-dom/client';
import AnimationTestPage from './src/components/combat/animations/AnimationTestPage';

// Create root element if needed
let rootElement = document.getElementById('root');

if (!rootElement) {
  rootElement = document.createElement('div');
  rootElement.id = 'root';
  document.body.appendChild(rootElement);
}

// Render the test page
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AnimationTestPage />
  </React.StrictMode>
);

console.log('✅ Animation Test Page loaded');
