import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonCardProps {
  type?: 'item' | 'creature' | 'equipment';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * SkeletonCard - Loading placeholder component for cards
 *
 * Features:
 * - Animated shimmer effect
 * - Type-specific layouts (item, creature, equipment)
 * - Responsive sizing
 * - Smooth loading transitions
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  type = 'item',
  size = 'md',
  className,
  style
}) => {
  // Size configurations
  const sizeConfig = {
    sm: { height: 180, padding: 12, imageSize: 40 },
    md: { height: 220, padding: 16, imageSize: 48 },
    lg: { height: 260, padding: 20, imageSize: 56 }
  };

  const config = sizeConfig[size];

  const skeletonStyles = {
    card: {
      width: '100%',
      height: `${config.height}px`,
      padding: `${config.padding}px`,
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      position: 'relative' as const,
      overflow: 'hidden',
      ...style
    },
    shimmer: {
      position: 'absolute' as const,
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
      animation: 'shimmer 2s infinite'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    image: {
      width: `${config.imageSize}px`,
      height: `${config.imageSize}px`,
      borderRadius: '8px',
      background: 'rgba(255, 255, 255, 0.08)'
    },
    textContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '6px'
    },
    title: {
      height: '16px',
      background: 'rgba(255, 255, 255, 0.08)',
      borderRadius: '4px',
      width: '70%'
    },
    subtitle: {
      height: '12px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '4px',
      width: '50%'
    },
    content: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      flex: 1
    },
    description: {
      height: '10px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '3px',
      width: '90%'
    },
    stats: {
      display: 'flex',
      gap: '8px',
      marginTop: 'auto'
    },
    stat: {
      height: '24px',
      background: 'rgba(255, 255, 255, 0.06)',
      borderRadius: '6px',
      width: '60px'
    },
    actions: {
      display: 'flex',
      gap: '6px',
      marginTop: '8px'
    },
    action: {
      height: '28px',
      background: 'rgba(255, 255, 255, 0.06)',
      borderRadius: '6px',
      flex: 1
    }
  };

  const renderItemSkeleton = () => (
    <>
      <div style={skeletonStyles.header}>
        <div style={skeletonStyles.image} />
        <div style={skeletonStyles.textContent}>
          <div style={skeletonStyles.title} />
          <div style={skeletonStyles.subtitle} />
        </div>
      </div>
      <div style={skeletonStyles.content}>
        <div style={skeletonStyles.description} />
        <div style={{ ...skeletonStyles.description, width: '60%' }} />
      </div>
      <div style={skeletonStyles.stats}>
        <div style={skeletonStyles.stat} />
        <div style={skeletonStyles.stat} />
        <div style={skeletonStyles.stat} />
      </div>
      <div style={skeletonStyles.actions}>
        <div style={skeletonStyles.action} />
        <div style={skeletonStyles.action} />
      </div>
    </>
  );

  const renderCreatureSkeleton = () => (
    <>
      <div style={skeletonStyles.header}>
        <div style={{ ...skeletonStyles.image, borderRadius: '50%' }} />
        <div style={skeletonStyles.textContent}>
          <div style={skeletonStyles.title} />
          <div style={skeletonStyles.subtitle} />
        </div>
      </div>
      <div style={skeletonStyles.content}>
        <div style={skeletonStyles.description} />
        <div style={{ ...skeletonStyles.description, width: '80%' }} />
      </div>
      <div style={skeletonStyles.stats}>
        <div style={skeletonStyles.stat} />
        <div style={skeletonStyles.stat} />
        <div style={skeletonStyles.stat} />
        <div style={skeletonStyles.stat} />
      </div>
      <div style={skeletonStyles.actions}>
        <div style={skeletonStyles.action} />
        <div style={skeletonStyles.action} />
        <div style={skeletonStyles.action} />
      </div>
    </>
  );

  const renderEquipmentSkeleton = () => (
    <>
      <div style={skeletonStyles.header}>
        <div style={skeletonStyles.image} />
        <div style={skeletonStyles.textContent}>
          <div style={skeletonStyles.title} />
          <div style={skeletonStyles.subtitle} />
        </div>
      </div>
      <div style={skeletonStyles.content}>
        <div style={skeletonStyles.description} />
        <div style={{ ...skeletonStyles.description, width: '70%' }} />
        <div style={{ ...skeletonStyles.description, width: '85%' }} />
      </div>
      <div style={skeletonStyles.stats}>
        <div style={skeletonStyles.stat} />
        <div style={skeletonStyles.stat} />
      </div>
      <div style={skeletonStyles.actions}>
        <div style={skeletonStyles.action} />
      </div>
    </>
  );

  const getSkeletonContent = () => {
    switch (type) {
      case 'creature':
        return renderCreatureSkeleton();
      case 'equipment':
        return renderEquipmentSkeleton();
      case 'item':
      default:
        return renderItemSkeleton();
    }
  };

  return (
    <motion.div
      className={className}
      style={skeletonStyles.card}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      {/* Shimmer effect */}
      <motion.div
        style={skeletonStyles.shimmer}
        animate={{ left: ['−100%', '100%'] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear'
        }}
      />

      {getSkeletonContent()}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default SkeletonCard;