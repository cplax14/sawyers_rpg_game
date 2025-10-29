import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../atoms/Modal';
import { Button } from '../atoms/Button';
import { PriceTag } from '../atoms/PriceTag';
import { EnhancedItem } from '../../types/inventory';
import { useGameState } from '../../contexts/ReactGameContext';

export interface TransactionModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Item being transacted */
  item: EnhancedItem | null;
  /** Quantity of items */
  quantity: number;
  /** Transaction type */
  transactionType: 'buy' | 'sell';
  /** Total price for the transaction */
  totalPrice: number;
  /** Callback when transaction is confirmed */
  onConfirm: () => void;
  /** Callback when transaction is cancelled */
  onCancel: () => void;
  /** Whether the transaction is processing */
  isProcessing?: boolean;
}

// Styles for TransactionModal
const transactionModalStyles = {
  content: {
    padding: '1.5rem',
    maxWidth: '500px',
    width: '100%',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold' as const,
    color: '#d4af37',
    margin: '0 0 0.5rem 0',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: 0,
  },
  itemSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '1.5rem',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: '1.125rem',
    fontWeight: 'bold' as const,
    color: '#e2e8f0',
    margin: 0,
  },
  itemDescription: {
    fontSize: '0.875rem',
    color: '#cbd5e1',
    lineHeight: 1.4,
    margin: 0,
  },
  summarySection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    padding: '1rem',
    background: 'rgba(139, 92, 246, 0.1)',
    borderRadius: '12px',
    border: '2px solid rgba(139, 92, 246, 0.3)',
    marginBottom: '1rem',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.9375rem',
  },
  summaryLabel: {
    color: '#cbd5e1',
    fontWeight: '500' as const,
  },
  summaryValue: {
    color: '#e2e8f0',
    fontWeight: 'bold' as const,
  },
  totalRow: {
    paddingTop: '0.75rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
  },
  warningSection: {
    padding: '0.75rem 1rem',
    background: 'rgba(245, 158, 11, 0.1)',
    border: '2px solid rgba(245, 158, 11, 0.4)',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  warningText: {
    fontSize: '0.875rem',
    color: '#fbbf24',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
  },
};

// Gold warning threshold (kid-friendly safety)
const LOW_GOLD_THRESHOLD = 100;

/**
 * TransactionModal - Confirmation modal for buy/sell transactions
 *
 * Kid-friendly modal showing transaction summary with warnings for low gold.
 * Provides clear confirmation/cancel actions with processing states.
 *
 * @example
 * ```tsx
 * <TransactionModal
 *   isOpen={showModal}
 *   item={selectedItem}
 *   quantity={3}
 *   transactionType="buy"
 *   totalPrice={150}
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  item,
  quantity,
  transactionType,
  totalPrice,
  onConfirm,
  onCancel,
  isProcessing = false,
}) => {
  const { gameState } = useGameState();

  // Calculate gold after transaction
  const goldAfterTransaction = useMemo(() => {
    const currentGold = gameState?.player?.gold ?? 0;
    if (transactionType === 'buy') {
      return currentGold - totalPrice;
    } else {
      return currentGold + totalPrice;
    }
  }, [transactionType, gameState?.player?.gold, totalPrice]);

  // Check if transaction will result in low gold
  const willHaveLowGold = useMemo(() => {
    return transactionType === 'buy' && goldAfterTransaction < LOW_GOLD_THRESHOLD;
  }, [transactionType, goldAfterTransaction]);

  // Get modal title
  const getTitle = (): string => {
    return transactionType === 'buy' ? 'Confirm Purchase' : 'Confirm Sale';
  };

  // Get confirmation button text
  const getConfirmText = (): string => {
    if (isProcessing) return 'Processing...';
    return transactionType === 'buy' ? 'Buy Now' : 'Sell Now';
  };

  // Get subtitle
  const getSubtitle = (): string => {
    if (transactionType === 'buy') {
      return 'Are you sure you want to buy this item?';
    }
    return 'Are you sure you want to sell this item?';
  };

  if (!item) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onCancel} title='' showCloseButton={!isProcessing}>
          <div style={transactionModalStyles.content}>
            {/* Header */}
            <div style={transactionModalStyles.header}>
              <h2 style={transactionModalStyles.title}>{getTitle()}</h2>
              <p style={transactionModalStyles.subtitle}>{getSubtitle()}</p>
            </div>

            {/* Item Details */}
            <div style={transactionModalStyles.itemSection}>
              <div style={transactionModalStyles.itemHeader}>
                <h3 style={transactionModalStyles.itemName}>{item.name}</h3>
                {item.rarity && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      background: 'rgba(139, 92, 246, 0.2)',
                      color: '#a78bfa',
                      textTransform: 'capitalize' as const,
                    }}
                  >
                    {item.rarity}
                  </span>
                )}
              </div>

              {item.description && (
                <p style={transactionModalStyles.itemDescription}>{item.description}</p>
              )}
            </div>

            {/* Transaction Summary */}
            <div style={transactionModalStyles.summarySection}>
              <div style={transactionModalStyles.summaryRow}>
                <span style={transactionModalStyles.summaryLabel}>Quantity:</span>
                <span style={transactionModalStyles.summaryValue}>{quantity}</span>
              </div>

              <div style={transactionModalStyles.summaryRow}>
                <span style={transactionModalStyles.summaryLabel}>Price per item:</span>
                <PriceTag amount={totalPrice / quantity} size='small' />
              </div>

              <div
                style={{
                  ...transactionModalStyles.summaryRow,
                  ...transactionModalStyles.totalRow,
                }}
              >
                <span style={transactionModalStyles.summaryLabel}>
                  Total {transactionType === 'buy' ? 'Cost' : 'Value'}:
                </span>
                <PriceTag
                  amount={totalPrice}
                  size='medium'
                  canAfford={
                    transactionType === 'buy'
                      ? (gameState?.player?.gold ?? 0) >= totalPrice
                      : undefined
                  }
                />
              </div>

              <div style={transactionModalStyles.summaryRow}>
                <span style={transactionModalStyles.summaryLabel}>Gold after transaction:</span>
                <PriceTag amount={goldAfterTransaction} size='small' />
              </div>
            </div>

            {/* Low Gold Warning */}
            {willHaveLowGold && (
              <motion.div
                style={transactionModalStyles.warningSection}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <p style={transactionModalStyles.warningText}>
                  <span aria-hidden='true'>⚠️</span>
                  <span>
                    Your gold will be low after this purchase. Make sure you have enough for other
                    items!
                  </span>
                </p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div style={transactionModalStyles.actions}>
              <Button variant='secondary' size='md' onClick={onCancel} disabled={isProcessing}>
                Cancel
              </Button>

              <Button
                variant={transactionType === 'buy' ? 'primary' : 'success'}
                size='md'
                onClick={onConfirm}
                disabled={isProcessing}
                loading={isProcessing}
              >
                {getConfirmText()}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default TransactionModal;
