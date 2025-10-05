/**
 * Performance Test Entry Point
 *
 * Task 7.8: Standalone entry for animation performance testing
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { AnimationPerformanceTest } from './components/combat/animations/AnimationPerformanceTest';

// Render the performance test component
const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <AnimationPerformanceTest />
  </React.StrictMode>
);

console.log('✅ Performance Test Component Loaded');
console.log('📊 Ready to begin testing...');
