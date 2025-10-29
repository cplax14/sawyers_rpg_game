/**
 * Store, Services, and Trading System Type Definitions
 *
 * Comprehensive type system for shops, NPC trades, transactions, and economy.
 * Ages 7-12 appropriate with friendly shopkeepers and helpful interfaces.
 */

import { Item, PlayerStats } from './game';
import { EnhancedItem } from './inventory';

// =============================================================================
// SHOP TYPES AND ENUMS
// =============================================================================

/**
 * Five specialized shop types in the game
 */
export type ShopType =
  | 'general' // General Store: consumables, materials, basic items
  | 'weapon' // Weapon Shop: melee weapons, bows, staffs
  | 'armor' // Armor Shop: armor, shields, defensive equipment
  | 'magic' // Magic Shop: spells, magic accessories, magical items
  | 'apothecary'; // Apothecary/Alchemy: potions, ingredients, crafting materials

/**
 * Shop discovery and unlock status
 */
export type ShopStatus = 'undiscovered' | 'discovered' | 'unlocked';

/**
 * Transaction types for shop operations
 */
export type TransactionType = 'buy' | 'sell';

/**
 * Transaction result status
 */
export type TransactionStatus =
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'insufficient_funds'
  | 'inventory_full';

// =============================================================================
// SHOPKEEPER PERSONALITY
// =============================================================================

/**
 * Shopkeeper mood affects dialogue and presentation
 */
export type ShopkeeperMood = 'happy' | 'neutral' | 'grumpy' | 'excited' | 'helpful';

/**
 * Shopkeeper dialogue configuration
 */
export interface ShopkeeperDialog {
  /** Greeting message when player enters shop */
  greeting: string;

  /** Message displayed after successful purchase */
  buyDialogue: string;

  /** Message displayed after successful sale */
  sellDialogue: string;

  /** Message when player browses but doesn't buy */
  browsing?: string;

  /** Message when player leaves shop */
  farewell?: string;

  /** Special dialogue for first-time visitors */
  firstVisit?: string;

  /** Helpful tips about items or gameplay */
  tips?: string[];

  /** Encouragement messages (age-appropriate) */
  encouragement?: string[];
}

/**
 * Shopkeeper NPC information
 */
export interface Shopkeeper {
  /** Shopkeeper's name (e.g., "Rosie the Shopkeeper") */
  name: string;

  /** Current mood affecting dialogue tone */
  mood: ShopkeeperMood;

  /** All dialogue options for this shopkeeper */
  dialogue: ShopkeeperDialog;

  /** Visual representation (emoji or sprite path) */
  avatar?: string;

  /** Background story or flavor text */
  backstory?: string;
}

// =============================================================================
// SHOP DEFINITION
// =============================================================================

/**
 * Complete shop definition with location, inventory, and NPC data
 */
export interface Shop {
  /** Unique shop identifier (e.g., "mistwood-general-store") */
  id: string;

  /** Creative, character-driven name (e.g., "Rosie's Remedies & Rarities") */
  name: string;

  /** Type of shop determining what items it buys/sells */
  type: ShopType;

  /** Area ID where shop is located */
  location: string;

  /** Shopkeeper NPC information */
  shopkeeper: Shopkeeper;

  /** Item categories this shop will purchase from player */
  buysCategories: string[];

  /** Discovery and unlock requirements */
  unlockRequirements?: ShopUnlockRequirements;

  /** Current status in player's game */
  status?: ShopStatus;

  /** Shop-specific pricing modifiers */
  pricingModifiers?: ShopPricingModifiers;

  /** Visual theme for shop UI */
  theme?: ShopTheme;

  /** Whether shop is hidden/special */
  hidden?: boolean;
}

/**
 * Requirements to unlock a shop
 */
export interface ShopUnlockRequirements {
  /** Minimum player level required */
  level?: number;

  /** Story chapter that must be completed */
  storyProgress?: number;

  /** Specific area that must be completed */
  areaCompletion?: string;

  /** Area exploration percentage threshold for discovery */
  explorationThreshold?: number;

  /** Quest that must be completed */
  questRequired?: string;
}

/**
 * Shop-specific pricing adjustments
 */
export interface ShopPricingModifiers {
  /** Multiplier for buy prices (e.g., 1.2 = 20% more expensive) */
  buyMultiplier: number;

  /** Multiplier for sell prices (e.g., 0.5 = 50% of value) */
  sellMultiplier: number;

