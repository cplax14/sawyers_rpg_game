import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { GoldBalance } from '../atoms/GoldBalance';
import { NPCTradeCard } from '../molecules/NPCTradeCard';
import { Modal } from '../atoms/Modal';
import { useNPCTrades } from '../../hooks/useNPCTrades';
import { useGameState } from '../../contexts/ReactGameContext';
import { NPCTrade } from '../../types/shop';

export interface NPCTradeInterfaceProps {
  /** Area ID to show trades for */
  areaId: string;
  /** Callback when interface is closed */
  onClose: () => void;
  /** Additional className */
  className?: string;
}

// Styles for NPCTradeInterface
const tradeInterfaceStyles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(8px)',
  },
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '90vw',
    maxWidth: '1000px',
    height: '85vh',
    maxHeight: '800px',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    borderRadius: '20px',
    border: '3px solid rgba(139, 92, 246, 0.4)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    position: 'relative' as const,
  },
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    padding: '1.5rem',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.1))',
    borderBottom: '2px solid rgba(139, 92, 246, 0.3)',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 'bold' as const,
    color: '#d4af37',
    margin: '0 0 0.25rem 0',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: 0,
  },
  closeButton: {
    minWidth: '100px',
  },
  npcDialogue: {
    padding: '1rem 1.25rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    borderLeft: '4px solid rgba(139, 92, 246, 0.5)',
    fontSize: '0.9375rem',
    color: '#e2e8f0',
    fontStyle: 'italic' as const,
    lineHeight: 1.5,
    margin: 0,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '1.5rem',
    gap: '1rem',
    overflow: 'hidden',
  },
  filterContainer: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  filterButton: {
    padding: '0.5rem 1rem',
    borderRadius: '10px',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#94a3b8',
    fontSize: '0.875rem',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  activeFilterButton: {
    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    color: '#fff',
    border: '2px solid rgba(139, 92, 246, 0.5)',
  },
  tradeListContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    paddingRight: '0.5rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    textAlign: 'center' as const,
    color: '#94a3b8',
    gap: '1rem',
  },
  emptyStateIcon: {
    fontSize: '4rem',
  },
  emptyStateText: {
    fontSize: '1.125rem',
    margin: 0,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    gap: '1rem',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    gap: '1rem',
    color: '#ef4444',
  },
  confirmationModal: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
    padding: '1.5rem',
  },
  confirmationTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold' as const,
    color: '#d4af37',
    margin: 0,
  },
  confirmationSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  confirmationSectionTitle: {
    fontSize: '0.875rem',
    fontWeight: 'bold' as const,
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '0 0 0.5rem 0',
  },
  confirmationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    color: '#cbd5e1',
  },
  confirmationItemName: {
    fontWeight: '500' as const,
  },
  confirmationItemQuantity: {
    color: '#FFD700',
    fontWeight: 'bold' as const,
  },
  confirmationDialogue: {
    padding: '1rem',
    background: 'rgba(139, 92, 246, 0.1)',
    borderRadius: '8px',
    borderLeft: '3px solid rgba(139, 92, 246, 0.5)',
    fontSize: '0.9375rem',
    color: '#e2e8f0',
    fontStyle: 'italic' as const,
    lineHeight: 1.5,
    margin: 0,
  },
  confirmationButtons: {
    display: 'flex',
    gap: '1rem',
  },
  successMessage: {
    padding: '1.5rem',
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1))',
    borderRadius: '12px',
    border: '2px solid rgba(34, 197, 94, 0.4)',
    textAlign: 'center' as const,
  },
  successIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  successText: {
    fontSize: '1.125rem',
    color: '#22c55e',
    fontWeight: 'bold' as const,
    margin: 0,
  },
  errorMessage: {
    padding: '1rem',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    fontSize: '0.9375rem',
  },
};

// Filter options
type FilterOption = 'all' | 'available' | 'completed' | 'locked';

/**
 * NPCTradeInterface - NPC trading UI
 *
 * Complete interface for trading with NPCs in an area.
 * Shows available trades, handles confirmations, and provides
 * kid-friendly feedback for ages 7-12.
 *
 * Features:
 * - List of available trades filtered by area
 * - NPC character portrait and dialogue
 * - Trade confirmation modal with details
 * - Success/error messaging with animation
 * - Filter trades by availability status
 * - Keyboard navigation support
 * - Responsive design
 *
 * @example
 * ```tsx
 * <NPCTradeInterface
 *   areaId="mistwood_forest"
 *   onClose={handleClose}
 * />
 * ```
 */
