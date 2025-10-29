/**
 * Auto-Save Performance Monitor
 * Real-time visualization of auto-save performance metrics
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOptimizedAutoSave } from '../../hooks/useOptimizedAutoSave';
import { Button } from '../atoms/Button';
import HelpTooltip from '../atoms/HelpTooltip';

interface PerformanceGraphProps {
  data: number[];
  label: string;
  color: string;
  max: number;
  unit: string;
}

const PerformanceGraph: React.FC<PerformanceGraphProps> = ({ data, label, color, max, unit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Draw background grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw data line
    if (data.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const stepX = width / (data.length - 1);

      data.forEach((value, index) => {
        const x = index * stepX;
        const y = height - (value / max) * height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw fill
      ctx.fillStyle = color + '20';
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
    }

    // Draw current value
    if (data.length > 0) {
      const currentValue = data[data.length - 1];
      const currentY = height - (currentValue / max) * height;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(width - 5, currentY, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [data, color, max]);

  return (
    <div className='relative'>
      <div className='flex justify-between text-xs text-gray-400 mb-1'>
        <span>{label}</span>
        <span>{data.length > 0 ? `${data[data.length - 1].toFixed(1)}${unit}` : '--'}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={200}
        height={60}
        className='border border-gray-600 rounded bg-gray-800'
      />
      <div className='flex justify-between text-xs text-gray-500 mt-1'>
        <span>0{unit}</span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
};

interface AutoSavePerformanceMonitorProps {
  isVisible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
}

export const AutoSavePerformanceMonitor: React.FC<AutoSavePerformanceMonitorProps> = ({
  isVisible = false,
  position = 'top-left',
  compact = false,
}) => {
  const {
    performanceMetrics,
    currentFPS,
    isPerformanceOptimal,
    serializationEfficiency,
    autoSaveState,
    pauseReason,
    optimizePerformance,
    resetPerformanceMetrics,
  } = useOptimizedAutoSave();

  const [isExpanded, setIsExpanded] = useState(false);
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);
  const [serializationHistory, setSerializationHistory] = useState<number[]>([]);
  const [saveSizeHistory, setSaveSizeHistory] = useState<number[]>([]);

  // Update performance history
  useEffect(() => {
    const interval = setInterval(() => {
      setFpsHistory(prev => [...prev.slice(-29), currentFPS]);
      setSerializationHistory(prev => [
        ...prev.slice(-29),
        performanceMetrics.averageSerializationTime,
      ]);
      setSaveSizeHistory(prev => [
        ...prev.slice(-29),
        performanceMetrics.averageSaveSize / 1024, // Convert to KB
      ]);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentFPS, performanceMetrics]);

  const getPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000,
    };

    switch (position) {
      case 'top-left':
        return { ...base, top: '1rem', left: '1rem' };
      case 'top-right':
        return { ...base, top: '1rem', right: '1rem' };
      case 'bottom-left':
        return { ...base, bottom: '1rem', left: '1rem' };
      case 'bottom-right':
        return { ...base, bottom: '1rem', right: '1rem' };
      default:
        return base;
    }
  };

  const getPerformanceColor = () => {
    if (isPerformanceOptimal) return '#10b981'; // green
    if (serializationEfficiency > 50) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  if (!isVisible) return null;

  return (
    <div style={getPositionStyles()}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className='bg-gray-900 border-2 rounded-lg shadow-lg'
          style={{
            borderColor: getPerformanceColor(),
            minWidth: compact ? '200px' : '320px',
          }}
        >
          {/* Header */}
          <div
            className='flex items-center justify-between p-3 cursor-pointer'
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className='flex items-center gap-2'>
              <div
                className='w-3 h-3 rounded-full'
                style={{ backgroundColor: getPerformanceColor() }}
              />
              <span className='text-white font-semibold text-sm'>Auto-Save Performance</span>
              <HelpTooltip
                content='Monitor auto-save performance impact on gameplay'
                icon='ℹ️'
                position='bottom'
              />
            </div>
            <button className='text-gray-400 hover:text-white'>{isExpanded ? '▼' : '▶'}</button>
          </div>

          {/* Quick Stats */}
          <div className='px-3 pb-2'>
            <div className='grid grid-cols-3 gap-2 text-xs'>
              <div className='text-center'>
                <div className='text-gray-400'>FPS</div>
                <div
                  className='font-bold'
                  style={{ color: currentFPS >= 30 ? '#10b981' : '#ef4444' }}
                >
                  {currentFPS}
                </div>
              </div>
              <div className='text-center'>
                <div className='text-gray-400'>Efficiency</div>
                <div className='font-bold' style={{ color: getPerformanceColor() }}>
                  {serializationEfficiency.toFixed(0)}%
                </div>
              </div>
              <div className='text-center'>
                <div className='text-gray-400'>Status</div>
                <div className='font-bold text-xs' style={{ color: getPerformanceColor() }}>
                  {isPerformanceOptimal ? 'Optimal' : 'Impact'}
                </div>
              </div>
            </div>
          </div>

          {/* Pause Reason */}
          {pauseReason && (
            <div className='mx-3 mb-2 p-2 bg-yellow-900 border border-yellow-600 rounded text-xs'>
              <div className='text-yellow-200 font-semibold'>Auto-Save Paused</div>
              <div className='text-yellow-300'>{pauseReason.reason}</div>
              {pauseReason.metrics && (
                <div className='text-yellow-400 mt-1'>
                  FPS: {pauseReason.metrics.fps} | Save Time:{' '}
                  {pauseReason.metrics.serializationTime.toFixed(1)}ms
                </div>
              )}
            </div>
          )}

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className='overflow-hidden'
              >
                <div className='p-3 border-t border-gray-700'>
                  {/* Performance Graphs */}
                  {!compact && (
                    <div className='space-y-4'>
                      <PerformanceGraph
                        data={fpsHistory}
                        label='Frame Rate'
                        color='#10b981'
                        max={60}
                        unit=' FPS'
                      />
                      <PerformanceGraph
                        data={serializationHistory}
                        label='Serialization Time'
                        color='#f59e0b'
                        max={100}
                        unit='ms'
                      />
                      <PerformanceGraph
                        data={saveSizeHistory}
                        label='Save Size'
                        color='#3b82f6'
                        max={500}
                        unit='KB'
                      />
                    </div>
                  )}

                  {/* Detailed Metrics */}
                  <div className='mt-4 space-y-2'>
                    <div className='text-sm text-gray-300'>
                      <div className='flex justify-between'>
                        <span>Total Saves:</span>
                        <span>{performanceMetrics.totalSaves}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Failed Saves:</span>
                        <span className={performanceMetrics.failedSaves > 0 ? 'text-red-400' : ''}>
                          {performanceMetrics.failedSaves}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Debounced Saves:</span>
                        <span className='text-blue-400'>{performanceMetrics.debouncedSaves}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Max Save Time:</span>
                        <span>{performanceMetrics.maxSerializationTime.toFixed(1)}ms</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Max Save Size:</span>
                        <span>{(performanceMetrics.maxSaveSize / 1024).toFixed(1)}KB</span>
                      </div>
                    </div>
                  </div>

                  {/* Auto-Save State */}
                  <div className='mt-4 p-2 bg-gray-800 rounded text-xs'>
                    <div className='text-gray-400 mb-1'>Auto-Save State:</div>
                    <div className='space-y-1 text-gray-300'>
                      <div className='flex justify-between'>
                        <span>Active:</span>
                        <span
                          className={autoSaveState.isActive ? 'text-green-400' : 'text-red-400'}
                        >
                          {autoSaveState.isActive ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Paused:</span>
                        <span
                          className={autoSaveState.isPaused ? 'text-yellow-400' : 'text-green-400'}
                        >
                          {autoSaveState.isPaused ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Debouncing:</span>
                        <span className={autoSaveState.isDebouncing ? 'text-blue-400' : ''}>
                          {autoSaveState.isDebouncing ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {autoSaveState.lastSaveTime > 0 && (
                        <div className='flex justify-between'>
                          <span>Last Save:</span>
                          <span>{new Date(autoSaveState.lastSaveTime).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className='mt-4 flex gap-2'>
                    <Button
                      variant='primary'
                      size='sm'
                      onClick={optimizePerformance}
                      disabled={isPerformanceOptimal}
                    >
                      Optimize
                    </Button>
                    <Button variant='outline' size='sm' onClick={resetPerformanceMetrics}>
                      Reset
                    </Button>
                  </div>

                  {/* Performance Recommendations */}
                  {!isPerformanceOptimal && (
                    <div className='mt-4 p-2 bg-orange-900 border border-orange-600 rounded text-xs'>
                      <div className='text-orange-200 font-semibold mb-1'>
                        Performance Recommendations:
                      </div>
                      <ul className='text-orange-300 space-y-1'>
                        {currentFPS < 30 && (
                          <li>• Frame rate is low - auto-save frequency reduced</li>
                        )}
                        {performanceMetrics.averageSerializationTime > 50 && (
                          <li>• Serialization is slow - consider optimizing game state</li>
                        )}
                        {performanceMetrics.averageSaveSize > 500 * 1024 && (
                          <li>• Save size is large - data compression enabled</li>
                        )}
                        {performanceMetrics.failedSaves > 5 && (
                          <li>• Multiple save failures detected - check storage</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AutoSavePerformanceMonitor;
