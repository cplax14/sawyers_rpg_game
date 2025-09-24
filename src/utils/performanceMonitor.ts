/**
 * Performance Monitor for Animation Systems
 * Tracks frame rates, animation performance, and provides optimization recommendations
 */

export interface PerformanceMetrics {
  fps: number;
  averageFps: number;
  minFps: number;
  maxFps: number;
  frameTime: number;
  averageFrameTime: number;
  animationCount: number;
  memoryUsage?: number;
  lastUpdate: number;
}

export interface PerformanceThresholds {
  targetFps: number;
  minAcceptableFps: number;
  maxFrameTime: number;
  maxAnimations: number;
  memoryWarningMB?: number;
}

export interface AnimationPerformanceData {
  id: string;
  type: string;
  startTime: number;
  endTime?: number;
  duration: number;
  complexity: 'low' | 'medium' | 'high';
  elementCount: number;
}

export class PerformanceMonitor {
  private frames: number[] = [];
  private lastFrameTime = 0;
  private isMonitoring = false;
  private animationFrameId?: number;
  private metricsCallback?: (metrics: PerformanceMetrics) => void;
  private warningCallback?: (warning: string, metrics: PerformanceMetrics) => void;

  private readonly maxFrameHistory = 120; // 2 seconds at 60fps
  private activeAnimations = new Map<string, AnimationPerformanceData>();

  public readonly thresholds: PerformanceThresholds = {
    targetFps: 60,
    minAcceptableFps: 45,
    maxFrameTime: 16.67, // 60fps = 16.67ms per frame
    maxAnimations: 50,
    memoryWarningMB: 100
  };

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    if (thresholds) {
      Object.assign(this.thresholds, thresholds);
    }
  }

  /**
   * Start monitoring performance metrics
   */
  public startMonitoring(
    metricsCallback?: (metrics: PerformanceMetrics) => void,
    warningCallback?: (warning: string, metrics: PerformanceMetrics) => void
  ): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.metricsCallback = metricsCallback;
    this.warningCallback = warningCallback;
    this.lastFrameTime = performance.now();
    this.frames = [];

    this.tick();
  }

  /**
   * Stop monitoring performance metrics
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  /**
   * Register an animation start
   */
  public startAnimation(data: Omit<AnimationPerformanceData, 'startTime' | 'endTime'>): void {
    const animationData: AnimationPerformanceData = {
      ...data,
      startTime: performance.now()
    };

    this.activeAnimations.set(data.id, animationData);

    // Check if we exceed max animations
    if (this.activeAnimations.size > this.thresholds.maxAnimations) {
      this.warn(`Too many concurrent animations: ${this.activeAnimations.size}/${this.thresholds.maxAnimations}`);
    }
  }

  /**
   * Register an animation end
   */
  public endAnimation(id: string): void {
    const animation = this.activeAnimations.get(id);
    if (animation) {
      animation.endTime = performance.now();
      this.activeAnimations.delete(id);
    }
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    const now = performance.now();
    const frameTime = this.frames.length > 0 ? now - this.lastFrameTime : 0;

    const fps = this.frames.length > 0 ? 1000 / (this.frames.reduce((a, b) => a + b, 0) / this.frames.length) : 0;
    const averageFps = fps;
    const minFps = this.frames.length > 0 ? 1000 / Math.max(...this.frames) : 0;
    const maxFps = this.frames.length > 0 ? 1000 / Math.min(...this.frames) : 0;
    const averageFrameTime = this.frames.length > 0 ? this.frames.reduce((a, b) => a + b, 0) / this.frames.length : 0;

    const metrics: PerformanceMetrics = {
      fps: Math.round(fps * 100) / 100,
      averageFps: Math.round(averageFps * 100) / 100,
      minFps: Math.round(minFps * 100) / 100,
      maxFps: Math.round(maxFps * 100) / 100,
      frameTime: Math.round(frameTime * 100) / 100,
      averageFrameTime: Math.round(averageFrameTime * 100) / 100,
      animationCount: this.activeAnimations.size,
      lastUpdate: now
    };

    // Add memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100;
    }

    return metrics;
  }

  /**
   * Get performance recommendations based on current metrics
   */
  public getRecommendations(): string[] {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];

    if (metrics.fps < this.thresholds.minAcceptableFps) {
      recommendations.push('Frame rate is below acceptable threshold. Consider reducing animation complexity.');
    }

    if (metrics.frameTime > this.thresholds.maxFrameTime) {
      recommendations.push('Frame time is too high. Optimize rendering or reduce concurrent animations.');
    }

    if (metrics.animationCount > this.thresholds.maxAnimations * 0.8) {
      recommendations.push('High number of concurrent animations. Consider animation pooling or staggering.');
    }

    if (metrics.memoryUsage && this.thresholds.memoryWarningMB && metrics.memoryUsage > this.thresholds.memoryWarningMB) {
      recommendations.push('High memory usage detected. Check for animation memory leaks.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable parameters.');
    }

    return recommendations;
  }

  /**
   * Create a performance snapshot for debugging
   */
  public createSnapshot(): {
    metrics: PerformanceMetrics;
    activeAnimations: AnimationPerformanceData[];
    recommendations: string[];
    timestamp: number;
  } {
    return {
      metrics: this.getMetrics(),
      activeAnimations: Array.from(this.activeAnimations.values()),
      recommendations: this.getRecommendations(),
      timestamp: performance.now()
    };
  }

  /**
   * Check if the system supports advanced performance monitoring
   */
  public static supportsAdvancedMetrics(): boolean {
    return typeof performance !== 'undefined' &&
           'memory' in performance &&
           'mark' in performance &&
           'measure' in performance;
  }

  /**
   * Enable reduced motion based on user preferences
   */
  public static prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private tick = (): void => {
    if (!this.isMonitoring) return;

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;

    this.frames.push(frameTime);
    if (this.frames.length > this.maxFrameHistory) {
      this.frames.shift();
    }

    this.lastFrameTime = now;

    const metrics = this.getMetrics();

    // Call callbacks
    if (this.metricsCallback) {
      this.metricsCallback(metrics);
    }

    // Check for performance warnings
    this.checkPerformanceWarnings(metrics);

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  private checkPerformanceWarnings(metrics: PerformanceMetrics): void {
    if (!this.warningCallback) return;

    if (metrics.fps < this.thresholds.minAcceptableFps) {
      this.warn(`Low FPS detected: ${metrics.fps}fps (target: ${this.thresholds.targetFps}fps)`);
    }

    if (metrics.frameTime > this.thresholds.maxFrameTime * 2) {
      this.warn(`High frame time detected: ${metrics.frameTime}ms (target: ${this.thresholds.maxFrameTime}ms)`);
    }

    if (metrics.memoryUsage && this.thresholds.memoryWarningMB && metrics.memoryUsage > this.thresholds.memoryWarningMB) {
      this.warn(`High memory usage: ${metrics.memoryUsage}MB`);
    }
  }

  private warn(message: string): void {
    if (this.warningCallback) {
      this.warningCallback(message, this.getMetrics());
    }
  }
}

