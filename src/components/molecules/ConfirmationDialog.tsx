import React from 'react';
import { motion } from 'framer-motion';
import { Modal } from '../atoms/Modal';
import { Button } from '../atoms/Button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'secondary';
  isLoading?: boolean;
  children?: React.ReactNode;
}

// Temporary styles since PostCSS is disabled
const dialogStyles = {
  content: {
    textAlign: 'center' as const,
    padding: '1rem',
  },
  message: {
    fontSize: '1rem',
    color: '#f4f4f4',
    marginBottom: '1.5rem',
    lineHeight: '1.5',
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  children: {
    marginBottom: '1rem',
  },
};

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  children,
}) => {
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size='sm'
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
      showCloseButton={!isLoading}
    >
      <div style={dialogStyles.content}>
        {children && <div style={dialogStyles.children}>{children}</div>}

        <p style={dialogStyles.message}>{message}</p>

        <motion.div
          style={dialogStyles.actions}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button variant='secondary' onClick={handleCancel} disabled={isLoading} size='md'>
            {cancelText}
          </Button>

          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={isLoading}
            loading={isLoading}
            size='md'
          >
            {confirmText}
          </Button>
        </motion.div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
