import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInventoryKeyboardShortcuts, KeyboardShortcut } from '../../hooks/useInventoryKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  isVisible: boolean;
  onClose: () => void;
  currentTab: string;
  shortcuts: Record<string, KeyboardShortcut[]>;
  compact?: boolean;
  className?: string;
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isVisible,
  onClose,
  currentTab,
  shortcuts,
  compact = false,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Category display configuration
  const categoryConfig = {
    navigation: {
      name: 'Navigation',
      icon: '🧭',
      color: '#4fc3f7'
    },
    actions: {
      name: 'Actions',
      icon: '⚡',
      color: '#a855f7'
    },
    quick: {
      name: 'Quick Actions',
      icon: '⚡',
      color: '#22c55e'
    },
    combat: {
      name: 'Combat',
      icon: '⚔️',
      color: '#f97316'
    }
  };

  // Format key combination for display
  const formatKeyCombo = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];

    if (shortcut.modifiers) {
      if (shortcut.modifiers.ctrl) parts.push('Ctrl');
      if (shortcut.modifiers.shift) parts.push('Shift');
      if (shortcut.modifiers.alt) parts.push('Alt');
    }

    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`keyboard-shortcuts-help ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
            borderRadius: '16px',
            border: '2px solid rgba(79, 195, 247, 0.3)',
            width: '100%',
            maxWidth: compact ? '500px' : '800px',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.5rem 2rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderBottom: '1px solid rgba(79, 195, 247, 0.2)'
          }}>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.5rem',
                color: '#4fc3f7',
                fontWeight: 'bold'
              }}>
                ⌨️ Keyboard Shortcuts
              </h2>
              <p style={{
                margin: '0.5rem 0 0',
                color: 'rgba(244, 244, 244, 0.8)',
                fontSize: '0.9rem'
              }}>
                Current tab: {currentTab}
              </p>
            </div>

            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f4f4f4',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              ✕
            </motion.button>
          </div>

          {/* Content */}
          <div style={{
            padding: '1.5rem 2rem',
            maxHeight: 'calc(80vh - 120px)',
            overflowY: 'auto'
          }}>
            {compact ? (
              // Compact view - single column
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {Object.entries(shortcuts).map(([category, categoryShortcuts]) => {
                  const config = categoryConfig[category as keyof typeof categoryConfig];
                  if (!config || categoryShortcuts.length === 0) return null;

                  return (
                    <div key={category}>
                      <h3 style={{
                        margin: '0 0 1rem',
                        fontSize: '1.1rem',
                        color: config.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>{config.icon}</span>
                        {config.name}
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {categoryShortcuts.map((shortcut, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.75rem 1rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                          >
                            <span style={{
                              color: '#f4f4f4',
                              fontSize: '0.9rem'
                            }}>
                              {shortcut.description}
                            </span>

                            <div style={{
                              background: 'rgba(79, 195, 247, 0.2)',
                              border: '1px solid rgba(79, 195, 247, 0.4)',
                              borderRadius: '6px',
                              padding: '0.25rem 0.75rem',
                              color: '#4fc3f7',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              fontFamily: 'monospace'
                            }}>
                              {formatKeyCombo(shortcut)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Full view - category tabs
              <div>
                {/* Category tabs */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap'
                }}>
                  {Object.entries(shortcuts).map(([category, categoryShortcuts]) => {
                    const config = categoryConfig[category as keyof typeof categoryConfig];
                    if (!config || categoryShortcuts.length === 0) return null;

                    const isSelected = selectedCategory === category;

                    return (
                      <motion.button
                        key={category}
                        onClick={() => setSelectedCategory(isSelected ? null : category)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          background: isSelected ? 'rgba(79, 195, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: isSelected ? '1px solid rgba(79, 195, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '0.75rem 1rem',
                          color: isSelected ? '#4fc3f7' : '#f4f4f4',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.9rem',
                          fontWeight: isSelected ? '600' : '400'
                        }}
                      >
                        <span>{config.icon}</span>
                        {config.name}
                        <span style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '10px',
                          padding: '0.2rem 0.4rem',
                          fontSize: '0.7rem',
                          minWidth: '18px',
                          textAlign: 'center'
                        }}>
                          {categoryShortcuts.length}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Shortcuts display */}
                <AnimatePresence mode="wait">
                  {selectedCategory ? (
                    <motion.div
                      key={selectedCategory}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '0.75rem'
                      }}
                    >
                      {shortcuts[selectedCategory].map((shortcut, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          <span style={{
                            color: '#f4f4f4',
                            fontSize: '0.9rem'
                          }}>
                            {shortcut.description}
                          </span>

                          <div style={{
                            background: 'rgba(79, 195, 247, 0.2)',
                            border: '1px solid rgba(79, 195, 247, 0.4)',
                            borderRadius: '6px',
                            padding: '0.5rem 1rem',
                            color: '#4fc3f7',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            fontFamily: 'monospace'
                          }}>
                            {formatKeyCombo(shortcut)}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        textAlign: 'center',
                        padding: '3rem 1rem',
                        color: 'rgba(244, 244, 244, 0.6)'
                      }}
                    >
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⌨️</div>
                      <p style={{ fontSize: '1.1rem', margin: 0 }}>
                        Select a category to view keyboard shortcuts
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '1rem 2rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderTop: '1px solid rgba(79, 195, 247, 0.2)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: 'rgba(244, 244, 244, 0.6)'
          }}>
            Press <strong>?</strong> to toggle this help, <strong>ESC</strong> to close
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default KeyboardShortcutsHelp;