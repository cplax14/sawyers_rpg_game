/**
 * Performance Monitoring Utilities
 * Tools for tracking and analyzing React app performance
 */

import React from 'react';

interface PerformanceMetrics {
  componentRenders: Map<string, number>;
  renderTimes: Map<string, number[]>;
  memoryUsage: number[];
  bundleSizes: Map<string, number>;
  userInteractions: Array<{
    type: string;
    timestamp: number;
    duration?: number;
  }>;
  webVitals: {
    FCP?: number; // First Contentful Paint
    LCP?: number; // Largest Contentful Paint
    FID?: number; // First Input Delay
    CLS?: number; // Cumulative Layout Shift
    TTFB?: number; // Time to First Byte
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    componentRenders: new Map(),
    renderTimes: new Map(),
    memoryUsage: [],
    bundleSizes: new Map(),
    userInteractions: [],
    webVitals: {}
  };

  private observers: Map<string, PerformanceObserver | { disconnect: () => void }> = new Map();
  private isMonitoring = false;

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.initializeWebVitalsTracking();
    this.startMemoryTracking();
    this.trackUserInteractions();

    console.log('🚀 Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;

    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    console.log('⏹️ Performance monitoring stopped');
  }

  /**
   * Track component render
   */
  trackComponentRender(componentName: string, renderTime?: number): void {
    if (!this.isMonitoring) return;

    // Increment render count
    const currentCount = this.metrics.componentRenders.get(componentName) || 0;
    this.metrics.componentRenders.set(componentName, currentCount + 1);

    // Track render time if provided
    if (renderTime !== undefined) {
      const times = this.metrics.renderTimes.get(componentName) || [];
      times.push(renderTime);
      this.metrics.renderTimes.set(componentName, times);
    }
  }