/**
 * Global performance monitor instance
 */
export const globalPerformanceMonitor = new PerformanceMonitor();

/**
 * Utility function to measure animation performance
 */
export function measureAnimation<T>(
  id: string,
  type: string,
  complexity: 'low' | 'medium' | 'high',
  elementCount: number,
  fn: () => T
): T {
  globalPerformanceMonitor.startAnimation({
    id,
    type,
    duration: 0, // Will be calculated
    complexity,
    elementCount
  });

  const result = fn();

  globalPerformanceMonitor.endAnimation(id);

  return result;
}

/**
 * Animation performance optimization utilities
 */
export const AnimationOptimizer = {
  /**
   * Throttle animation updates to maintain target FPS
   */
  throttleToFps(callback: () => void, targetFps: number = 60): () => void {
    let lastTime = 0;
    const interval = 1000 / targetFps;

    return () => {
      const now = performance.now();
      if (now - lastTime >= interval) {
        lastTime = now;
        callback();
      }
    };
  },

  /**
   * Create a frame limiter for heavy animations
   */
  createFrameLimiter(maxFramesPerSecond: number = 30): (callback: () => void) => void {
    let lastFrameTime = 0;
    const frameInterval = 1000 / maxFramesPerSecond;

    return (callback: () => void) => {
      const now = performance.now();
      if (now - lastFrameTime >= frameInterval) {
        lastFrameTime = now;
        requestAnimationFrame(callback);
      }
    };
  },

  /**
   * Batch multiple animations to run in a single frame
   */
  batchAnimations(animations: (() => void)[]): void {
    requestAnimationFrame(() => {
      animations.forEach(animation => animation());
    });
  }
};