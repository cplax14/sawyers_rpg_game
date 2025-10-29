import React from 'react';
import { motion } from 'framer-motion';

export type ItemRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'artifact'
  | 'unique';

export interface RarityConfig {
  name: string;
  color: string;
  gradientStart: string;
  gradientEnd: string;
  borderColor: string;
  glowColor: string;
  textColor: string;
  icon: string;
  dropRate: number;
}

export const RARITY_CONFIGS: Record<ItemRarity, RarityConfig> = {
  common: {
    name: 'Common',
    color: '#22c55e',
    gradientStart: '#22c55e',
    gradientEnd: '#16a34a',
    borderColor: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.4)',
    textColor: '#f0fdf4',
    icon: '●',
    dropRate: 0.6,
  },
  uncommon: {
    name: 'Uncommon',
    color: '#10b981',
    gradientStart: '#10b981',
    gradientEnd: '#059669',
    borderColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    textColor: '#ecfdf5',
    icon: '◆',
    dropRate: 0.3,
  },
  rare: {
    name: 'Rare',
    color: '#3b82f6',
    gradientStart: '#3b82f6',
    gradientEnd: '#2563eb',
    borderColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    textColor: '#eff6ff',
    icon: '◆',
    dropRate: 0.25,
  },
  epic: {
    name: 'Epic',
    color: '#a855f7',
    gradientStart: '#a855f7',
    gradientEnd: '#9333ea',
    borderColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    textColor: '#faf5ff',
    icon: '★',
    dropRate: 0.12,
  },
  legendary: {
    name: 'Legendary',
    color: '#f97316',
    gradientStart: '#f97316',
    gradientEnd: '#ea580c',
    borderColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    textColor: '#fff7ed',
    icon: '✦',
    dropRate: 0.025,
  },
  artifact: {
    name: 'Artifact',
    color: '#dc2626',
    gradientStart: '#dc2626',
    gradientEnd: '#b91c1c',
    borderColor: '#dc2626',
    glowColor: 'rgba(220, 38, 38, 0.4)',
    textColor: '#fef2f2',
    icon: '⬟',
    dropRate: 0.003,
  },
  unique: {
    name: 'Unique',
    color: '#fbbf24',
    gradientStart: '#fbbf24',
    gradientEnd: '#f59e0b',
    borderColor: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    textColor: '#fffbeb',
    icon: '◈',
    dropRate: 0.001,
  },
};

interface RarityIndicatorProps {
  rarity: ItemRarity;
  variant?: 'dot' | 'badge' | 'border' | 'background' | 'text' | 'glow';
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  showText?: boolean;
  animated?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const RarityIndicator: React.FC<RarityIndicatorProps> = ({
  rarity,
  variant = 'badge',
  size = 'medium',
  showIcon = true,
  showText = false,
  animated = false,
  className = '',
  style = {},
  onClick,
}) => {
  const config = RARITY_CONFIGS[rarity];
  if (!config) {
    console.warn(
      `⚠️ Unknown rarity "${rarity}", falling back to "common". Valid rarities:`,
      Object.keys(RARITY_CONFIGS)
    );
    return (
      <RarityIndicator
        {...{
          rarity: 'common',
          variant,
          size,
          showIcon,
          showText,
          animated,
          className,
          style,
          onClick,
        }}
      />
    );
  }

  // Size configurations
  const sizeConfig: Record<
    'small' | 'medium' | 'large',
    {
      fontSize: string;
      padding: string;
      iconSize: string;
      borderWidth: string;
      borderRadius: string;
    }
  > = {
    small: {
      fontSize: '0.75rem',
      padding: '0.25rem 0.5rem',
      iconSize: '0.8rem',
      borderWidth: '1px',
      borderRadius: '4px',
    },
    medium: {
      fontSize: '0.875rem',
      padding: '0.375rem 0.75rem',
      iconSize: '1rem',
      borderWidth: '2px',
      borderRadius: '6px',
    },
    large: {
      fontSize: '1rem',
      padding: '0.5rem 1rem',
      iconSize: '1.2rem',
      borderWidth: '2px',
      borderRadius: '8px',
    },
  };

  // Ensure valid size, fallback to 'medium' if invalid
  const validSize = size === 'small' || size === 'medium' || size === 'large' ? size : 'medium';
  const currentSize = sizeConfig[validSize];

  // Variant-specific styles
  const getVariantStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      fontSize: currentSize.fontSize,
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      cursor: onClick ? 'pointer' : 'default',
      userSelect: 'none',
    };

