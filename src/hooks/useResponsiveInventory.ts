import { useState, useEffect, useMemo } from 'react';

export interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
  largeDesktop: number;
}

export interface ResponsiveState {
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  devicePixelRatio: number;
  isTouch: boolean;
  isSmallHeight: boolean;
}

export interface InventoryLayoutConfig {
  // Grid settings
  gridColumns: number | 'auto';
  gridGap: string;
  itemSize: 'small' | 'medium' | 'large';

  // Modal/dialog settings
  modalPadding: string;
  modalMaxWidth: string;
  modalHeight: string;

  // Navigation settings
  showTabLabels: boolean;
  showTabShortcuts: boolean;
  compactTabs: boolean;

  // UI density
  padding: string;
  fontSize: string;
  iconSize: string;

  // Features
  enableDragDrop: boolean;
  showAdvancedControls: boolean;
  enableStaggeredAnimations: boolean;
}

const defaultBreakpoints: BreakpointConfig = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  largeDesktop: 1920
};

export const useResponsiveInventory = (customBreakpoints?: Partial<BreakpointConfig>) => {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };

  const [responsiveState, setResponsiveState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        screenWidth: 1024,
        screenHeight: 768,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        isLargeDesktop: false,
        isPortrait: false,
        isLandscape: true,
        devicePixelRatio: 1,
        isTouch: false,
        isSmallHeight: false
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      screenWidth: width,
      screenHeight: height,
      isMobile: width < breakpoints.mobile,
      isTablet: width >= breakpoints.mobile && width < breakpoints.desktop,
      isDesktop: width >= breakpoints.desktop && width < breakpoints.largeDesktop,
      isLargeDesktop: width >= breakpoints.largeDesktop,
      isPortrait: height > width,
      isLandscape: width > height,
      devicePixelRatio: window.devicePixelRatio || 1,
      isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isSmallHeight: height < 600
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateResponsiveState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setResponsiveState({
        screenWidth: width,
        screenHeight: height,
        isMobile: width < breakpoints.mobile,
        isTablet: width >= breakpoints.mobile && width < breakpoints.desktop,
        isDesktop: width >= breakpoints.desktop && width < breakpoints.largeDesktop,
        isLargeDesktop: width >= breakpoints.largeDesktop,
        isPortrait: height > width,
        isLandscape: width > height,
        devicePixelRatio: window.devicePixelRatio || 1,
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        isSmallHeight: height < 600
      });
    };

    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateResponsiveState, 100);
    };

    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', debouncedUpdate);

    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', debouncedUpdate);
      clearTimeout(timeoutId);
    };
  }, [breakpoints]);

  // Generate layout configuration based on screen size
  const layoutConfig = useMemo((): InventoryLayoutConfig => {
    const { isMobile, isTablet, isSmallHeight, isTouch } = responsiveState;

    if (isMobile) {
      return {
        gridColumns: isSmallHeight ? 4 : 3,
        gridGap: '0.5rem',
        itemSize: 'small',
        modalPadding: '1rem',
        modalMaxWidth: '100%',
        modalHeight: '100%',
        showTabLabels: false,
        showTabShortcuts: false,
        compactTabs: true,
        padding: '0.75rem',
        fontSize: '0.85rem',
        iconSize: '1.2rem',
        enableDragDrop: isTouch,
        showAdvancedControls: false,
        enableStaggeredAnimations: false // Disable for performance
      };
    }

    if (isTablet) {
      return {
        gridColumns: isSmallHeight ? 6 : 4,
        gridGap: '0.75rem',
        itemSize: 'medium',
        modalPadding: '1.5rem',
        modalMaxWidth: '90vw',
        modalHeight: '90vh',
        showTabLabels: true,
        showTabShortcuts: false,
        compactTabs: false,
        padding: '1rem',
        fontSize: '0.9rem',
        iconSize: '1.1rem',
        enableDragDrop: isTouch,
        showAdvancedControls: true,
        enableStaggeredAnimations: true
      };
    }

    // Desktop and larger
    return {
      gridColumns: 'auto',
      gridGap: '1rem',
      itemSize: 'large',
      modalPadding: '2rem',
      modalMaxWidth: '1200px',
      modalHeight: '80vh',
      showTabLabels: true,
      showTabShortcuts: true,
      compactTabs: false,
      padding: '1.5rem',
      fontSize: '1rem',
      iconSize: '1rem',
      enableDragDrop: true,
      showAdvancedControls: true,
      enableStaggeredAnimations: true
    };
  }, [responsiveState]);

  // Responsive CSS utilities
  const getResponsiveValue = <T>(values: {
    mobile: T;
    tablet?: T;
    desktop?: T;
    largeDesktop?: T;
  }): T => {
    const { isMobile, isTablet, isDesktop, isLargeDesktop } = responsiveState;

    if (isMobile) return values.mobile;
    if (isTablet) return values.tablet ?? values.mobile;
    if (isDesktop) return values.desktop ?? values.tablet ?? values.mobile;
    if (isLargeDesktop) return values.largeDesktop ?? values.desktop ?? values.tablet ?? values.mobile;

    return values.mobile;
  };

  const getResponsiveGridColumns = (baseColumns: {
    mobile: number | string;
    tablet?: number | string;
    desktop?: number | string;
    largeDesktop?: number | string;
  }): string => {
    const columns = getResponsiveValue(baseColumns);

    if (typeof columns === 'number') {
      return `repeat(${columns}, 1fr)`;
    }

    return columns;
  };

  const getResponsiveFontSize = (base: number): string => {
    const { isMobile, isTablet } = responsiveState;

    if (isMobile) return `${base * 0.85}rem`;
    if (isTablet) return `${base * 0.9}rem`;
    return `${base}rem`;
  };

  const getResponsiveSpacing = (base: number): string => {
    const { isMobile, isTablet } = responsiveState;

    if (isMobile) return `${base * 0.75}rem`;
    if (isTablet) return `${base * 0.875}rem`;
    return `${base}rem`;
  };

  // Inventory-specific responsive helpers
  const getInventoryModalSize = () => {
    const { isMobile, isTablet, screenWidth, screenHeight } = responsiveState;

    if (isMobile) {
      return {
        width: '100%',
        height: '100%',
        maxWidth: 'none',
        maxHeight: 'none',
        borderRadius: '0',
        margin: '0'
      };
    }

    if (isTablet) {
      return {
        width: '90vw',
        height: '90vh',
        maxWidth: '800px',
        maxHeight: '600px',
        borderRadius: '12px',
        margin: '2rem'
      };
    }

    return {
      width: 'auto',
      height: 'auto',
      maxWidth: '1200px',
      maxHeight: '80vh',
      borderRadius: '16px',
      margin: '2rem'
    };
  };

  const getTabStyle = () => {
    const { isMobile, isSmallHeight } = responsiveState;

    return {
      showLabels: !isMobile,
      showShortcuts: !isMobile && !isSmallHeight,
      padding: isMobile ? '0.75rem 0.5rem' : '1rem 1.5rem',
      fontSize: isMobile ? '0.85rem' : '0.95rem',
      iconSize: isMobile ? '1.2rem' : '1.1rem',
      gap: isMobile ? '0.25rem' : '0.5rem'
    };
  };

  const getGridItemSize = () => {
    const { isMobile, isTablet, isSmallHeight } = responsiveState;

    if (isMobile) {
      return {
        minWidth: isSmallHeight ? '70px' : '80px',
        minHeight: isSmallHeight ? '70px' : '80px',
        padding: '0.5rem',
        fontSize: '0.75rem'
      };
    }

    if (isTablet) {
      return {
        minWidth: '100px',
        minHeight: '100px',
        padding: '0.75rem',
        fontSize: '0.85rem'
      };
    }

    return {
      minWidth: '120px',
      minHeight: '120px',
      padding: '1rem',
      fontSize: '0.9rem'
    };
  };

  return {
    ...responsiveState,
    layoutConfig,
    breakpoints,
    getResponsiveValue,
    getResponsiveGridColumns,
    getResponsiveFontSize,
    getResponsiveSpacing,
    getInventoryModalSize,
    getTabStyle,
    getGridItemSize
  };
};

export default useResponsiveInventory;