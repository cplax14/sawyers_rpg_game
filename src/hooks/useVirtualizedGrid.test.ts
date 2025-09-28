import { renderHook, act } from '@testing-library/react';
import { useVirtualizedGrid, useVirtualizedGridPerformance } from './useVirtualizedGrid';

// Mock useResponsive hook
jest.mock('./index', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    screenWidth: 1024
  })
}));

// Mock performance.now for consistent testing
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow
  }
});

describe('useVirtualizedGrid', () => {
  const defaultProps = {
    itemCount: 100,
    containerHeight: 500,
    minItemWidth: 280,
    itemHeight: 240,
    gap: 16,
    threshold: 50
  };

  beforeEach(() => {
    mockPerformanceNow.mockClear();
    mockPerformanceNow.mockReturnValue(0);
  });

  describe('Basic Configuration', () => {
    it('should return correct grid settings for desktop', () => {
      const { result } = renderHook(() => useVirtualizedGrid(defaultProps));

      expect(result.current).toEqual(
        expect.objectContaining({
          itemsPerRow: expect.any(Number),
          itemHeight: defaultProps.itemHeight,
          gap: defaultProps.gap,
          shouldVirtualize: true, // 100 items > 50 threshold
          containerHeight: defaultProps.containerHeight,
          overscan: expect.any(Number),
          estimatedTotalHeight: expect.any(Number)
        })
      );

      expect(result.current.itemsPerRow).toBeGreaterThan(0);
      expect(result.current.overscan).toBeGreaterThanOrEqual(2);
    });

    it('should enable virtualization when item count exceeds threshold', () => {
      const { result: above } = renderHook(() =>
        useVirtualizedGrid({ ...defaultProps, itemCount: 60, threshold: 50 })
      );

      const { result: below } = renderHook(() =>
        useVirtualizedGrid({ ...defaultProps, itemCount: 40, threshold: 50 })
      );

      expect(above.current.shouldVirtualize).toBe(true);
      expect(below.current.shouldVirtualize).toBe(false);
    });

    it('should calculate correct estimated total height', () => {
      const props = {
        ...defaultProps,
        itemCount: 10,
        itemHeight: 100,
        gap: 10
      };

      const { result } = renderHook(() => useVirtualizedGrid(props));

      // With itemsPerRow calculated based on screen width, estimate total height
      const expectedRows = Math.ceil(10 / result.current.itemsPerRow);
      const expectedHeight = expectedRows * (100 + 10) - 10; // Remove last gap

      expect(result.current.estimatedTotalHeight).toBe(expectedHeight);
    });
  });

  describe('Responsive Behavior', () => {
    it('should adjust settings for mobile devices', () => {
      // Mock mobile responsive hook
      jest.doMock('./index', () => ({
        useResponsive: () => ({
          isMobile: true,
          isTablet: false,
          screenWidth: 375
        })
      }));

      const { useVirtualizedGrid: MobileUseVirtualizedGrid } = require('./useVirtualizedGrid');
      const { result } = renderHook(() => MobileUseVirtualizedGrid(defaultProps));

      // Mobile should have adjusted settings
      expect(result.current.itemHeight).toBe(defaultProps.itemHeight * 0.9);
      expect(result.current.gap).toBe(Math.max(8, defaultProps.gap * 0.75));
      expect(result.current.overscan).toBe(2); // Reduced for mobile
    });

    it('should recalculate when screen width changes', () => {
      let screenWidth = 800;

      jest.doMock('./index', () => ({
        useResponsive: () => ({
          isMobile: false,
          isTablet: false,
          screenWidth
        })
      }));

      const { useVirtualizedGrid: ResponsiveUseVirtualizedGrid } = require('./useVirtualizedGrid');
      const { result, rerender } = renderHook(() => ResponsiveUseVirtualizedGrid(defaultProps));

      const initialItemsPerRow = result.current.itemsPerRow;

      // Change screen width
      screenWidth = 1200;
      rerender();

      // Should recalculate itemsPerRow for new width
      expect(result.current.itemsPerRow).toBeGreaterThanOrEqual(initialItemsPerRow);
    });
  });

  describe('Performance Optimizations', () => {
    it('should increase overscan for very large lists', () => {
      const { result: small } = renderHook(() =>
        useVirtualizedGrid({ ...defaultProps, itemCount: 100 })
      );

      const { result: large } = renderHook(() =>
        useVirtualizedGrid({ ...defaultProps, itemCount: 2000 })
      );

      expect(large.current.overscan).toBeGreaterThanOrEqual(small.current.overscan);
    });

    it('should handle edge cases gracefully', () => {
      // Zero items
      const { result: zero } = renderHook(() =>
        useVirtualizedGrid({ ...defaultProps, itemCount: 0 })
      );

      expect(zero.current.itemsPerRow).toBeGreaterThan(0);
      expect(zero.current.estimatedTotalHeight).toBe(0);

      // Very small container
      const { result: small } = renderHook(() =>
        useVirtualizedGrid({ ...defaultProps, containerHeight: 50 })
      );

      expect(small.current.containerHeight).toBe(50);
    });
  });

  describe('Grid Layout Calculations', () => {
    it('should calculate correct items per row based on width', () => {
      const props = {
        ...defaultProps,
        minItemWidth: 200
      };

      // Mock specific screen width
      jest.doMock('./index', () => ({
        useResponsive: () => ({
          isMobile: false,
          isTablet: false,
          screenWidth: 1000
        })
      }));

      const { useVirtualizedGrid: WidthAwareUseVirtualizedGrid } = require('./useVirtualizedGrid');
      const { result } = renderHook(() => WidthAwareUseVirtualizedGrid(props));

      // With 1000px width, 200px min item width + gap, should fit multiple items per row
      expect(result.current.itemsPerRow).toBeGreaterThan(1);
    });

    it('should ensure at least 1 item per row', () => {
      const props = {
        ...defaultProps,
        minItemWidth: 2000 // Very large min width
      };

      const { result } = renderHook(() => useVirtualizedGrid(props));

      expect(result.current.itemsPerRow).toBe(1);
    });
  });
});

