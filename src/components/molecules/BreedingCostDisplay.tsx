import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { HelpTooltip } from '../atoms/HelpTooltip';
import { BreedingCost } from '../../types/breeding';

interface BreedingCostDisplayProps {
  cost: BreedingCost;
  playerGold: number;
  playerMaterials: Record<string, number>;
  showBreakdown?: boolean;
}

const costStyles = {
  container: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '2px solid rgba(212, 175, 55, 0.3)',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: '1rem',
    textAlign: 'center' as const,
  },
  section: {
    marginBottom: '1rem',
  },
  sectionTitle: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: '0.5rem',
  },
  goldRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    background: 'rgba(255, 215, 0, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 215, 0, 0.3)',
  },
  goldLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  goldAmount: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
  goldIcon: {
    fontSize: '1.5rem',
  },
  sufficient: {
    color: '#22c55e',
  },
  insufficient: {
    color: '#ef4444',
  },
  breakdown: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    fontSize: '0.85rem',
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.25rem 0',
    color: '#94a3b8',
  },
  breakdownLabel: {
    color: '#94a3b8',
  },
  breakdownValue: {
    color: '#f4f4f4',
    fontWeight: '500',
  },
  breakdownTotal: {
    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
    fontWeight: 'bold',
    color: '#d4af37',
  },
  materialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '0.75rem',
  },
  materialCard: {
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    alignItems: 'center',
  },
  materialIcon: {
    fontSize: '2rem',
  },
  materialName: {
    fontSize: '0.85rem',
    fontWeight: '500',
    textAlign: 'center' as const,
  },
  materialQuantity: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
  },
  playerInventory: {
    marginTop: '0.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
    fontSize: '0.85rem',
  },
  inventoryLabel: {
    color: '#94a3b8',
  },
  inventoryValue: {
    fontWeight: 'bold',
  },
  noMaterials: {
    textAlign: 'center' as const,
    padding: '1rem',
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
};

export const BreedingCostDisplay: React.FC<BreedingCostDisplayProps> = ({
  cost,
  playerGold,
  playerMaterials,
  showBreakdown = true,
}) => {
  const hasEnoughGold = useMemo(() => {
    return playerGold >= cost.goldAmount;
  }, [playerGold, cost.goldAmount]);

  const materialAvailability = useMemo(() => {
    return cost.materials.map(material => {
      const available = playerMaterials[material.itemId] || 0;
      const hasEnough = available >= material.quantity;
      return {
        ...material,
        available,
        hasEnough,
      };
    });
  }, [cost.materials, playerMaterials]);

  const allMaterialsAvailable = useMemo(() => {
    return materialAvailability.every(m => m.hasEnough);
  }, [materialAvailability]);

  return (
    <motion.div
      style={costStyles.container}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div style={costStyles.title}>
        Breeding Cost
        <HelpTooltip
          title="Breeding Costs"
          content="Costs increase with parent level, rarity, generation, and breeding count. Both parents gain exhaustion (-20% stats per level) after breeding. Use Revitalization Potions to restore them!"
          position="bottom"
          maxWidth={280}
          style={{ marginLeft: '0.5rem' }}
        />
      </div>

      {/* Gold Cost */}
      <div style={costStyles.section}>
        <div style={costStyles.goldRow}>
          <div style={costStyles.goldLabel}>
            <span style={costStyles.goldIcon}>💰</span>
            <span>Gold Required:</span>
          </div>
          <div
            style={{
              ...costStyles.goldAmount,
              ...(hasEnoughGold ? costStyles.sufficient : costStyles.insufficient),
            }}
          >
            {cost.goldAmount.toLocaleString()}
          </div>
        </div>

        {/* Cost Breakdown */}
        {showBreakdown && (
          <div style={costStyles.breakdown}>
            <div style={costStyles.breakdownRow}>
              <span style={costStyles.breakdownLabel}>Base Cost:</span>
              <span style={costStyles.breakdownValue}>{cost.costBreakdown.baseCost.toLocaleString()}</span>
            </div>
            <div style={costStyles.breakdownRow}>
              <span style={costStyles.breakdownLabel}>Rarity Multiplier:</span>
              <span style={costStyles.breakdownValue}>×{cost.costBreakdown.rarityMultiplier.toFixed(1)}</span>
            </div>
            <div style={costStyles.breakdownRow}>
              <span style={costStyles.breakdownLabel}>Generation Tax:</span>
              <span style={costStyles.breakdownValue}>×{cost.costBreakdown.generationMultiplier.toFixed(1)}</span>
            </div>
            <div style={costStyles.breakdownRow}>
              <span style={costStyles.breakdownLabel}>Breeding Count Tax:</span>
              <span style={costStyles.breakdownValue}>×{cost.costBreakdown.breedingCountMultiplier.toFixed(2)}</span>
            </div>
            <div style={{ ...costStyles.breakdownRow, ...costStyles.breakdownTotal }}>
              <span>Total Gold:</span>
              <span>{cost.costBreakdown.totalGold.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Player's Gold */}
        <div style={costStyles.playerInventory}>
          <span style={costStyles.inventoryLabel}>Your Gold:</span>
          <span
            style={{
              ...costStyles.inventoryValue,
              ...(hasEnoughGold ? costStyles.sufficient : costStyles.insufficient),
            }}
          >
            {playerGold.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Materials */}
      {cost.materials.length > 0 && (
        <div style={costStyles.section}>
          <div style={costStyles.sectionTitle}>Required Materials</div>
          <div style={costStyles.materialsGrid}>
            {materialAvailability.map((material, index) => (
              <motion.div
                key={material.itemId}
                style={{
                  ...costStyles.materialCard,
                  borderColor: material.hasEnough
                    ? 'rgba(34, 197, 94, 0.5)'
                    : 'rgba(239, 68, 68, 0.5)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <div style={costStyles.materialIcon}>📦</div>
                <div style={costStyles.materialName}>{material.name}</div>
                <div
                  style={{
                    ...costStyles.materialQuantity,
                    ...(material.hasEnough ? costStyles.sufficient : costStyles.insufficient),
                  }}
                >
                  {material.available} / {material.quantity}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {cost.materials.length === 0 && (
        <div style={costStyles.noMaterials}>
          No special materials required - gold only!
        </div>
      )}
    </motion.div>
  );
};

export default BreedingCostDisplay;