export const NPCTradeInterface: React.FC<NPCTradeInterfaceProps> = ({
  areaId,
  onClose,
  className = '',
}) => {
  const { state } = useGameState();
  const {
    trades,
    availableTrades,
    completedTrades,
    isLoading,
    error,
    canExecuteTrade,
    getTradeRequirements,
    isTradeAvailable,
    executeTrade,
    getTradesForArea,
  } = useNPCTrades(areaId);

  // UI state
  const [filterOption, setFilterOption] = useState<FilterOption>('available');
  const [selectedTrade, setSelectedTrade] = useState<NPCTrade | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs for keyboard navigation
  const containerRef = useRef<HTMLDivElement>(null);

  // Get current area name
  const currentArea = useMemo(() => {
    // For now, just return the area ID as name
    // TODO: Load area data from dataLoader if needed
    return { id: areaId, name: areaId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) };
  }, [areaId]);

  // Get filtered trades based on selected filter
  const filteredTrades = useMemo(() => {
    const areaTrades = getTradesForArea(areaId);

    switch (filterOption) {
      case 'available':
        return areaTrades.filter(trade => isTradeAvailable(trade) && canExecuteTrade(trade));

      case 'completed':
        return areaTrades.filter(trade => completedTrades.some(ct => ct.id === trade.id));

      case 'locked':
        return areaTrades.filter(trade => !isTradeAvailable(trade) || !canExecuteTrade(trade));

      case 'all':
      default:
        return areaTrades;
    }
  }, [areaId, filterOption, getTradesForArea, isTradeAvailable, canExecuteTrade, completedTrades]);

  // Handle trade initiation
  const handleTradeInitiate = useCallback((trade: NPCTrade) => {
    setSelectedTrade(trade);
    setIsConfirmationOpen(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  // Handle trade confirmation
  const handleTradeConfirm = useCallback(async () => {
    if (!selectedTrade) return;

    setIsExecuting(true);
    setErrorMessage(null);

    try {
      const result = await executeTrade(selectedTrade);

      if (result.success) {
        setSuccessMessage(result.message);
        setIsConfirmationOpen(false);

        // Auto-close success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
          setSelectedTrade(null);
        }, 3000);
      } else {
        setErrorMessage(result.error?.message || 'Trade failed. Please try again.');
      }
    } catch (err) {
      console.error('Trade execution error:', err);
      setErrorMessage('Oops! Something went wrong. Please try again!');
    } finally {
      setIsExecuting(false);
    }
  }, [selectedTrade, executeTrade]);

  // Handle trade cancellation
  const handleTradeCancel = useCallback(() => {
    setIsConfirmationOpen(false);
    setSelectedTrade(null);
    setErrorMessage(null);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape' && !isConfirmationOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConfirmationOpen, onClose]);

  // Render loading state
  if (isLoading) {
    return (
      <div style={tradeInterfaceStyles.overlay} onClick={e => e.stopPropagation()}>
        <motion.div
          style={tradeInterfaceStyles.container}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div style={tradeInterfaceStyles.loadingContainer}>
            <LoadingSpinner size='large' />
            <p style={{ color: '#94a3b8', fontSize: '1.125rem', margin: 0 }}>
              Finding traders in the area...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div style={tradeInterfaceStyles.overlay} onClick={e => e.stopPropagation()}>
        <motion.div
          style={tradeInterfaceStyles.container}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div style={tradeInterfaceStyles.errorContainer}>
            <span style={{ fontSize: '4rem' }}>❌</span>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              Error Loading Trades
            </p>
            <p style={{ fontSize: '1rem', margin: 0 }}>{error}</p>
            <Button variant='primary' onClick={onClose}>
              Go Back
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={tradeInterfaceStyles.overlay} onClick={onClose}>
      <motion.div
        ref={containerRef}
        className={className}
        style={tradeInterfaceStyles.container}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        onClick={e => e.stopPropagation()}
        role='dialog'
        aria-label='NPC Trade Interface'
        aria-modal='true'
      >
        {/* Header */}
        <div style={tradeInterfaceStyles.header}>
          <div style={tradeInterfaceStyles.headerTop}>
            <div style={tradeInterfaceStyles.titleSection}>
              <h1 style={tradeInterfaceStyles.title}>🤝 NPC Traders</h1>
              <p style={tradeInterfaceStyles.subtitle}>{currentArea?.name || areaId}</p>
            </div>

            <GoldBalance size='lg' showLabel={true} />

            <Button
              variant='secondary'
              size='md'
              onClick={onClose}
              style={tradeInterfaceStyles.closeButton}
              aria-label='Close trade interface'
            >
              Close
            </Button>
          </div>

          {/* NPC Dialogue */}
          <p style={tradeInterfaceStyles.npcDialogue}>
            "Welcome, adventurer! Looking to trade? I have some interesting offers for you!"
          </p>
        </div>

        {/* Main Content */}
        <div style={tradeInterfaceStyles.content}>
          {/* Filter Buttons */}
          <div style={tradeInterfaceStyles.filterContainer}>
            <motion.button
              style={{
                ...tradeInterfaceStyles.filterButton,
                ...(filterOption === 'all' ? tradeInterfaceStyles.activeFilterButton : {}),
              }}
              onClick={() => setFilterOption('all')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              All Trades
            </motion.button>

            <motion.button
              style={{
                ...tradeInterfaceStyles.filterButton,
                ...(filterOption === 'available' ? tradeInterfaceStyles.activeFilterButton : {}),
              }}
              onClick={() => setFilterOption('available')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ✓ Available ({availableTrades.filter(t => t.location === areaId).length})
            </motion.button>

            <motion.button
              style={{
                ...tradeInterfaceStyles.filterButton,
                ...(filterOption === 'completed' ? tradeInterfaceStyles.activeFilterButton : {}),
              }}
              onClick={() => setFilterOption('completed')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ✓ Completed ({completedTrades.filter(t => t.location === areaId).length})
            </motion.button>

            <motion.button
              style={{
                ...tradeInterfaceStyles.filterButton,
                ...(filterOption === 'locked' ? tradeInterfaceStyles.activeFilterButton : {}),
              }}
              onClick={() => setFilterOption('locked')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔒 Locked
            </motion.button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <motion.div
              style={tradeInterfaceStyles.successMessage}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div style={tradeInterfaceStyles.successIcon}>✓</div>
              <p style={tradeInterfaceStyles.successText}>{successMessage}</p>
            </motion.div>
          )}

          {/* Trade List */}
          <div style={tradeInterfaceStyles.tradeListContainer}>
            {filteredTrades.length === 0 ? (
              <div style={tradeInterfaceStyles.emptyState}>
                <span style={tradeInterfaceStyles.emptyStateIcon}>
                  {filterOption === 'completed' ? '✓' : '🔍'}
                </span>
                <p style={tradeInterfaceStyles.emptyStateText}>
                  {filterOption === 'available' && 'No trades available here right now.'}
                  {filterOption === 'completed' && "You haven't completed any trades here yet."}
                  {filterOption === 'locked' && 'All trades are available!'}
                  {filterOption === 'all' && 'No traders found in this area.'}
                </p>
              </div>
            ) : (
              filteredTrades.map(trade => (
                <NPCTradeCard
                  key={trade.id}
                  trade={{
                    ...trade,
                    completed: completedTrades.some(ct => ct.id === trade.id),
                    available: isTradeAvailable(trade),
                  }}
                  canTrade={canExecuteTrade(trade)}
                  onTrade={handleTradeInitiate}
                />
              ))
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {isConfirmationOpen && selectedTrade && (
          <Modal isOpen={isConfirmationOpen} onClose={handleTradeCancel} title='Confirm Trade'>
            <div style={tradeInterfaceStyles.confirmationModal}>
              <h2 style={tradeInterfaceStyles.confirmationTitle}>
                Trade with {selectedTrade.npcName}
              </h2>

              {/* NPC Dialogue */}
              <p style={tradeInterfaceStyles.confirmationDialogue}>"{selectedTrade.dialogue}"</p>

              {/* Required Items */}
              {selectedTrade.requiredItems.length > 0 && (
                <div style={tradeInterfaceStyles.confirmationSection}>
                  <p style={tradeInterfaceStyles.confirmationSectionTitle}>You Will Give:</p>
                  {selectedTrade.requiredItems.map((item, index) => (
                    <div key={`req-${index}`} style={tradeInterfaceStyles.confirmationItem}>
                      <span style={tradeInterfaceStyles.confirmationItemName}>{item.itemId}</span>
                      <span style={tradeInterfaceStyles.confirmationItemQuantity}>
                        ×{item.quantity}
                      </span>
                    </div>
                  ))}
                  {selectedTrade.goldRequired && selectedTrade.goldRequired > 0 && (
                    <div style={tradeInterfaceStyles.confirmationItem}>
                      <span style={tradeInterfaceStyles.confirmationItemName}>Gold</span>
                      <span style={tradeInterfaceStyles.confirmationItemQuantity}>
                        💰{selectedTrade.goldRequired}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Offered Items */}
              {selectedTrade.offeredItems.length > 0 && (
                <div style={tradeInterfaceStyles.confirmationSection}>
                  <p style={tradeInterfaceStyles.confirmationSectionTitle}>You Will Receive:</p>
                  {selectedTrade.offeredItems.map((item, index) => (
                    <div key={`offer-${index}`} style={tradeInterfaceStyles.confirmationItem}>
                      <span style={tradeInterfaceStyles.confirmationItemName}>{item.itemId}</span>
                      <span style={tradeInterfaceStyles.confirmationItemQuantity}>
                        ×{item.quantity}
                        {item.chance && item.chance < 1 && ` (${Math.round(item.chance * 100)}%)`}
                      </span>
                    </div>
                  ))}
                  {selectedTrade.goldOffered && selectedTrade.goldOffered > 0 && (
                    <div style={tradeInterfaceStyles.confirmationItem}>
                      <span style={tradeInterfaceStyles.confirmationItemName}>Gold</span>
                      <span style={tradeInterfaceStyles.confirmationItemQuantity}>
                        💰{selectedTrade.goldOffered}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {errorMessage && <div style={tradeInterfaceStyles.errorMessage}>{errorMessage}</div>}

              {/* Action Buttons */}
              <div style={tradeInterfaceStyles.confirmationButtons}>
                <Button
                  variant='secondary'
                  size='lg'
                  onClick={handleTradeCancel}
                  disabled={isExecuting}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  variant='primary'
                  size='lg'
                  onClick={handleTradeConfirm}
                  disabled={isExecuting}
                  fullWidth
                >
                  {isExecuting ? 'Trading...' : 'Confirm Trade'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </motion.div>
    </div>
  );
};

export default NPCTradeInterface;
