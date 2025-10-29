/**
 * Authentication Modal - Stub Implementation
 */

import React from 'react';

interface AuthenticationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthenticationModal: React.FC<AuthenticationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <h3>Authentication Modal (Stub)</h3>
        <p>This is a placeholder for the authentication modal.</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default AuthenticationModal;