    switch (variant) {
      case 'dot':
        return {
          ...baseStyles,
          color: config.color,
          fontSize: currentSize.iconSize,
        };

      case 'badge':
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, ${config.gradientStart}, ${config.gradientEnd})`,
          color: config.textColor,
          padding: currentSize.padding,
          borderRadius: currentSize.borderRadius,
          border: `${currentSize.borderWidth} solid ${config.borderColor}`,
          boxShadow: animated ? `0 0 8px ${config.glowColor}` : 'none',
        };

      case 'border':
        return {
          ...baseStyles,
          border: `${currentSize.borderWidth} solid ${config.color}`,
          borderRadius: currentSize.borderRadius,
          padding: currentSize.padding,
          color: config.color,
          background: 'transparent',
        };

      case 'background':
        return {
          ...baseStyles,
          background: config.color,
          color: config.textColor,
          padding: currentSize.padding,
          borderRadius: currentSize.borderRadius,
        };

      case 'text':
        return {
          ...baseStyles,
          color: config.color,
        };

      case 'glow':
        return {
          ...baseStyles,
          color: config.color,
          textShadow: `0 0 8px ${config.glowColor}`,
          filter: 'brightness(1.2)',
        };

      default:
        return baseStyles;
    }
  };

  // Animation variants
  const animationVariants = {
    idle: {
      scale: 1,
      opacity: 1,
    },
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    glow: {
      boxShadow: [
        `0 0 5px ${config.glowColor}`,
        `0 0 15px ${config.glowColor}`,
        `0 0 5px ${config.glowColor}`,
      ],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const componentStyle = {
    ...getVariantStyles(),
    ...style,
  };

  const Component = animated ? motion.span : 'span';
  const animationProps = animated
    ? {
        variants: animationVariants,
        animate:
          rarity === 'legendary' || rarity === 'artifact' || rarity === 'unique' ? 'pulse' : 'idle',
        whileHover: onClick ? { scale: 1.05 } : {},
        whileTap: onClick ? { scale: 0.95 } : {},
      }
    : {};

  if (animated) {
    return (
      <Component
        className={`rarity-indicator rarity-${rarity} ${className}`}
        style={componentStyle}
        onClick={onClick}
        title={`${config.name} (${(config.dropRate * 100).toFixed(1)}% drop rate)`}
        {...animationProps}
      >
        {showIcon && (
          <span className='rarity-icon' style={{ fontSize: currentSize.iconSize }}>
            {config.icon}
          </span>
        )}

        {showText && <span className='rarity-text'>{config.name}</span>}

        {!showIcon && !showText && variant === 'dot' && (
          <span style={{ fontSize: currentSize.iconSize }}>{config.icon}</span>
        )}
      </Component>
    );
  }

  return (
    <span
      className={`rarity-indicator rarity-${rarity} ${className}`}
      style={componentStyle}
      onClick={onClick}
      title={`${config.name} (${(config.dropRate * 100).toFixed(1)}% drop rate)`}
    >
      {showIcon && (
        <span className='rarity-icon' style={{ fontSize: currentSize.iconSize }}>
          {config.icon}
        </span>
      )}

      {showText && <span className='rarity-text'>{config.name}</span>}

      {!showIcon && !showText && variant === 'dot' && (
        <span style={{ fontSize: currentSize.iconSize }}>{config.icon}</span>
      )}
    </span>
  );
};

// Utility functions for rarity system
export const getRarityConfig = (rarity: ItemRarity): RarityConfig => {
  return RARITY_CONFIGS[rarity];
};

export const getRarityColor = (rarity: ItemRarity): string => {
  return RARITY_CONFIGS[rarity].color;
};

export const getRarityGradient = (rarity: ItemRarity): string => {
  const config = RARITY_CONFIGS[rarity];
  return `linear-gradient(135deg, ${config.gradientStart}, ${config.gradientEnd})`;
};

export const isHighRarity = (rarity: ItemRarity): boolean => {
  return ['epic', 'legendary', 'artifact', 'unique'].includes(rarity);
};

export const sortByRarity = (items: { rarity: ItemRarity }[]): { rarity: ItemRarity }[] => {
  const rarityOrder: ItemRarity[] = [
    'unique',
    'artifact',
    'legendary',
    'epic',
    'rare',
    'uncommon',
    'common',
  ];
  return items.sort((a, b) => {
    return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
  });
};

export const getDropRateText = (rarity: ItemRarity): string => {
  const rate = RARITY_CONFIGS[rarity].dropRate;
  if (rate >= 0.01) {
    return `${(rate * 100).toFixed(1)}%`;
  } else {
    return `${(rate * 100).toFixed(3)}%`;
  }
};

// Pre-built rarity indicator components for common use cases
export const RarityDot: React.FC<
  Pick<RarityIndicatorProps, 'rarity' | 'size' | 'animated'>
> = props => <RarityIndicator {...props} variant='dot' showIcon={false} />;

export const RarityBadge: React.FC<
  Pick<RarityIndicatorProps, 'rarity' | 'size' | 'animated' | 'showText'>
> = props => <RarityIndicator {...props} variant='badge' showIcon={true} />;

export const RarityText: React.FC<Pick<RarityIndicatorProps, 'rarity' | 'size'>> = props => (
  <RarityIndicator {...props} variant='text' showIcon={false} showText={true} />
);

export const RarityBorder: React.FC<
  Pick<RarityIndicatorProps, 'rarity' | 'size'> & { children: React.ReactNode }
> = ({ children, ...props }) => (
  <div
    style={{
      border: `2px solid ${getRarityColor(props.rarity)}`,
      borderRadius: '8px',
      position: 'relative',
    }}
  >
    {children}
    <RarityIndicator
      {...props}
      variant='dot'
      size='small'
      style={{
        position: 'absolute',
        top: '4px',
        right: '4px',
      }}
    />
  </div>
);

export default RarityIndicator;
