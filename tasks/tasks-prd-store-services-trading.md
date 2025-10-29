# Task List: Store, Services, and Trading System

Generated from: `prd-store-services-trading.md`
Created: 2025-10-27

## Overview

This task list implements a comprehensive store, services, and trading system for Sawyer's RPG Game. The system includes 5 specialized shop types (General Store, Weapon Shop, Armor Shop, Magic Shop, Apothecary), location-based shop discovery, buy/sell mechanics, NPC trading, and full integration with existing game systems.

## Relevant Files

### Data Files (New)
- `public/data/shops.js` - Shop definitions with locations, types, and shopkeeper information
- `public/data/shop-inventory.js` - Item listings for each shop with unlock requirements
- `public/data/npc-trades.js` - NPC trade definitions (barter and quest-based)

### Data Files (Modified)
- `public/data/items.js` - Add `sellPrice` field to all items for sell-back functionality
- `public/data/monsters.js` - Add gold drop amounts to ensure 1000-2000 gold/hour earning rate
- `public/data/areas.js` - Add shop locations and discovery requirements

### Types
- `src/types/shop.ts` - TypeScript interfaces for Shop, ShopInventory, NPCTrade, Transaction
- `src/types/shop.test.ts` - Type validation tests

### Context/State Management
- `src/contexts/ReactGameContext.tsx` - Extend state with shop data, add reducer actions for transactions

### Utilities
- `src/utils/shopSystem.ts` - Core shop logic (unlock checks, transaction processing, inventory filtering)
- `src/utils/shopSystem.test.ts` - Unit tests for shop system logic
- `src/utils/economyBalance.ts` - Economy calculations (pricing, gold earning rates, unlock thresholds)
- `src/utils/economyBalance.test.ts` - Unit tests for economy balance
- `src/utils/dataLoader.ts` - Add shop data loading functions

### Custom Hooks
- `src/hooks/useShop.ts` - Hook for shop state and operations (buy, sell, view inventory, unlock checks)
- `src/hooks/useShop.test.tsx` - Hook tests
- `src/hooks/useNPCTrades.ts` - Hook for NPC trading functionality
- `src/hooks/useNPCTrades.test.tsx` - Hook tests

### Components - Atoms
- `src/components/atoms/PriceTag.tsx` - Gold price display component
- `src/components/atoms/PriceTag.test.tsx` - Unit tests
- `src/components/atoms/GoldBalance.tsx` - Player gold balance display
- `src/components/atoms/GoldBalance.test.tsx` - Unit tests

### Components - Molecules
- `src/components/molecules/ItemListing.tsx` - Individual shop item display with buy/sell options
- `src/components/molecules/ItemListing.test.tsx` - Unit tests
- `src/components/molecules/ShopkeeperDialog.tsx` - NPC dialogue box for shopkeepers
- `src/components/molecules/ShopkeeperDialog.test.tsx` - Unit tests
- `src/components/molecules/TransactionModal.tsx` - Buy/sell confirmation modal
- `src/components/molecules/TransactionModal.test.tsx` - Unit tests
- `src/components/molecules/ShopCategoryFilter.tsx` - Category filter for shop inventory
- `src/components/molecules/ShopCategoryFilter.test.tsx` - Unit tests
- `src/components/molecules/NPCTradeCard.tsx` - Display for individual NPC trade offers
- `src/components/molecules/NPCTradeCard.test.tsx` - Unit tests

### Components - Organisms
- `src/components/organisms/ShopInterface.tsx` - Main shop UI container
- `src/components/organisms/ShopInterface.test.tsx` - Integration tests
- `src/components/organisms/NPCTradeInterface.tsx` - NPC trading UI
- `src/components/organisms/NPCTradeInterface.test.tsx` - Integration tests
- `src/components/organisms/ShopTutorial.tsx` - First-time shop tutorial overlay
- `src/components/organisms/ShopTutorial.test.tsx` - Unit tests

### Modified Components
- `src/components/organisms/AreaExploration.tsx` - Add shop interaction points during exploration
- `src/components/organisms/WorldMap.tsx` - Show discovered shop locations on map (if applicable)

### Integration Files
- `src/ReactApp.tsx` - Wire up shop screens to main app navigation

