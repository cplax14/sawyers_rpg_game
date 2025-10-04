import React from 'react';
import { createRoot } from 'react-dom/client';
import { BuffAnimationTestPage } from './src/components/combat/animations/BuffAnimationTestPage';

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find root element');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <BuffAnimationTestPage />
  </React.StrictMode>
);
