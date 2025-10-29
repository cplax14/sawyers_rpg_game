import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EquipmentCompatibility } from '../../types/inventory';

interface EquipmentRestrictionsProps {
  compatibilityResult: EquipmentCompatibility;
  compact?: boolean;
  showRecommendations?: boolean;
  className?: string;
}

// Temporary styles since PostCSS is disabled
const restrictionStyles = {
  container: {
    borderRadius: '8px',
    padding: '0.75rem',
    fontSize: '0.8rem',
  },
  compactContainer: {
    padding: '0.5rem',
    fontSize: '0.75rem',
  },
  compatible: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#10b981',
  },
  incompatible: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
  },
  warning: {
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    color: '#f59e0b',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  compactTitle: {
    marginBottom: '0.25rem',
    fontSize: '0.8rem',
  },
  list: {
    margin: 0,
    paddingLeft: '1rem',
  },
  compactList: {
    paddingLeft: '0.75rem',
  },
  listItem: {
    marginBottom: '0.25rem',
    lineHeight: '1.3',
  },
  compactListItem: {
    marginBottom: '0.15rem',
    fontSize: '0.7rem',
  },
  icon: {
    fontSize: '1.2rem',
    display: 'inline-block',
  },
  compactIcon: {
    fontSize: '1rem',
  },
  section: {
    marginBottom: '0.75rem',
  },
  compactSection: {
    marginBottom: '0.5rem',
  },
  lastSection: {
    marginBottom: 0,
  },
  badge: {
    display: 'inline-block',
    padding: '0.2rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    marginLeft: '0.5rem',
  },
  compatibleBadge: {
    background: '#10b981',
    color: 'white',
  },
  incompatibleBadge: {
    background: '#ef4444',
    color: 'white',
  },
  warningBadge: {
    background: '#f59e0b',
    color: 'white',
  },
};

export const EquipmentRestrictions: React.FC<EquipmentRestrictionsProps> = ({
  compatibilityResult,
  compact = false,
  showRecommendations = true,
  className = '',
}) => {
  const { canEquip, reasons, warnings, suggestions } = compatibilityResult;

  // Determine overall status
  const hasWarnings = warnings.length > 0;
  const isIncompatible = !canEquip;

  // Get appropriate styling
  const getContainerStyle = () => {
    if (isIncompatible) return restrictionStyles.incompatible;
    if (hasWarnings) return restrictionStyles.warning;
    return restrictionStyles.compatible;
  };

  const getIcon = () => {
    if (isIncompatible) return '❌';
    if (hasWarnings) return '⚠️';
    return '✅';
  };

  const getTitle = () => {
    if (isIncompatible) return 'Cannot Equip';
    if (hasWarnings) return 'Can Equip (with warnings)';
    return 'Can Equip';
  };

  const getBadge = () => {
    if (isIncompatible) return { text: 'BLOCKED', style: restrictionStyles.incompatibleBadge };
    if (hasWarnings) return { text: 'WARNING', style: restrictionStyles.warningBadge };
    return { text: 'ALLOWED', style: restrictionStyles.compatibleBadge };
  };

  const badge = getBadge();

  return (
    <motion.div
      className={className}
      style={{
        ...restrictionStyles.container,
        ...(compact ? restrictionStyles.compactContainer : {}),
        ...getContainerStyle(),
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div
        style={{
          ...restrictionStyles.title,
          ...(compact ? restrictionStyles.compactTitle : {}),
        }}
      >
        <motion.span
          style={{
            ...restrictionStyles.icon,
            ...(compact ? restrictionStyles.compactIcon : {}),
          }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
        >
          {getIcon()}
        </motion.span>
        <span>{getTitle()}</span>
        <motion.span
          style={{
            ...restrictionStyles.badge,
            ...badge.style,
          }}
          initial={{ scale: 0, x: 20 }}
          animate={{ scale: 1, x: 0 }}
          transition={{ delay: 0.15, type: 'spring' }}
        >
          {badge.text}
        </motion.span>
      </div>

      {/* Unmet Requirements (Reasons) */}
      <AnimatePresence>
        {reasons.length > 0 && (
          <motion.div
            style={{
              ...restrictionStyles.section,
              ...(compact ? restrictionStyles.compactSection : {}),
              ...(warnings.length === 0 && (!showRecommendations || suggestions.length === 0)
                ? restrictionStyles.lastSection
                : {}),
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Requirements Not Met:</div>
            <ul
              style={{
                ...restrictionStyles.list,
                ...(compact ? restrictionStyles.compactList : {}),
              }}
            >
              {reasons.map((reason, index) => (
                <motion.li
                  key={index}
                  style={{
                    ...restrictionStyles.listItem,
                    ...(compact ? restrictionStyles.compactListItem : {}),
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  {reason}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warnings */}
      <AnimatePresence>
        {warnings.length > 0 && (
          <motion.div
            style={{
              ...restrictionStyles.section,
              ...(compact ? restrictionStyles.compactSection : {}),
              ...(!showRecommendations || suggestions.length === 0
                ? restrictionStyles.lastSection
                : {}),
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Warnings:</div>
            <ul
              style={{
                ...restrictionStyles.list,
                ...(compact ? restrictionStyles.compactList : {}),
              }}
            >
              {warnings.map((warning, index) => (
                <motion.li
                  key={index}
                  style={{
                    ...restrictionStyles.listItem,
                    ...(compact ? restrictionStyles.compactListItem : {}),
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  {warning}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions (formerly Recommendations) */}
      <AnimatePresence>
        {showRecommendations && suggestions.length > 0 && (
          <motion.div
            style={{
              ...restrictionStyles.section,
              ...(compact ? restrictionStyles.compactSection : {}),
              ...restrictionStyles.lastSection,
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Helpful Tips:</div>
            <ul
              style={{
                ...restrictionStyles.list,
                ...(compact ? restrictionStyles.compactList : {}),
              }}
            >
              {suggestions.map((suggestion, index) => (
                <motion.li
                  key={index}
                  style={{
                    ...restrictionStyles.listItem,
                    ...(compact ? restrictionStyles.compactListItem : {}),
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                >
                  {suggestion}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EquipmentRestrictions;
