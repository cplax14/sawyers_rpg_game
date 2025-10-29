import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tooltipStyles } from '../../utils/temporaryStyles';
// import styles from './Tooltip.module.css'; // Temporarily disabled due to PostCSS parsing issues

// Use temporary fallback styles to prevent JavaScript errors
const styles = tooltipStyles;

export interface TooltipProps {
  /** Tooltip content */
  content: React.ReactNode;
  /** Element that triggers the tooltip */
  children: React.ReactNode;
  /** Tooltip placement */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  /** Tooltip variant/theme */
  variant?: 'dark' | 'light' | 'error' | 'warning' | 'info';
  /** Trigger event */
  trigger?: 'hover' | 'click' | 'focus' | 'manual';
  /** Delay before showing tooltip (ms) */
  delay?: number;
  /** Whether tooltip is disabled */
  disabled?: boolean;
  /** Custom className for tooltip */
  className?: string;
  /** Custom className for arrow */
  arrowClassName?: string;
  /** Whether to show arrow */
  showArrow?: boolean;
  /** Manual control of tooltip visibility */
  visible?: boolean;
  /** Called when tooltip visibility changes */
  onVisibleChange?: (visible: boolean) => void;
  /** Maximum width of tooltip */
  maxWidth?: string;
  /** Z-index for tooltip */
  zIndex?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'auto',
  variant = 'dark',
  trigger = 'hover',
  delay = 300,
  disabled = false,
  className = '',
  arrowClassName = '',
  showArrow = true,
  visible,
  onVisibleChange,
  maxWidth = '300px',
  zIndex = 1500,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPlacement, setActualPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>(
    'top'
  );
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyControlled = visible !== undefined;

  // Calculate optimal placement
  const calculatePlacement = (triggerRect: DOMRect): 'top' | 'bottom' | 'left' | 'right' => {
    if (placement !== 'auto') return placement;

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const tooltipHeight = 100; // Estimated tooltip height
    const tooltipWidth = 200; // Estimated tooltip width

    // Check if tooltip fits above
    if (triggerRect.top > tooltipHeight + 10) return 'top';
    // Check if tooltip fits below
    if (triggerRect.bottom + tooltipHeight + 10 < viewportHeight) return 'bottom';
    // Check if tooltip fits to the right
    if (triggerRect.right + tooltipWidth + 10 < viewportWidth) return 'right';
    // Check if tooltip fits to the left
    if (triggerRect.left > tooltipWidth + 10) return 'left';

    // Default fallback
    return 'top';
  };

  // Calculate tooltip position
  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const optimalPlacement = calculatePlacement(triggerRect);
    setActualPlacement(optimalPlacement);

    let x = 0;
    let y = 0;

    switch (optimalPlacement) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2;
        y = triggerRect.top;
        break;
      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2;
        y = triggerRect.bottom;
        break;
      case 'left':
        x = triggerRect.left;
        y = triggerRect.top + triggerRect.height / 2;
        break;
      case 'right':
        x = triggerRect.right;
        y = triggerRect.top + triggerRect.height / 2;
        break;
    }

    setPosition({ x, y });
  };

  // Show tooltip
  const showTooltip = () => {
    if (disabled || isManuallyControlled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
      onVisibleChange?.(true);
    }, delay);
  };

  // Hide tooltip
  const hideTooltip = () => {
    if (disabled || isManuallyControlled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsVisible(false);
    onVisibleChange?.(false);
  };

  // Toggle tooltip (for click trigger)
  const toggleTooltip = () => {
    if (disabled || isManuallyControlled) return;

    if (isVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  // Handle trigger events
  const getTriggerProps = () => {
    const props: any = {};

    if (trigger === 'hover') {
      props.onMouseEnter = showTooltip;
      props.onMouseLeave = hideTooltip;
    } else if (trigger === 'click') {
      props.onClick = toggleTooltip;
    } else if (trigger === 'focus') {
      props.onFocus = showTooltip;
      props.onBlur = hideTooltip;
    }

    return props;
  };

  // Handle manual control
  useEffect(() => {
    if (isManuallyControlled && visible !== isVisible) {
      if (visible) {
        calculatePosition();
      }
      setIsVisible(!!visible);
    }
  }, [visible, isManuallyControlled, isVisible]);

  // Handle scroll/resize to reposition
  useEffect(() => {
    if (!isVisible && !visible) return;

    const handlePositionUpdate = () => {
      calculatePosition();
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        trigger === 'click' &&
        tooltipRef.current &&
        triggerRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        hideTooltip();
      }
    };

    window.addEventListener('scroll', handlePositionUpdate, true);
    window.addEventListener('resize', handlePositionUpdate);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handlePositionUpdate, true);
      window.removeEventListener('resize', handlePositionUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, visible, trigger]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipClasses = [styles.tooltip, styles[variant], styles[actualPlacement], className]
    .filter(Boolean)
    .join(' ');

  const arrowClasses = [
    styles.arrow,
    styles[`arrow${actualPlacement.charAt(0).toUpperCase() + actualPlacement.slice(1)}`],
    arrowClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const shouldShow = isManuallyControlled ? visible : isVisible;

  return (
    <>
      <div ref={triggerRef} className={styles.trigger} {...getTriggerProps()}>
        {children}
      </div>

      <AnimatePresence>
        {shouldShow && content && (
          <motion.div
            ref={tooltipRef}
            className={tooltipClasses}
            style={{
              position: 'fixed',
              left: position.x,
              top: position.y,
              maxWidth,
              zIndex,
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            role='tooltip'
            aria-hidden={!shouldShow}
          >
            {showArrow && <div className={arrowClasses} />}
            <div className={styles.content}>{content}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

Tooltip.displayName = 'Tooltip';

export { Tooltip };