  /** Discount available to player (0.0-1.0) */
  discount?: number;
}

/**
 * Visual theming for shop UI
 */
export interface ShopTheme {
  /** Primary color for UI elements */
  primaryColor: string;

  /** Secondary color for accents */
  secondaryColor: string;

  /** Background image or pattern */
  background?: string;

  /** Icon representing the shop */
  icon: string;
}

// =============================================================================
// SHOP INVENTORY
// =============================================================================

/**
 * Individual item listing in shop inventory
 */
export interface ShopInventoryItem {
  /** Item ID from ItemData */
  itemId: string;

  /** Price in gold (overrides default if specified) */
  price?: number;

  /** Sell-back price (typically 40-50% of buy price) */
  sellPrice?: number;

  /** Stock quantity (-1 for unlimited) */
  stock: number;

  /** Unlock requirements for this specific item */
  unlockRequirements?: ItemUnlockRequirements;

  /** Whether item is currently visible/unlocked */
  unlocked?: boolean;

  /** Whether item is featured/highlighted */
  featured?: boolean;

  /** Limited-time availability */
  availability?: ItemAvailability;
}

/**
 * Requirements to unlock an item in shop
 */
export interface ItemUnlockRequirements {
  /** Minimum player level */
  level?: number;

  /** Story progress required */
  storyChapter?: number;

  /** Area that must be completed */
  areaCompletion?: string;

  /** Quest that must be completed */
  questCompletion?: string;

  /** Other items that must be purchased first */
  previousPurchases?: string[];
}

/**
 * Time-based or conditional item availability
 */
export interface ItemAvailability {
  /** Start date for availability */
  startDate?: Date;

  /** End date for availability */
  endDate?: Date;

  /** Days of week available (0=Sunday, 6=Saturday) */
  daysOfWeek?: number[];

  /** Custom condition check */
  condition?: string;
}

/**
 * Complete shop inventory mapping
 */
export interface ShopInventory {
  /** Shop ID this inventory belongs to */
  shopId: string;

  /** All items available in this shop */
  items: ShopInventoryItem[];

  /** When inventory was last restocked */
  lastRestocked?: Date;

  /** How often inventory restocks (in hours) */
  restockInterval?: number;
}

// =============================================================================
// NPC TRADING SYSTEM
// =============================================================================

/**
 * Type of NPC trade
 */
export type TradeType = 'barter' | 'quest';

/**
 * Trade repeatability
 */
export type TradeRepeatability = 'one_time' | 'repeatable' | 'daily' | 'weekly';

/**
 * Trade requirement condition
 */
export interface TradeRequirement {
  /** Type of requirement */
  type: 'item' | 'level' | 'quest' | 'story' | 'area';

  /** Specific requirement identifier */
  id?: string;

  /** Quantity required (for items) */
  quantity?: number;

  /** Minimum value required (for level) */
  value?: number;

  /** Human-readable description */
  description: string;
}

/**
 * Items required for a trade
 */
export interface TradeItemRequirement {
  /** Item ID from ItemData */
  itemId: string;

  /** Quantity needed */
  quantity: number;

  /** Whether item is consumed in trade */
  consumed: boolean;
}

/**
 * Items offered by NPC in trade
 */
export interface TradeItemOffer {
  /** Item ID from ItemData */
  itemId: string;

  /** Quantity given */
  quantity: number;

  /** Chance of receiving item (0.0-1.0, default 1.0) */
  chance?: number;
}

/**
 * Complete NPC trade definition
 */
export interface NPCTrade {
  /** Unique trade identifier */
  id: string;

  /** NPC offering the trade */
  npcName: string;

  /** Type of trade (barter or quest-based) */
  type: TradeType;

  /** How often this trade can be completed */
  repeatability: TradeRepeatability;

  /** Items player must provide */
  requiredItems: TradeItemRequirement[];

  /** Items NPC will give in exchange */
  offeredItems: TradeItemOffer[];

  /** Gold required from player (optional) */
  goldRequired?: number;

  /** Gold offered by NPC (optional) */
  goldOffered?: number;

  /** Prerequisites to unlock this trade */
  requirements?: TradeRequirement[];

  /** NPC dialogue for this specific trade */
  dialogue: string;

  /** Area where this trade is available */
  location: string;

  /** Whether trade is currently available to player */
  available?: boolean;

  /** Whether player has completed this trade (for one-time trades) */
  completed?: boolean;

