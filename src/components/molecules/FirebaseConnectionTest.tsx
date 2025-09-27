/**
 * Firebase Connection Test Component
 * Tests and displays Firebase connection status
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { checkFirebaseConnection, isFirebaseConfigured } from '../../config/firebase';
import { Button } from '../atoms';

interface FirebaseConnectionTestProps {
  /** Whether to auto-test on mount */
  autoTest?: boolean;
  /** Custom className */
  className?: string;
}

interface ConnectionStatus {
  configured: boolean;
  connected: boolean;
  services: {
    auth: boolean;
    firestore: boolean;
    storage: boolean;
  };
  error?: string;
  testing: boolean;
}

export const FirebaseConnectionTest: React.FC<FirebaseConnectionTestProps> = ({
  autoTest = true,
  className = ''
}) => {
  const [status, setStatus] = useState<ConnectionStatus>({
    configured: false,
    connected: false,
    services: {
      auth: false,
      firestore: false,
      storage: false
    },
    testing: false
  });

  const testConnection = useCallback(async () => {
    setStatus(prev => ({ ...prev, testing: true }));

    try {
      const configured = isFirebaseConfigured();
      const connectionResult = await checkFirebaseConnection();

      setStatus({
        configured,
        connected: connectionResult.connected,
        services: connectionResult.services,
        error: connectionResult.error,
        testing: false
      });
    } catch (error) {
      setStatus({
        configured: false,
        connected: false,
        services: {
          auth: false,
          firestore: false,
          storage: false
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        testing: false
      });
    }
  }, []);

  useEffect(() => {
    if (autoTest) {
      testConnection();
    }
  }, [autoTest, testConnection]);

  const getStatusColor = (isWorking: boolean): string => {
    return isWorking ? '#51cf66' : '#ff6b6b';
  };

  const getStatusIcon = (isWorking: boolean): string => {
    return isWorking ? '✅' : '❌';
  };

  const containerStyle: React.CSSProperties = {
    padding: '20px',
    background: 'linear-gradient(135deg, #2a2a3e, #1e1e2f)',
    borderRadius: '12px',
    border: '2px solid rgba(212, 175, 55, 0.3)',
    maxWidth: '600px'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px'
  };

  const titleStyle: React.CSSProperties = {
    color: '#d4af37',
    fontSize: '1.3rem',
    fontWeight: 'bold',
    margin: 0
  };

  const serviceStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '6px',
    marginBottom: '8px'
  };

  const serviceNameStyle: React.CSSProperties = {
    color: '#ffffff',
    fontWeight: '500'
  };

  const serviceStatusStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.9rem'
  };

  return (
    <motion.div
      style={containerStyle}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={headerStyle}>
        <h3 style={titleStyle}>Firebase Connection Status</h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={testConnection}
          disabled={status.testing}
        >
          {status.testing ? 'Testing...' : 'Test Again'}
        </Button>
      </div>

      {/* Overall Status */}
      <div style={{
        ...serviceStyle,
        background: status.connected ? 'rgba(81, 207, 102, 0.1)' : 'rgba(255, 107, 107, 0.1)',
        border: `1px solid ${status.connected ? 'rgba(81, 207, 102, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`
      }}>
        <span style={serviceNameStyle}>Overall Status</span>
        <div style={serviceStatusStyle}>
          <span style={{ color: getStatusColor(status.connected) }}>
            {status.connected ? 'Connected' : 'Disconnected'}
          </span>
          <span>{getStatusIcon(status.connected)}</span>
        </div>
      </div>

      {/* Configuration Status */}
      <div style={serviceStyle}>
        <span style={serviceNameStyle}>Configuration</span>
        <div style={serviceStatusStyle}>
          <span style={{ color: getStatusColor(status.configured) }}>
            {status.configured ? 'Configured' : 'Not Configured'}
          </span>
          <span>{getStatusIcon(status.configured)}</span>
        </div>
      </div>

      {/* Individual Services */}
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ color: '#cccccc', margin: '0 0 12px 0', fontSize: '1rem' }}>
          Services:
        </h4>

        <div style={serviceStyle}>
          <span style={serviceNameStyle}>Authentication</span>
          <div style={serviceStatusStyle}>
            <span style={{ color: getStatusColor(status.services.auth) }}>
              {status.services.auth ? 'Ready' : 'Not Ready'}
            </span>
            <span>{getStatusIcon(status.services.auth)}</span>
          </div>
        </div>

        <div style={serviceStyle}>
          <span style={serviceNameStyle}>Firestore Database</span>
          <div style={serviceStatusStyle}>
            <span style={{ color: getStatusColor(status.services.firestore) }}>
              {status.services.firestore ? 'Ready' : 'Not Ready'}
            </span>
            <span>{getStatusIcon(status.services.firestore)}</span>
          </div>
        </div>

        <div style={serviceStyle}>
          <span style={serviceNameStyle}>Cloud Storage</span>
          <div style={serviceStatusStyle}>
            <span style={{ color: getStatusColor(status.services.storage) }}>
              {status.services.storage ? 'Ready' : 'Not Ready'}
            </span>
            <span>{getStatusIcon(status.services.storage)}</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {status.error && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          borderRadius: '6px',
          color: '#ff9999',
          fontSize: '0.9rem'
        }}>
          <strong>Error:</strong> {status.error}
        </div>
      )}

      {/* Configuration Help */}
      {!status.configured && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '6px',
          color: '#ffc107',
          fontSize: '0.9rem'
        }}>
          <strong>Setup Required:</strong> Please configure Firebase by creating a <code>.env.local</code> file
          with your Firebase project settings. See <code>docs/firebase-setup.md</code> for detailed instructions.
        </div>
      )}

      {/* Success Message */}
      {status.connected && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(81, 207, 102, 0.1)',
          border: '1px solid rgba(81, 207, 102, 0.3)',
          borderRadius: '6px',
          color: '#51cf66',
          fontSize: '0.9rem'
        }}>
          <strong>Success!</strong> Firebase is properly configured and all services are ready.
          Cloud save functionality is available.
        </div>
      )}
    </motion.div>
  );
};

FirebaseConnectionTest.displayName = 'FirebaseConnectionTest';

export default FirebaseConnectionTest;