  /**
   * Track user interaction
   */
  trackUserInteraction(type: string, duration?: number): void {
    if (!this.isMonitoring) return;

    this.metrics.userInteractions.push({
      type,
      timestamp: performance.now(),
      duration
    });
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalRenders: number;
    slowestComponents: Array<{ name: string; avgTime: number; renders: number }>;
    memoryTrend: 'increasing' | 'decreasing' | 'stable';
    interactionTypes: Record<string, number>;
    webVitalsScore: 'good' | 'needs-improvement' | 'poor';
  } {
    const totalRenders = Array.from(this.metrics.componentRenders.values()).reduce((sum, count) => sum + count, 0);

    // Calculate average render times for each component
    const slowestComponents = Array.from(this.metrics.renderTimes.entries())
      .map(([name, times]) => ({
        name,
        avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
        renders: this.metrics.componentRenders.get(name) || 0
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);

    // Memory trend analysis
    const memoryTrend = this.analyzeMemoryTrend();

    // Interaction type analysis
    const interactionTypes = this.metrics.userInteractions.reduce((acc, interaction) => {
      acc[interaction.type] = (acc[interaction.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Web Vitals score
    const webVitalsScore = this.calculateWebVitalsScore();

    return {
      totalRenders,
      slowestComponents,
      memoryTrend,
      interactionTypes,
      webVitalsScore
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const summary = this.getPerformanceSummary();
    const metrics = this.getMetrics();

    let report = `
🚀 Performance Report
=====================

📊 Render Statistics:
- Total Renders: ${summary.totalRenders}
- Components Monitored: ${metrics.componentRenders.size}

🐌 Slowest Components:
${summary.slowestComponents.map(comp =>
  `- ${comp.name}: ${comp.avgTime.toFixed(2)}ms avg (${comp.renders} renders)`
).join('\n')}

🧠 Memory Usage:
- Trend: ${summary.memoryTrend}
- Samples: ${metrics.memoryUsage.length}
- Latest: ${metrics.memoryUsage.length > 0 ?
  `${(metrics.memoryUsage[metrics.memoryUsage.length - 1] / 1024 / 1024).toFixed(1)}MB` :
  'N/A'}

👆 User Interactions:
${Object.entries(summary.interactionTypes).map(([type, count]) =>
  `- ${type}: ${count}`
).join('\n')}

⚡ Web Vitals:
- Score: ${summary.webVitalsScore}
- FCP: ${metrics.webVitals.FCP ? `${metrics.webVitals.FCP.toFixed(1)}ms` : 'N/A'}
- LCP: ${metrics.webVitals.LCP ? `${metrics.webVitals.LCP.toFixed(1)}ms` : 'N/A'}
- FID: ${metrics.webVitals.FID ? `${metrics.webVitals.FID.toFixed(1)}ms` : 'N/A'}
- CLS: ${metrics.webVitals.CLS ? metrics.webVitals.CLS.toFixed(3) : 'N/A'}

💾 Bundle Analysis:
${Array.from(metrics.bundleSizes.entries()).map(([name, size]) =>
  `- ${name}: ${(size / 1024).toFixed(1)}KB`
).join('\n')}
`;

    return report;
  }

  /**
   * Initialize Web Vitals tracking
   */
  private initializeWebVitalsTracking(): void {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.webVitals.FCP = entry.startTime;
            }
          });
        });

        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('fcp', fcpObserver);

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.webVitals.LCP = lastEntry.startTime;
        });

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.webVitals.FID = entry.processingStart - entry.startTime;
          });
        });

        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let cls = 0;
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          });
          this.metrics.webVitals.CLS = cls;
        });

        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);

      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }

    // Time to First Byte
    window.addEventListener('load', () => {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        this.metrics.webVitals.TTFB = navigationEntry.responseStart;
      }
    });
  }

  /**
   * Start memory tracking
   */
  private startMemoryTracking(): void {
    const trackMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage.push(memory.usedJSHeapSize);
      }
    };

    // Track memory every 5 seconds
    trackMemory();
    const memoryInterval = setInterval(trackMemory, 5000);

    // Store cleanup function
    this.observers.set('memory', {
      disconnect: () => clearInterval(memoryInterval)
    });
  }

  /**
   * Track user interactions
   */
  private trackUserInteractions(): void {
    const interactionTypes = ['click', 'keydown', 'scroll', 'touchstart'];

    interactionTypes.forEach(type => {
      document.addEventListener(type, () => {
        this.trackUserInteraction(type);
      }, { passive: true });
    });
  }

  /**
   * Analyze memory trend
   */
  private analyzeMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    const usage = this.metrics.memoryUsage;
    if (usage.length < 3) return 'stable';

    const recent = usage.slice(-5);
    const trend = recent[recent.length - 1] - recent[0];
    const threshold = 1024 * 1024; // 1MB

    if (trend > threshold) return 'increasing';
    if (trend < -threshold) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate Web Vitals score
   */
  private calculateWebVitalsScore(): 'good' | 'needs-improvement' | 'poor' {
    const { FCP, LCP, FID, CLS } = this.metrics.webVitals;
    let score = 0;
    let validMetrics = 0;

    // FCP scoring (good: <1.8s, needs improvement: 1.8s-3s, poor: >3s)
    if (FCP !== undefined) {
      validMetrics++;
      if (FCP < 1800) score += 3;
      else if (FCP < 3000) score += 2;
      else score += 1;
    }

    // LCP scoring (good: <2.5s, needs improvement: 2.5s-4s, poor: >4s)
    if (LCP !== undefined) {
      validMetrics++;
      if (LCP < 2500) score += 3;
      else if (LCP < 4000) score += 2;
      else score += 1;
    }

    // FID scoring (good: <100ms, needs improvement: 100ms-300ms, poor: >300ms)
    if (FID !== undefined) {
      validMetrics++;
      if (FID < 100) score += 3;
      else if (FID < 300) score += 2;
      else score += 1;
    }

    // CLS scoring (good: <0.1, needs improvement: 0.1-0.25, poor: >0.25)
    if (CLS !== undefined) {
      validMetrics++;
      if (CLS < 0.1) score += 3;
      else if (CLS < 0.25) score += 2;
      else score += 1;
    }

    if (validMetrics === 0) return 'needs-improvement';

    const avgScore = score / validMetrics;
    if (avgScore >= 2.5) return 'good';
    if (avgScore >= 1.5) return 'needs-improvement';
    return 'poor';
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React component wrapper for performance tracking
export function withPerformanceTracking<P extends {}>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const ComponentWithTracking: React.FC<P> = (props) => {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';

    React.useEffect(() => {
      const start = performance.now();

      return () => {
        const end = performance.now();
        performanceMonitor.trackComponentRender(name, end - start);
      };
    });

    return React.createElement(WrappedComponent, props);
  };

  ComponentWithTracking.displayName = `withPerformanceTracking(${name})`;
  return ComponentWithTracking;
}

export default performanceMonitor;