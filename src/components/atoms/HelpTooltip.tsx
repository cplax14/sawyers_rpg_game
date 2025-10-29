/**
 * Help Tooltip Component
 * Provides contextual help information with hover/click functionality
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpTooltipProps {
  content: string;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click';
  maxWidth?: number;
  icon?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  title,
  position = 'top',
  trigger = 'hover',
  maxWidth = 250,
  icon = '❓',
  className,
  style,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const showTooltip = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hideTooltip = useCallback(() => {
    setIsVisible(false);
  }, []);

  const toggleTooltip = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  const getPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      zIndex: 1000,
      maxWidth: `${maxWidth}px`,
      pointerEvents: 'none',
    };

    switch (position) {
      case 'top':
        return {
          ...base,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
        };
      case 'bottom':
        return {
          ...base,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px',
        };
      case 'left':
        return {
          ...base,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: '8px',
        };
      case 'right':
        return {
          ...base,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '8px',
        };
      default:
        return base;
    }
  };

  const getArrowStyles = (): React.CSSProperties => {
    const arrowBase: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
      border: '6px solid transparent',
    };

    switch (position) {
      case 'top':
        return {
          ...arrowBase,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderTopColor: '#1f2937',
        };
      case 'bottom':
        return {
          ...arrowBase,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderBottomColor: '#1f2937',
        };
      case 'left':
        return {
          ...arrowBase,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderLeftColor: '#1f2937',
        };
      case 'right':
        return {
          ...arrowBase,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderRightColor: '#1f2937',
        };
      default:
        return arrowBase;
    }
  };

  const triggerProps =
    trigger === 'hover'
      ? {
          onMouseEnter: showTooltip,
          onMouseLeave: hideTooltip,
        }
      : {
          onClick: toggleTooltip,
        };

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style,
      }}
      className={className}
      {...triggerProps}
    >
      {/* Trigger Icon */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#6b7280',
          color: 'white',
          fontSize: '10px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {icon}
      </span>

      {/* Tooltip */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={getPositionStyles()}
          >
            <div
              style={{
                backgroundColor: '#1f2937',
                color: '#f3f4f6',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                lineHeight: '1.4',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                border: '1px solid #374151',
              }}
            >
              {title && (
                <div
                  style={{
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    color: '#f9fafb',
                  }}
                >
                  {title}
                </div>
              )}
              <div>{content}</div>
            </div>
            <div style={getArrowStyles()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HelpTooltip;
