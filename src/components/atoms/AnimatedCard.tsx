import React, { useState } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { useInventoryAnimations } from '../../hooks/useInventoryAnimations';
import { useResponsiveInventory } from '../../hooks/useResponsiveInventory';

interface AnimatedCardProps extends Omit<MotionProps, 'variants'> {
  children: React.ReactNode;
  variant?: 'item' | 'equipment' | 'creature' | 'stat' | 'action';
  isSelected?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  onSelect?: () => void;
  onDeselect?: () => void;
  onDoubleClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  animationTrigger?: 'none' | 'hover' | 'tap' | 'select' | 'action';
  feedbackOnClick?: boolean;
  useResponsiveSize?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  variant = 'item',
  isSelected = false,
  isDisabled = false,
  isLoading = false,
  onClick,
  onSelect,
  onDeselect,
  onDoubleClick,
  className = '',
  style = {},
  animationTrigger = 'hover',
  feedbackOnClick = true,
  useResponsiveSize = false,
  ...motionProps
}) => {
  const { animations } = useInventoryAnimations();
  const { getGridItemSize, layoutConfig } = useResponsiveInventory();
  const [isPressed, setIsPressed] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleClick = () => {
    if (isDisabled || isLoading) return;

    const now = Date.now();
    const isDoubleClick = now - lastClickTime < 300;

    if (isDoubleClick && onDoubleClick) {
      onDoubleClick();
    } else {
      onClick?.();

      if (isSelected && onDeselect) {
        onDeselect();
      } else if (!isSelected && onSelect) {
        onSelect();
      }
    }

    setLastClickTime(now);
  };

  const getVariantStyles = () => {
    const responsiveItemSize = useResponsiveSize ? getGridItemSize() : null;

    const baseStyles = {
      position: 'relative' as const,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      userSelect: 'none' as const,
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      background: 'rgba(255, 255, 255, 0.05)',
      padding: useResponsiveSize && responsiveItemSize ? responsiveItemSize.padding : '1rem',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '0.5rem',
      overflow: 'hidden',
      fontSize: useResponsiveSize && responsiveItemSize ? responsiveItemSize.fontSize : '1rem',
    };

    if (useResponsiveSize && responsiveItemSize) {
      // Use responsive sizing for all variants when enabled
      return {
        ...baseStyles,
        minHeight: responsiveItemSize.minHeight,
        minWidth: responsiveItemSize.minWidth,
        flexDirection:
          variant === 'stat' || variant === 'action' ? ('row' as const) : ('column' as const),
        justifyContent: variant === 'action' ? 'center' : 'flex-start',
      };
    }

    const variantStyles = {
      item: {
        minHeight: '120px',
        minWidth: '100px',
      },
      equipment: {
        minHeight: '140px',
        minWidth: '120px',
      },
      creature: {
        minHeight: '160px',
        minWidth: '140px',
      },
      stat: {
        minHeight: '80px',
        minWidth: '200px',
        flexDirection: 'row' as const,
      },
      action: {
        minHeight: '60px',
        minWidth: '120px',
        flexDirection: 'row' as const,
        justifyContent: 'center',
      },
    };

    return { ...baseStyles, ...variantStyles[variant] };
  };

  const getAnimationStates = () => {
    if (isLoading) return 'shimmer';
    if (isDisabled) return 'disabled';
    if (isSelected) return 'selected';
    if (isPressed && animationTrigger === 'tap') return 'tap';
    return 'rest';
  };

  const combinedVariants = {
    rest: {
      scale: 1,
      y: 0,
      opacity: isDisabled ? 0.5 : 1,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      transition: { duration: 0.2, ease: 'easeOut' },
    },
    hover:
      animationTrigger === 'hover' && !isDisabled
        ? {
            scale: 1.03,
            y: -2,
            boxShadow: '0 8px 25px rgba(79, 195, 247, 0.3)',
            borderColor: 'rgba(79, 195, 247, 0.4)',
            transition: { duration: 0.2, ease: 'easeOut' },
          }
        : {},
    tap:
      animationTrigger === 'tap' && !isDisabled
        ? {
            scale: 0.97,
            transition: { duration: 0.1 },
          }
        : {},
    selected: isSelected
      ? {
          borderColor: 'rgba(79, 195, 247, 0.6)',
          backgroundColor: 'rgba(79, 195, 247, 0.1)',
          boxShadow: '0 0 20px rgba(79, 195, 247, 0.3)',
          transition: { duration: 0.3 },
        }
      : {},
    disabled: isDisabled
      ? {
          opacity: 0.5,
          filter: 'grayscale(50%)',
          transition: { duration: 0.2 },
        }
      : {},
    shimmer: isLoading
      ? {
          opacity: [0.3, 0.7, 0.3],
          transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }
      : {},
  };

  return (
    <motion.div
      className={`animated-card animated-card-${variant} ${className}`}
      style={{
        ...getVariantStyles(),
        ...style,
      }}
      variants={combinedVariants}
      initial='rest'
      animate={getAnimationStates()}
      whileHover={!isDisabled && animationTrigger === 'hover' ? 'hover' : undefined}
      whileTap={!isDisabled && animationTrigger === 'tap' ? 'tap' : undefined}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={handleClick}
      {...motionProps}
    >
      {children}

      {/* Loading overlay */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: '24px',
              height: '24px',
              border: '2px solid rgba(79, 195, 247, 0.3)',
              borderTop: '2px solid #4fc3f7',
              borderRadius: '50%',
            }}
          />
        </motion.div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '20px',
            height: '20px',
            background: '#4fc3f7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            color: '#ffffff',
            fontWeight: 'bold',
          }}
        >
          ✓
        </motion.div>
      )}

      {/* Disabled overlay */}
      {isDisabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            fontSize: '2rem',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          🚫
        </motion.div>
      )}
    </motion.div>
  );
};

// Specialized card variants
export const ItemCard: React.FC<Omit<AnimatedCardProps, 'variant'>> = ({
  useResponsiveSize = true,
  ...props
}) => <AnimatedCard {...props} variant='item' useResponsiveSize={useResponsiveSize} />;

export const EquipmentCard: React.FC<Omit<AnimatedCardProps, 'variant'>> = ({
  useResponsiveSize = true,
  ...props
}) => <AnimatedCard {...props} variant='equipment' useResponsiveSize={useResponsiveSize} />;

export const CreatureCard: React.FC<Omit<AnimatedCardProps, 'variant'>> = ({
  useResponsiveSize = true,
  ...props
}) => <AnimatedCard {...props} variant='creature' useResponsiveSize={useResponsiveSize} />;

export const StatCard: React.FC<Omit<AnimatedCardProps, 'variant'>> = ({
  useResponsiveSize = false,
  ...props
}) => <AnimatedCard {...props} variant='stat' useResponsiveSize={useResponsiveSize} />;

export const ActionCard: React.FC<Omit<AnimatedCardProps, 'variant'>> = ({
  useResponsiveSize = false,
  ...props
}) => <AnimatedCard {...props} variant='action' useResponsiveSize={useResponsiveSize} />;

export default AnimatedCard;
