import React from 'react';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

interface PerformanceDashboardProps {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  visible = true,
  position = 'top-right',
}) => {
  const { metrics, warnings, recommendations, isMonitoring } = usePerformanceMonitor();

  if (!visible || !isMonitoring || !metrics) {
    return null;
  }

  const positionStyles = {
    'top-left': { top: '10px', left: '10px' },
    'top-right': { top: '10px', right: '10px' },
    'bottom-left': { bottom: '10px', left: '10px' },
    'bottom-right': { bottom: '10px', right: '10px' },
  };

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return '#4CAF50'; // Green
    if (fps >= 45) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getFrameTimeColor = (frameTime: number) => {
    if (frameTime <= 16.67) return '#4CAF50'; // Green (60fps target)
    if (frameTime <= 22.22) return '#FF9800'; // Orange (45fps)
    return '#F44336'; // Red
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        minWidth: '250px',
        zIndex: 9999,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(5px)',
      }}
    >
      <div
        style={{
          marginBottom: '8px',
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
          paddingBottom: '4px',
        }}
      >
        Performance Monitor
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}
      >
        <div>
          <div style={{ color: getFpsColor(metrics.fps) }}>FPS: {metrics.fps}</div>
          <div style={{ fontSize: '10px', opacity: 0.7 }}>Avg: {metrics.averageFps}</div>
        </div>

        <div>
          <div style={{ color: getFrameTimeColor(metrics.frameTime) }}>
            Frame: {metrics.frameTime}ms
          </div>
          <div style={{ fontSize: '10px', opacity: 0.7 }}>Avg: {metrics.averageFrameTime}ms</div>
        </div>

        <div>
          <div>Animations: {metrics.animationCount}</div>
        </div>

        {metrics.memoryUsage && (
          <div>
            <div>Memory: {metrics.memoryUsage}MB</div>
          </div>
        )}
      </div>

      {warnings.length > 0 && (
        <div
          style={{
            marginBottom: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.3)',
            paddingTop: '4px',
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#FF9800' }}>Warnings:</div>
          {warnings.slice(-2).map((warning, index) => (
            <div key={index} style={{ fontSize: '10px', color: '#FFCDD2' }}>
              {warning}
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: '10px', opacity: 0.6 }}>Target: 60fps | Min: 45fps</div>
    </div>
  );
};

export default PerformanceDashboard;