### Notes
- All test files should be created alongside their corresponding implementation files
- Use `npm test` to run Jest unit tests
- Use `npm run test:headless` for end-to-end Puppeteer tests
- Follow atomic design pattern: atoms → molecules → organisms
- Ensure all shop content is age-appropriate (ages 7-12)
- Maintain backwards compatibility with existing save files

---

## Tasks

- [ ] 1.0 Set up data structures and type definitions
  - [ ] 1.1 Create `src/types/shop.ts` with TypeScript interfaces for `Shop`, `ShopInventory`, `ShopType`, `ShopkeeperDialog`, `TransactionType`, and `TransactionResult`
  - [ ] 1.2 Add `NPCTrade`, `TradeRequirement`, `TradeType` (barter/quest) interfaces to `src/types/shop.ts`
  - [ ] 1.3 Create `src/types/shop.test.ts` with tests validating type structure and ensuring required fields are present
  - [ ] 1.4 Create `public/data/shops.js` with vanilla JS shop definitions following existing data file patterns (use `const ShopData = { ... }`)
  - [ ] 1.5 Define 5 shop types in `shops.js`: General Store, Weapon Shop, Armor Shop, Magic Shop, Apothecary with unique shopkeeper names and personalities
  - [ ] 1.6 Create `public/data/shop-inventory.js` with item listings mapped to shop IDs, including unlock requirements (level-based and story-based)
  - [ ] 1.7 Create `public/data/npc-trades.js` with NPC trade definitions (3-5 barter trades, 3-5 quest-based trades) using age-appropriate dialogue
  - [ ] 1.8 Update `public/data/items.js` to add `sellPrice` field to all existing items (typically 40-50% of purchase value)
  - [ ] 1.9 Update `public/data/monsters.js` to add `goldDropMin` and `goldDropMax` fields ensuring 1000-2000 gold/hour earning rate based on encounter frequency
  - [ ] 1.10 Update `public/data/areas.js` to add `shopIds` array to town-type areas and `discoveredShops` tracking

- [ ] 2.0 Implement core shop system logic and utilities
  - [ ] 2.1 Create `src/utils/shopSystem.ts` with pure functions for shop operations (no React dependencies)
  - [ ] 2.2 Implement `canUnlockShop(player, shop)` function checking level, story progression, and area discovery requirements
  - [ ] 2.3 Implement `filterShopInventory(shop, player)` function returning only items player can see based on unlock requirements
  - [ ] 2.4 Implement `canAffordItem(player, item, quantity)` function checking if player has sufficient gold
  - [ ] 2.5 Implement `calculateSellPrice(item, quantity)` function with base sell price calculation (typically 40-50% of value)
  - [ ] 2.6 Implement `processBuyTransaction(player, item, quantity)` function returning updated player state and transaction result
  - [ ] 2.7 Implement `processSellTransaction(player, item, quantity)` function with inventory removal and gold addition
  - [ ] 2.8 Implement `validateTransaction(player, item, quantity, transactionType)` function with comprehensive error checking
  - [ ] 2.9 Create `src/utils/shopSystem.test.ts` with Jest unit tests for all shop system functions (min 80% coverage)
  - [ ] 2.10 Test edge cases: zero gold, max gold (prevent overflow), selling items not owned, buying with insufficient space
  - [ ] 2.11 Create `src/utils/economyBalance.ts` with economy calculation functions
  - [ ] 2.12 Implement `calculateItemPricing(baseValue, shopType, playerLevel)` function with shop type modifiers (Magic Shop +20%, Weapon Shop +10%)
  - [ ] 2.13 Implement `calculateGoldEarningRate(areas)` function to validate 1000-2000 gold/hour target across all areas
  - [ ] 2.14 Implement `getUnlockThresholds(shopType)` function returning level requirements for shop tiers
  - [ ] 2.15 Create `src/utils/economyBalance.test.ts` with tests validating economy balance across all shop types and player levels
  - [ ] 2.16 Update `src/utils/dataLoader.ts` to add `loadShopData()`, `loadShopInventory()`, and `loadNPCTrades()` functions following existing patterns
  - [ ] 2.17 Create `src/hooks/useShop.ts` custom hook wrapping shop system utilities with React integration
  - [ ] 2.18 Implement `useShop(shopId)` hook returning shop data, filtered inventory, buy/sell functions, and loading state
  - [ ] 2.19 Use `useGameState()` hook inside `useShop` to access player state and dispatch actions
  - [ ] 2.20 Implement `useCallback` for buy/sell functions to prevent unnecessary re-renders
  - [ ] 2.21 Implement `useMemo` for filtered inventory to optimize performance
  - [ ] 2.22 Create `src/hooks/useShop.test.tsx` with tests for hook behavior and state integration

