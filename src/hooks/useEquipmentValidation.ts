/**
 * useEquipmentValidation Hook
 *
 * Provides comprehensive equipment validation functionality with
 * real-time feedback and restriction checking.
 */

import { useCallback, useMemo } from 'react';
import { useGameState } from '../contexts/ReactGameContext';
import { EnhancedItem, EquipmentSlot } from '../types/inventory';
import { PlayerStats } from '../types/game';
import { checkEquipmentCompatibility, CompatibilityCheckResult } from '../utils/equipmentUtils';

interface EquipmentValidationResult {
  canEquip: boolean;
  compatibility: CompatibilityCheckResult;
  hasWarnings: boolean;
  hasBlockers: boolean;
  validationMessage: string;
  validationLevel: 'success' | 'warning' | 'error';
}

interface UseEquipmentValidationReturn {
  // Validation functions
  validateEquipment: (item: EnhancedItem, slot: EquipmentSlot) => EquipmentValidationResult;
  validateBulkEquipment: (items: Array<{ item: EnhancedItem; slot: EquipmentSlot }>) => EquipmentValidationResult[];

  // Quick validation checks
  canEquipItem: (item: EnhancedItem, slot: EquipmentSlot) => boolean;
  getRestrictionMessage: (item: EnhancedItem, slot: EquipmentSlot) => string;

  // Player info for validation
  playerInfo: {
    level: number;
    class: string;
    stats: PlayerStats;
  };

  // Validation utilities
  formatRestrictionMessage: (restrictions: string[]) => string;
  getValidationIcon: (result: EquipmentValidationResult) => string;
  getValidationColor: (result: EquipmentValidationResult) => string;
}

export function useEquipmentValidation(): UseEquipmentValidationReturn {
  const { gameState } = useGameState();

  // Extract player information for validation
  const playerInfo = useMemo(() => ({
    level: gameState?.player?.level || 1,
    class: gameState?.player?.playerClass || 'adventurer',
    stats: gameState?.player?.stats || {
      attack: 10,
      defense: 10,
      magicAttack: 10,
      magicDefense: 10,
      speed: 10,
      accuracy: 85
    }
  }), [gameState]);

  // Main validation function
  const validateEquipment = useCallback((
    item: EnhancedItem,
    slot: EquipmentSlot
  ): EquipmentValidationResult => {
    const compatibility = checkEquipmentCompatibility(
      item,
      slot,
      playerInfo.level,
      playerInfo.class,
      playerInfo.stats
    );

    const hasBlockers = !compatibility.compatible;
    const hasWarnings = compatibility.warnings.length > 0;
    const canEquip = compatibility.compatible;

    // Generate validation message
    let validationMessage = '';
    let validationLevel: 'success' | 'warning' | 'error' = 'success';

    if (hasBlockers) {
      validationMessage = `Cannot equip: ${compatibility.unmetRequirements[0]}`;
      if (compatibility.unmetRequirements.length > 1) {
        validationMessage += ` (and ${compatibility.unmetRequirements.length - 1} more)`;
      }
      validationLevel = 'error';
    } else if (hasWarnings) {
      validationMessage = `Can equip with warning: ${compatibility.warnings[0]}`;
      if (compatibility.warnings.length > 1) {
        validationMessage += ` (and ${compatibility.warnings.length - 1} more)`;
      }
      validationLevel = 'warning';
    } else {
      validationMessage = 'Item can be equipped without restrictions';
      validationLevel = 'success';
    }

    return {
      canEquip,
      compatibility,
      hasWarnings,
      hasBlockers,
      validationMessage,
      validationLevel
    };
  }, [playerInfo]);

  // Validate multiple items at once
  const validateBulkEquipment = useCallback((
    items: Array<{ item: EnhancedItem; slot: EquipmentSlot }>
  ): EquipmentValidationResult[] => {
    return items.map(({ item, slot }) => validateEquipment(item, slot));
  }, [validateEquipment]);

  // Quick compatibility check
  const canEquipItem = useCallback((
    item: EnhancedItem,
    slot: EquipmentSlot
  ): boolean => {
    return validateEquipment(item, slot).canEquip;
  }, [validateEquipment]);

  // Get simple restriction message
  const getRestrictionMessage = useCallback((
    item: EnhancedItem,
    slot: EquipmentSlot
  ): string => {
    return validateEquipment(item, slot).validationMessage;
  }, [validateEquipment]);

  // Format restriction list for display
  const formatRestrictionMessage = useCallback((restrictions: string[]): string => {
    if (restrictions.length === 0) return '';
    if (restrictions.length === 1) return restrictions[0];

    const first = restrictions[0];
    const remaining = restrictions.length - 1;
    return `${first} (and ${remaining} more restriction${remaining > 1 ? 's' : ''})`;
  }, []);

  // Get appropriate icon for validation result
  const getValidationIcon = useCallback((result: EquipmentValidationResult): string => {
    if (result.hasBlockers) return '❌';
    if (result.hasWarnings) return '⚠️';
    return '✅';
  }, []);

  // Get appropriate color for validation result
  const getValidationColor = useCallback((result: EquipmentValidationResult): string => {
    if (result.hasBlockers) return '#ef4444';
    if (result.hasWarnings) return '#f59e0b';
    return '#10b981';
  }, []);

  return {
    // Validation functions
    validateEquipment,
    validateBulkEquipment,

    // Quick validation checks
    canEquipItem,
    getRestrictionMessage,

    // Player info
    playerInfo,

    // Utilities
    formatRestrictionMessage,
    getValidationIcon,
    getValidationColor
  };
}