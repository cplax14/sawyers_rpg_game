import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import styles from './Modal.module.css'; // Temporarily disabled due to PostCSS parsing issues

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function called when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Modal size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether clicking overlay closes modal */
  closeOnOverlayClick?: boolean;
  /** Whether pressing Escape closes modal */
  closeOnEscape?: boolean;
  /** Custom className for modal content */
  className?: string;
  /** Show close button */
  showCloseButton?: boolean;
  /** Prevent body scroll when modal is open */
  preventBodyScroll?: boolean;
  /** Custom overlay className */
  overlayClassName?: string;
  /** Disable focus trap */
  disableFocusTrap?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  showCloseButton = true,
  preventBodyScroll = true,
  overlayClassName = '',
  disableFocusTrap = false,
}) => {
  const [previousActiveElement, setPreviousActiveElement] = useState<Element | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle body scroll prevention
  useEffect(() => {
    if (!preventBodyScroll) return;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, preventBodyScroll]);

  // Handle focus management
  useEffect(() => {
    if (!disableFocusTrap) {
      if (isOpen) {
        // Store the currently focused element
        setPreviousActiveElement(document.activeElement);

        // Focus the modal after it opens
        setTimeout(() => {
          const modal = document.querySelector('[role="dialog"]') as HTMLElement;
          if (modal) {
            modal.focus();
          }
        }, 100);
      } else if (previousActiveElement && previousActiveElement instanceof HTMLElement) {
        // Restore focus to the previously focused element
        previousActiveElement.focus();
        setPreviousActiveElement(null);
      }
    }
  }, [isOpen, disableFocusTrap, previousActiveElement]);

  // Handle focus trap
  useEffect(() => {
    if (!isOpen || disableFocusTrap) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstFocusable = focusableElements[0] as HTMLElement;
      const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen, disableFocusTrap]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const overlayClasses = [
    styles.overlay,
    overlayClassName,
  ].filter(Boolean).join(' ');

  const modalClasses = [
    styles.modal,
    styles[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={overlayClasses}
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ zIndex: 1000 }}
        >
          <motion.div
            className={modalClasses}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className={styles.header}>
                {title && (
                  <h2 id="modal-title" className={styles.title}>
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    type="button"
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className={styles.content}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

Modal.displayName = 'Modal';

export { Modal };