- [ ] 3.0 Extend game state management for shops
  - [ ] 3.1 Update `src/contexts/ReactGameContext.tsx` to add `shops` array to game state with discovered/unlocked status
  - [ ] 3.2 Add `discoveredShops: string[]` and `unlockedShops: string[]` to game state
  - [ ] 3.3 Add `currentShop: string | null` to track which shop UI is currently open
  - [ ] 3.4 Add `shopInventoryCache: Record<string, ShopInventory[]>` to game state for performance optimization
  - [ ] 3.5 Create `DISCOVER_SHOP` action type and reducer case to add shop to discoveredShops array
  - [ ] 3.6 Create `UNLOCK_SHOP` action type and reducer case to add shop to unlockedShops array with validation
  - [ ] 3.7 Create `BUY_ITEM` action type and reducer case calling `processBuyTransaction` and updating player gold/inventory
  - [ ] 3.8 Create `SELL_ITEM` action type and reducer case calling `processSellTransaction` and updating player gold/inventory
  - [ ] 3.9 Create `OPEN_SHOP` and `CLOSE_SHOP` action types to manage shop UI state
  - [ ] 3.10 Add `transactionHistory: Transaction[]` to game state for tracking recent purchases/sales (last 10 transactions)
  - [ ] 3.11 Create `ADD_TRANSACTION` action type to add transaction to history with timestamp
  - [ ] 3.12 Update save/load system to persist shop state (discoveredShops, unlockedShops, transactionHistory)
  - [ ] 3.13 Test state updates with multiple sequential transactions and verify no gold/inventory corruption