  /** Last completion time (for repeatable trades) */
  lastCompleted?: Date;

  /** Cooldown in milliseconds before trade can be repeated */
  cooldown?: number;
}

// =============================================================================
// TRANSACTION SYSTEM
// =============================================================================

/**
 * Transaction details for audit/history
 */
export interface Transaction {
  /** Unique transaction ID */
  id: string;

  /** Type of transaction */
  type: TransactionType;

  /** Shop ID (if shop transaction) */
  shopId?: string;

  /** NPC trade ID (if NPC trade) */
  tradeId?: string;

  /** Item involved in transaction */
  item: EnhancedItem | Item;

  /** Quantity transacted */
  quantity: number;

  /** Gold amount (positive for sell, negative for buy) */
  goldAmount: number;

  /** Timestamp of transaction */
  timestamp: Date;

  /** Player level at time of transaction */
  playerLevel: number;

  /** Transaction status */
  status: TransactionStatus;

  /** Error message if transaction failed */
  error?: string;
}

/**
 * Result of a transaction operation
 */
export interface TransactionResult {
  /** Whether transaction succeeded */
  success: boolean;

  /** Status code */
  status: TransactionStatus;

  /** Transaction details (if successful) */
  transaction?: Transaction;

  /** Updated player gold balance */
  newGoldBalance: number;

  /** Updated inventory (affected items only) */
  updatedInventory?: EnhancedItem[];

  /** User-friendly message to display */
  message: string;

  /** Detailed error information */
  error?: TransactionError;

  /** Effects applied (stat changes, etc.) */
  effects?: TransactionEffect[];
}

/**
 * Transaction error details
 */
export interface TransactionError {
  /** Error code for programmatic handling */
  code: string;

  /** Category of error */
  category: 'validation' | 'inventory' | 'economy' | 'requirement' | 'system';

  /** Human-readable error message */
  message: string;

  /** Suggested action to resolve error */
  suggestion?: string;

  /** Additional context data */
  context?: Record<string, any>;
}

/**
 * Effects resulting from a transaction
 */
export interface TransactionEffect {
  /** Type of effect */
  type: 'stat_change' | 'item_acquired' | 'item_removed' | 'gold_change' | 'achievement';

  /** Description of effect */
  description: string;

  /** Value or data associated with effect */
  value: any;

  /** Whether effect is temporary */
  temporary?: boolean;

  /** Duration in milliseconds (if temporary) */
  duration?: number;
}

// =============================================================================
// SHOP STATE AND MANAGEMENT
// =============================================================================

/**
 * Player's shop state tracking
 */
export interface PlayerShopState {
  /** Shops discovered by player */
  discoveredShops: string[];

  /** Shops unlocked and accessible */
  unlockedShops: string[];

  /** Currently opened shop (null if none) */
  currentShop: string | null;

  /** Cached shop inventories for performance */
  shopInventoryCache: Record<string, ShopInventory>;

  /** Recent transaction history (last 10) */
  transactionHistory: Transaction[];

  /** Completed one-time NPC trades */
  completedTrades: string[];

  /** Active repeatable trade cooldowns */
  tradeCooldowns: Record<string, Date>;

  /** Whether player has completed shop tutorial */
  shopTutorialCompleted: boolean;

  /** Whether player has completed trade tutorial */
  tradeTutorialCompleted: boolean;

  /** Favorite shops for quick access */
  favoriteShops?: string[];

  /** Total lifetime spending (for achievements) */
  totalGoldSpent?: number;

  /** Total lifetime earnings from sales */
  totalGoldEarned?: number;
}

/**
 * Shop UI state
 */
export interface ShopUIState {
  /** Current view mode */
  mode: 'buy' | 'sell';

  /** Active category filter */
  activeCategory: string;

  /** Search query for items */
  searchQuery: string;

  /** Sort option */
  sortBy: ShopSortOption;

  /** Selected item for preview/transaction */
  selectedItem: ShopInventoryItem | null;

  /** Whether transaction modal is open */
  transactionModalOpen: boolean;

  /** Whether tutorial overlay is active */
  tutorialActive: boolean;

  /** Current tutorial step (0-based) */
  tutorialStep: number;
}

/**
 * Sort options for shop inventory
 */
export type ShopSortOption =
  | 'name' // Alphabetical by name
  | 'price_asc' // Lowest to highest price
  | 'price_desc' // Highest to lowest price
  | 'rarity' // By rarity tier
  | 'level' // By level requirement
  | 'type' // By item type/category
  | 'recently_added'; // Newest items first