describe('useVirtualizedGridPerformance', () => {
  beforeEach(() => {
    mockPerformanceNow.mockClear();
    jest.clearAllMocks();
  });

  describe('Performance Metrics Recording', () => {
    it('should record render metrics correctly', () => {
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(16);

      const { result } = renderHook(() => useVirtualizedGridPerformance());

      act(() => {
        result.current.recordRenderMetrics(0, 10, 100);
      });

      expect(result.current.metrics).toEqual({
        renderTime: 16,
        visibleItems: 10,
        totalItems: 100,
        memoryUsage: 1 // 10 items * 0.1 KB
      });
    });

    it('should warn about slow renders in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(50); // Slow render

      const { result } = renderHook(() => useVirtualizedGridPerformance());

      act(() => {
        result.current.recordRenderMetrics(0, 10, 100);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow render detected'),
        expect.objectContaining({
          renderTime: 50
        })
      );

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should not warn in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(50); // Slow render

      const { result } = renderHook(() => useVirtualizedGridPerformance());

      act(() => {
        result.current.recordRenderMetrics(0, 10, 100);
      });

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Performance Report Generation', () => {
    it('should generate correct performance report', () => {
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(10);

      const { result } = renderHook(() => useVirtualizedGridPerformance());

      act(() => {
        result.current.recordRenderMetrics(0, 25, 100);
      });

      const report = result.current.getPerformanceReport();

      expect(report).toEqual({
        renderTime: 10,
        visibleItems: 25,
        totalItems: 100,
        memoryUsage: 2.5,
        efficiency: '25.0%',
        fps: 100 // 1000/10
      });
    });

    it('should handle edge cases in report generation', () => {
      const { result } = renderHook(() => useVirtualizedGridPerformance());

      // No metrics recorded yet
      const emptyReport = result.current.getPerformanceReport();

      expect(emptyReport).toEqual({
        renderTime: 0,
        visibleItems: 0,
        totalItems: 0,
        memoryUsage: 0,
        efficiency: '0%',
        fps: 0
      });
    });

    it('should calculate efficiency correctly', () => {
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(5);

      const { result } = renderHook(() => useVirtualizedGridPerformance());

      act(() => {
        result.current.recordRenderMetrics(0, 50, 200);
      });

      const report = result.current.getPerformanceReport();

      expect(report.efficiency).toBe('25.0%'); // 50/200 * 100
    });
  });

  describe('Memory Usage Calculation', () => {
    it('should estimate memory usage correctly', () => {
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(8);

      const { result } = renderHook(() => useVirtualizedGridPerformance());

      act(() => {
        result.current.recordRenderMetrics(0, 20, 100);
      });

      expect(result.current.metrics.memoryUsage).toBe(2); // 20 * 0.1 KB
    });
  });

  describe('FPS Calculation', () => {
    it('should calculate FPS from render time', () => {
      mockPerformanceNow.mockReturnValueOnce(0).mockReturnValueOnce(16.67); // ~60 FPS

      const { result } = renderHook(() => useVirtualizedGridPerformance());

      act(() => {
        result.current.recordRenderMetrics(0, 10, 100);
      });

      const report = result.current.getPerformanceReport();

      expect(report.fps).toBe(60); // 1000/16.67 ≈ 60
    });

    it('should handle zero render time', () => {
      const { result } = renderHook(() => useVirtualizedGridPerformance());

      const report = result.current.getPerformanceReport();

      expect(report.fps).toBe(0);
    });
  });
});