- [ ] 4.0 Create UI components (atoms and molecules)
  - [ ] 4.1 Create `src/components/atoms/PriceTag.tsx` component displaying gold amount with coin icon
  - [ ] 4.2 Add props to PriceTag: `amount: number`, `size?: 'small' | 'medium' | 'large'`, `showIcon?: boolean`
  - [ ] 4.3 Style PriceTag with gold color (#FFD700) and ensure readability on light/dark backgrounds
  - [ ] 4.4 Create `src/components/atoms/PriceTag.test.tsx` with tests for rendering, formatting (commas for thousands), and size variants
  - [ ] 4.5 Create `src/components/atoms/GoldBalance.tsx` component showing player's current gold with real-time updates
  - [ ] 4.6 Use `useGameState()` hook in GoldBalance to access `state.player.gold`
  - [ ] 4.7 Add visual indicator when gold changes (brief highlight animation using CSS transitions)
  - [ ] 4.8 Create `src/components/atoms/GoldBalance.test.tsx` with tests for correct gold display and update animation
  - [ ] 4.9 Create `src/components/molecules/ItemListing.tsx` component for individual shop item display
  - [ ] 4.10 Add props to ItemListing: `item: ReactItem`, `shopType: ShopType`, `mode: 'buy' | 'sell'`, `onTransaction: (item, quantity) => void`
  - [ ] 4.11 Display item name, description, rarity color-coding, stats preview, and price using PriceTag component
  - [ ] 4.12 Add quantity selector (1-99) with increment/decrement buttons for bulk transactions
  - [ ] 4.13 Show "Buy" or "Sell" button with disabled state if player cannot afford or doesn't own item
  - [ ] 4.14 Create `src/components/molecules/ItemListing.test.tsx` with tests for buy/sell modes and interaction handling
  - [ ] 4.15 Create `src/components/molecules/ShopkeeperDialog.tsx` component for NPC dialogue display
  - [ ] 4.16 Add props: `shopkeeper: string`, `message: string`, `mood?: 'happy' | 'neutral' | 'grumpy'`
  - [ ] 4.17 Display shopkeeper name, avatar/icon, and dialogue text in a speech bubble UI pattern
  - [ ] 4.18 Add random greeting messages based on shop type and time of day (morning/afternoon/evening)
  - [ ] 4.19 Create `src/components/molecules/ShopkeeperDialog.test.tsx` with tests for message rendering and mood variants
  - [ ] 4.20 Create `src/components/molecules/TransactionModal.tsx` confirmation modal for buy/sell actions
  - [ ] 4.21 Add props: `isOpen: boolean`, `item: ReactItem`, `quantity: number`, `transactionType: 'buy' | 'sell'`, `onConfirm: () => void`, `onCancel: () => void`
  - [ ] 4.22 Display transaction summary (item name, quantity, total price) and confirmation buttons
  - [ ] 4.23 Show warning if transaction will reduce gold below 100 (safety threshold for kids)
  - [ ] 4.24 Create `src/components/molecules/TransactionModal.test.tsx` with tests for confirmation flow and cancel handling
  - [ ] 4.25 Create `src/components/molecules/ShopCategoryFilter.tsx` for filtering shop inventory by item type
  - [ ] 4.26 Add props: `categories: string[]`, `activeCategory: string`, `onCategoryChange: (category) => void`
  - [ ] 4.27 Display category buttons (All, Weapons, Armor, Consumables, Materials) with active state highlighting
  - [ ] 4.28 Create `src/components/molecules/ShopCategoryFilter.test.tsx` with tests for category switching
  - [ ] 4.29 Create `src/components/molecules/NPCTradeCard.tsx` for displaying individual trade offers
  - [ ] 4.30 Add props: `trade: NPCTrade`, `canTrade: boolean`, `onTrade: (trade) => void`
  - [ ] 4.31 Display trade requirements (required items), offered items, and NPC dialogue in age-appropriate language
  - [ ] 4.32 Show progress indicator if trade is part of a quest chain
  - [ ] 4.33 Create `src/components/molecules/NPCTradeCard.test.tsx` with tests for trade requirements and completion state

- [ ] 5.0 Build main shop interface (organisms)
  - [ ] 5.1 Create `src/components/organisms/ShopInterface.tsx` main shop UI container component
  - [ ] 5.2 Add props: `shopId: string`, `onClose: () => void`
  - [ ] 5.3 Use `useShop(shopId)` custom hook to access shop data and operations
  - [ ] 5.4 Implement three-panel layout: shop inventory (left), item preview (center), player inventory (right)
  - [ ] 5.5 Add tab switching between "Buy" and "Sell" modes with clear visual indicators
  - [ ] 5.6 Display ShopkeeperDialog at top with contextual messages based on player actions
  - [ ] 5.7 Integrate ShopCategoryFilter for filtering shop inventory by type
  - [ ] 5.8 Display list of ItemListing components for shop inventory with scroll container (virtualize if >50 items)
  - [ ] 5.9 Show GoldBalance component prominently in shop header
  - [ ] 5.10 Add close button in top-right corner with confirmation if modal is open
  - [ ] 5.11 Implement keyboard navigation (Tab, Enter, Escape) for accessibility
  - [ ] 5.12 Add loading state while shop inventory is being filtered/loaded
  - [ ] 5.13 Display "Shop locked" message with unlock requirements if shop is not yet unlocked
  - [ ] 5.14 Create `src/components/organisms/ShopInterface.test.tsx` with integration tests for buy/sell flows
  - [ ] 5.15 Test error handling: buying with insufficient gold, selling items not owned, attempting to buy when inventory is full
  - [ ] 5.16 Test transaction success flow: gold deduction, inventory update, success message display

- [ ] 6.0 Implement NPC trading system
  - [ ] 6.1 Create `src/hooks/useNPCTrades.ts` custom hook for NPC trade functionality
  - [ ] 6.2 Implement `useNPCTrades()` hook returning available trades, completed trades, and `executeTrade()` function
  - [ ] 6.3 Add `getAvailableTrades(player, area)` function filtering trades by location and requirements
  - [ ] 6.4 Add `canExecuteTrade(player, trade)` function validating player has required items
  - [ ] 6.5 Add `executeTrade(trade)` function dispatching state update to remove required items and add offered items
  - [ ] 6.6 Create `src/hooks/useNPCTrades.test.tsx` with tests for trade validation and execution
  - [ ] 6.7 Create `src/components/organisms/NPCTradeInterface.tsx` UI for NPC trading
  - [ ] 6.8 Add props: `areaId: string`, `onClose: () => void`
  - [ ] 6.9 Use `useNPCTrades()` hook to get available trades for current area
  - [ ] 6.10 Display list of NPCTradeCard components for available trades
  - [ ] 6.11 Add NPC character portrait and dialogue box with trade-specific messages (age-appropriate, encouraging)
  - [ ] 6.12 Implement trade confirmation modal showing items required vs. items offered
  - [ ] 6.13 Show "Trade Complete!" success message with animation after successful trade
  - [ ] 6.14 Display "No trades available here" message when no NPCs have trades in current area
  - [ ] 6.15 Create `src/components/organisms/NPCTradeInterface.test.tsx` with integration tests for trade execution
  - [ ] 6.16 Test quest-based trades: ensure trade only appears after specific quest completion
  - [ ] 6.17 Test barter trades: validate item exchange and inventory updates
  - [ ] 6.18 Add trade history tracking to game state (last 5 completed trades) for quest system integration

- [ ] 7.0 Integrate shops into area exploration
  - [ ] 7.1 Update `src/components/organisms/AreaExploration.tsx` to detect shops in current area
  - [ ] 7.2 Check `state.currentArea.shopIds` array to determine if area has shops
  - [ ] 7.3 Add "Visit Shop" button to area actions when shop is discovered and unlocked
  - [ ] 7.4 Add "Investigate" button when shop exists but is not yet discovered (70% chance of discovery per investigation)
  - [ ] 7.5 Dispatch `DISCOVER_SHOP` action when player successfully discovers a shop
  - [ ] 7.6 Display shop discovery notification with shopkeeper introduction message (age-appropriate, welcoming)
  - [ ] 7.7 Add shop icon/marker on area exploration UI showing discovered shop locations
  - [ ] 7.8 Implement "Shop locked" visual indicator if shop is discovered but not unlocked (show unlock requirements on hover/tap)
  - [ ] 7.9 Open ShopInterface component in modal overlay when "Visit Shop" button is clicked
  - [ ] 7.10 Similarly add "Talk to Trader" button for areas with NPC trades, opening NPCTradeInterface
  - [ ] 7.11 Update `src/components/organisms/WorldMap.tsx` to show shop icons on town areas (if world map shows detailed POIs)
  - [ ] 7.12 Test shop discovery flow: investigate multiple times until discovery, then unlock when requirements met
  - [ ] 7.13 Test navigation: area exploration → shop interface → back to exploration without losing state

- [ ] 8.0 Add economy balancing and starting gold
  - [ ] 8.1 Update character creation in `src/components/organisms/CharacterSelection.tsx` to set starting gold (100-200 gold based on class)
  - [ ] 8.2 Add class-specific starting gold amounts (e.g., Knight: 150, Mage: 120, Ranger: 180)
  - [ ] 8.3 Update `public/data/monsters.js` gold drops to ensure 1000-2000 gold per hour earning rate
  - [ ] 8.4 Calculate gold drop rates: average combat time (30 seconds), encounter rate (70%), 60 minutes = 84 combats
  - [ ] 8.5 Set gold drops: common monsters 10-20g, uncommon 20-40g, rare 40-80g, boss 100-200g
  - [ ] 8.6 Test gold earning rates by simulating 1 hour of gameplay at different player levels (levels 1, 5, 10)
  - [ ] 8.7 Update `src/utils/economyBalance.ts` with functions to validate gold earning rates across all areas
  - [ ] 8.8 Add `getItemAffordabilityTimeline(item, playerLevel)` function calculating hours needed to afford item at current earning rate
  - [ ] 8.9 Ensure tier 1 items (100-500g) are affordable within 15-30 minutes of gameplay
  - [ ] 8.10 Ensure tier 2 items (500-1500g) are affordable within 1-2 hours of gameplay
  - [ ] 8.11 Ensure tier 3 items (1500-5000g) are affordable within 3-5 hours of gameplay
  - [ ] 8.12 Add gold rewards to quest completion (50-500g based on quest difficulty)
  - [ ] 8.13 Test economy balance by playing through first 3 areas and tracking gold earned vs. item costs
  - [ ] 8.14 Create economy balance report showing gold earning rates, item costs, and affordability timelines

- [ ] 9.0 Implement shop tutorial system
  - [ ] 9.1 Create `src/components/organisms/ShopTutorial.tsx` overlay component for first-time shop visit
  - [ ] 9.2 Add props: `isFirstVisit: boolean`, `onComplete: () => void`
  - [ ] 9.3 Implement multi-step tutorial: (1) Welcome to shops, (2) How to buy items, (3) How to sell items, (4) Understanding unlock requirements
  - [ ] 9.4 Use age-appropriate language (ages 7-12): "Welcome, young adventurer! Let me show you how shops work!"
  - [ ] 9.5 Add visual highlights/arrows pointing to relevant UI elements during each tutorial step
  - [ ] 9.6 Add "Next" and "Skip Tutorial" buttons with clear CTAs
  - [ ] 9.7 Track tutorial completion in game state (`shopTutorialCompleted: boolean`)
  - [ ] 9.8 Dispatch `COMPLETE_SHOP_TUTORIAL` action when tutorial is finished or skipped
  - [ ] 9.9 Create `src/components/organisms/ShopTutorial.test.tsx` with tests for tutorial flow and skip functionality
  - [ ] 9.10 Add tutorial trigger check in ShopInterface: show tutorial on first shop visit only
  - [ ] 9.11 Implement similar tutorial for NPC trading (`NPCTradeTutorial.tsx`) on first trade interaction
  - [ ] 9.12 Add help icon (?) in shop UI that reopens tutorial on demand for players who need a refresher
  - [ ] 9.13 Ensure tutorial state persists in save files so it doesn't repeat on every new game session
  - [ ] 9.14 Test tutorial flow: complete all steps, test skip functionality, verify doesn't show again after completion

- [ ] 10.0 Testing, polish, and documentation
  - [ ] 10.1 Run full test suite: `npm test` to execute all Jest unit tests
  - [ ] 10.2 Verify all tests pass with at least 80% code coverage for shop system utilities
  - [ ] 10.3 Run `npm run test:headless` to execute Puppeteer end-to-end tests
  - [ ] 10.4 Create end-to-end test scenario: character creation → explore area → discover shop → buy item → sell item → complete NPC trade
  - [ ] 10.5 Test save/load system: save game with shop progress, reload, verify shop state persists
  - [ ] 10.6 Test backwards compatibility: load old save files without shop data, ensure graceful handling with default values
  - [ ] 10.7 Perform accessibility audit: keyboard navigation, screen reader compatibility, color contrast checks
  - [ ] 10.8 Test on mobile devices: touch interactions, responsive layout, button sizes (min 44x44px)
  - [ ] 10.9 Test edge cases: buying item when inventory is full (show error), selling equipped items (prevent or warn)
  - [ ] 10.10 Verify all content is age-appropriate (ages 7-12): no scary shopkeepers, no mature themes, encouraging language throughout
  - [ ] 10.11 Add JSDoc comments to all public functions in shop system utilities
  - [ ] 10.12 Update CLAUDE.md with shop system documentation and architecture notes
  - [ ] 10.13 Create user-facing documentation: add "Shops & Trading" section to game help/guide
  - [ ] 10.14 Perform performance testing: test with 100+ items in shop inventory, ensure smooth scrolling and filtering
  - [ ] 10.15 Fix any TypeScript errors: run `npm run build` and resolve all type errors
  - [ ] 10.16 Run `npm run lint:fix` to auto-fix linting issues
  - [ ] 10.17 Run `npm run format` to ensure consistent code formatting
  - [ ] 10.18 Create playtest checklist and have another person test the shop system for 30 minutes
  - [ ] 10.19 Address playtest feedback and fix any identified issues
  - [ ] 10.20 Create PR with detailed description of shop system implementation and testing results