// =============================================================================
// VALIDATION AND UTILITY TYPES
// =============================================================================

/**
 * Shop transaction validation result
 */
export interface TransactionValidation {
  /** Whether transaction can proceed */
  valid: boolean;

  /** Blocking errors preventing transaction */
  errors: string[];

  /** Non-blocking warnings */
  warnings: string[];

  /** Helpful suggestions */
  suggestions: string[];

  /** Detailed validation results */
  details?: ValidationDetail[];
}

/**
 * Detailed validation information
 */
export interface ValidationDetail {
  /** Field or aspect being validated */
  field: string;

  /** Whether this validation passed */
  passed: boolean;

  /** Expected value or condition */
  expected: any;

  /** Actual value */
  actual: any;

  /** Validation message */
  message: string;
}

/**
 * Economy balance configuration
 */
export interface EconomyConfig {
  /** Starting gold for new players */
  startingGold: number;

  /** Target gold earning rate (per hour) */
  targetGoldPerHour: [number, number]; // [min, max]

  /** Default sell price multiplier */
  defaultSellMultiplier: number;

  /** Maximum gold a player can carry */
  maxGold: number;

  /** Minimum gold threshold (safety for kids) */
  minGoldWarning: number;

  /** Shop type pricing modifiers */
  shopTypeModifiers: Record<ShopType, ShopPricingModifiers>;
}

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard to check if an object is a Shop
 */
export function isShop(obj: any): obj is Shop {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.location === 'string' &&
    typeof obj.shopkeeper === 'object'
  );
}

/**
 * Type guard to check if an object is an NPCTrade
 */
export function isNPCTrade(obj: any): obj is NPCTrade {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.npcName === 'string' &&
    typeof obj.type === 'string' &&
    Array.isArray(obj.requiredItems) &&
    Array.isArray(obj.offeredItems)
  );
}

/**
 * Type guard to check if an object is a TransactionResult
 */
export function isTransactionResult(obj: any): obj is TransactionResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.success === 'boolean' &&
    typeof obj.status === 'string' &&
    typeof obj.newGoldBalance === 'number' &&
    typeof obj.message === 'string'
  );
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default economy configuration values
 */
export const DEFAULT_ECONOMY_CONFIG: EconomyConfig = {
  startingGold: 100,
  targetGoldPerHour: [1000, 2000],
  defaultSellMultiplier: 0.5, // 50% of buy price
  maxGold: 999999,
  minGoldWarning: 100,
  shopTypeModifiers: {
    general: { buyMultiplier: 1.0, sellMultiplier: 0.5 },
    weapon: { buyMultiplier: 1.1, sellMultiplier: 0.45 },
    armor: { buyMultiplier: 1.1, sellMultiplier: 0.45 },
    magic: { buyMultiplier: 1.2, sellMultiplier: 0.4 },
    apothecary: { buyMultiplier: 1.0, sellMultiplier: 0.5 },
  },
};

/**
 * Maximum items in transaction history
 */
export const MAX_TRANSACTION_HISTORY = 10;

/**
 * Maximum inventory capacity
 */
export const MAX_INVENTORY_SIZE = 50;

/**
 * Shop category display names
 */
export const SHOP_CATEGORY_NAMES: Record<string, string> = {
  all: 'All Items',
  weapons: 'Weapons',
  armor: 'Armor',
  consumables: 'Consumables',
  materials: 'Materials',
  magic: 'Magic Items',
  accessories: 'Accessories',
  quest: 'Quest Items',
};

/**
 * Shop type display information
 */
export const SHOP_TYPE_INFO: Record<ShopType, { name: string; icon: string; description: string }> =
  {
    general: {
      name: 'General Store',
      icon: '🏪',
      description: 'Consumables, materials, and everyday items',
    },
    weapon: {
      name: 'Weapon Shop',
      icon: '⚔️',
      description: 'Swords, bows, staffs, and weapons',
    },
    armor: {
      name: 'Armor Shop',
      icon: '🛡️',
      description: 'Armor, shields, and protective gear',
    },
    magic: {
      name: 'Magic Shop',
      icon: '✨',
      description: 'Spells, enchanted items, and magical accessories',
    },
    apothecary: {
      name: 'Apothecary',
      icon: '⚗️',
      description: 'Potions, herbs, and alchemical ingredients',
    },
  };
