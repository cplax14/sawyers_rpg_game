import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CombatRestrictions } from '../../hooks/useCombatInventoryRestrictions';

interface CombatRestrictionBannerProps {
  restrictions: CombatRestrictions;
  currentTab: string;
  onDismiss?: () => void;
  compact?: boolean;
  className?: string;
}

export const CombatRestrictionBanner: React.FC<CombatRestrictionBannerProps> = ({
  restrictions,
  currentTab,
  onDismiss,
  compact = false,
  className = ''
}) => {
  if (!restrictions.isInCombat) {
    return null;
  }

  const isCurrentTabRestricted = restrictions.restrictedTabs.includes(currentTab as any);
  const showBanner = restrictions.isInCombat && (isCurrentTabRestricted || currentTab === 'items');

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          className={`combat-restriction-banner ${className}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: compact ? '6px' : '8px',
            padding: compact ? '0.75rem 1rem' : '1rem 1.5rem',
            margin: '0 0 1rem 0',
            color: '#ffffff',
            fontSize: compact ? '0.85rem' : '0.9rem',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Animated background pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)'
          }} />

          <div style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {/* Combat icon with pulse animation */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ fontSize: compact ? '1.2rem' : '1.5rem' }}
            >
              ⚔️
            </motion.div>

            <div style={{ flex: 1 }}>
              {isCurrentTabRestricted ? (
                <div>
                  <div style={{
                    fontWeight: '600',
                    marginBottom: compact ? '0.25rem' : '0.5rem',
                    fontSize: compact ? '0.9rem' : '1rem'
                  }}>
                    Combat Mode: Access Restricted
                  </div>
                  <div style={{
                    opacity: 0.9,
                    fontSize: compact ? '0.8rem' : '0.85rem',
                    lineHeight: 1.4
                  }}>
                    {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} management is disabled during combat.
                    Switch to Items tab to use consumables.
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{
                    fontWeight: '600',
                    marginBottom: compact ? '0.25rem' : '0.5rem',
                    fontSize: compact ? '0.9rem' : '1rem'
                  }}>
                    Combat Mode: Limited Access
                  </div>
                  <div style={{
                    opacity: 0.9,
                    fontSize: compact ? '0.8rem' : '0.85rem',
                    lineHeight: 1.4
                  }}>
                    Only consumable items can be used during combat. Other inventory actions are disabled.
                  </div>
                </div>
              )}

              {/* Allowed item types indicator */}
              {!compact && restrictions.allowedItemTypes.length > 0 && (
                <div style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    fontSize: '0.75rem',
                    opacity: 0.8
                  }}>
                    Allowed:
                  </span>
                  {restrictions.allowedItemTypes.map((type) => (
                    <span
                      key={type}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}
                    >
                      {type} items
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Dismiss button */}
            {onDismiss && (
              <motion.button
                onClick={onDismiss}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  width: compact ? '24px' : '28px',
                  height: compact ? '24px' : '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: compact ? '0.8rem' : '0.9rem',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </motion.button>
            )}
          </div>

          {/* Progress bar indicating combat status */}
          <motion.div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '2px',
              background: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '0 0 8px 8px'
            }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Compact version for mobile or small spaces
export const CombatRestrictionIndicator: React.FC<{
  restrictions: CombatRestrictions;
  onClick?: () => void;
}> = ({ restrictions, onClick }) => {
  if (!restrictions.isInCombat) {
    return null;
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        padding: '0.5rem 1rem',
        color: '#ffffff',
        fontSize: '0.8rem',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
      }}
    >
      <motion.span
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        ⚔️
      </motion.span>
      <span>Combat Mode</span>
    </motion.button>
  );
};

export default CombatRestrictionBanner;