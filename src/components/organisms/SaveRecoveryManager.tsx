/**
 * Save Recovery Manager Component
 * Manages recovery dialogs and notifications for the entire application
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SaveRecoveryDialog } from '../molecules/SaveRecoveryDialog';
import { useSaveRecovery } from '../../hooks';

interface SaveRecoveryManagerProps {
  /** Whether recovery is enabled */
  enabled?: boolean;
  /** Delay before showing recovery dialog (milliseconds) */
  showDelay?: number;
}

export const SaveRecoveryManager: React.FC<SaveRecoveryManagerProps> = ({
  enabled = true,
  showDelay = 2000, // 2 seconds
}) => {
  const { recoveryInfo, hasRecoveryData, checkForRecovery } = useSaveRecovery({
    autoCheck: true,
    checkInterval: 60000,
  }); // Check every minute

  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [hasShownDialog, setHasShownDialog] = useState(false);

  // Show recovery dialog when recovery data is detected
  useEffect(() => {
    if (!enabled || !hasRecoveryData || hasShownDialog) return;

    // Add a delay before showing the dialog to avoid interrupting startup
    const timer = setTimeout(() => {
      setShowRecoveryDialog(true);
      setHasShownDialog(true);
    }, showDelay);

    return () => clearTimeout(timer);
  }, [enabled, hasRecoveryData, hasShownDialog, showDelay]);

  // Reset dialog state when recovery data is cleared
  useEffect(() => {
    if (!hasRecoveryData) {
      setHasShownDialog(false);
    }
  }, [hasRecoveryData]);

  const handleCloseRecoveryDialog = useCallback(() => {
    setShowRecoveryDialog(false);
  }, []);

  const handleRecoveryComplete = useCallback(() => {
    setShowRecoveryDialog(false);
    setHasShownDialog(false);
    // Re-check for any remaining recovery data
    setTimeout(() => checkForRecovery(), 1000);
  }, [checkForRecovery]);

  if (!enabled) {
    return null;
  }

  return (
    <SaveRecoveryDialog
      isOpen={showRecoveryDialog}
      onClose={handleCloseRecoveryDialog}
      onRecoveryComplete={handleRecoveryComplete}
    />
  );
};

SaveRecoveryManager.displayName = 'SaveRecoveryManager';

export default SaveRecoveryManager;
