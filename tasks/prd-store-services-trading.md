# Product Requirements Document: Store, Services, and Trading System

## 1. Introduction/Overview

This document outlines the requirements for implementing a comprehensive store, services, and trading system in Sawyer's RPG Game. The feature will enable players to buy and sell items, interact with specialized shops, and trade with NPCs through both barter and quest-based mechanics. This system addresses the need for an in-game economy where players can:

- Monetize collected items and monster drops
- Purchase equipment, consumables, and magical items to enhance their character
- Engage with friendly NPCs in various shop locations
- Trade items directly with NPCs for quest rewards or bartered goods

The primary goal is to create an engaging, age-appropriate economic system that enhances gameplay progression and provides meaningful choices for players aged 7-12.

## 2. Goals

1. **Implement a functional in-game economy** where players can buy and sell items using gold currency
2. **Create multiple specialized shop types** (General Store, Weapon Shop, Armor Shop, Magic Shop, Apothecary) with unique inventories
3. **Enable location-based store access** where shops exist in specific areas and must be discovered through exploration
4. **Integrate NPC trading mechanics** supporting both barter-style item exchanges and quest-based trades
5. **Ensure age-appropriate presentation** with friendly shopkeeper dialogues and helpful tutorial tooltips
6. **Maintain economy balance** through level-gated inventory unlocks and category-specific buy-back systems
7. **Provide seamless integration** with existing game systems (combat drops, equipment, quests)

## 3. User Stories

1. **As a player**, I want to sell monster drops I've collected so that I can earn gold to purchase better equipment.

2. **As a player**, I want to visit different specialized shops in various areas so that I can find the specific items I need for my adventure.

3. **As a player**, I want to see helpful information about items before purchasing so that I understand what each item does and whether it's an upgrade.

4. **As a player**, I want confirmation before completing purchases so that I don't accidentally spend my gold on the wrong items.

5. **As a player**, I want to discover hidden shops through exploration so that I feel rewarded for thoroughly exploring areas.

6. **As a player**, I want to unlock better items as I progress through the game so that shops remain relevant and exciting throughout my journey.

7. **As a player**, I want to trade items directly with NPCs so that I can complete quests or obtain unique items through barter.

8. **As a player**, I want friendly shopkeepers with personality so that store interactions feel engaging and fun rather than just transactional.

## 4. Functional Requirements

### 4.1 Store Types and Locations

1. The system must support five types of shops:
   - General Store (buys/sells consumables, materials, basic items)
   - Weapon Shop (buys/sells melee weapons, bows, staffs)
   - Armor Shop (buys/sells armor, shields, defensive equipment)
   - Magic Shop (buys/sells spells, magic accessories, magical items)
   - Apothecary/Alchemy (buys/sells potions, ingredients, crafting materials)

2. Stores must be location-based and accessible only in specific areas:
   - Starting area stores (Mistwood Forest or equivalent starting zone)
   - Town/village hub stores (safe zones between adventure areas)
   - Hidden shops that require discovery through exploration

3. Each shop must have a unique shopkeeper NPC with age-appropriate personality and dialogue.

4. Stores must be accessed during area exploration as interaction points (not from the main menu).

### 4.2 Buying Items

5. Players must be able to view store inventory organized by item category (weapons, armor, consumables, magic, materials).

6. Each item listing must display:
   - Item name and icon/image (new assets will be created for shop items)
   - Purchase price in gold
   - Item description and stats/effects
   - Current player gold balance
   - Visual indicator if player can afford the item

7. Items that players cannot afford must be visually disabled (grayed out) with a tooltip explaining the cost.

8. Clicking an unaffordable item must display a friendly message: "You need X more gold for this!"

9. All purchases must require confirmation via a modal dialog showing:
   - Item details
   - Purchase price
   - "Confirm Purchase" and "Cancel" buttons

10. Successfully purchasing an item must:
    - Deduct gold from player's balance
    - Add item to player's inventory (max 50 items)
    - Display a success message with encouraging feedback
    - Check for full inventory and handle appropriately (see section 4.7)

### 4.3 Selling Items

11. Players must be able to sell items from their inventory back to appropriate stores based on category:
    - General Store: buys materials, consumables, and basic items
    - Weapon Shop: buys weapons only
    - Armor Shop: buys armor and shields only
    - Magic Shop: buys magic items and accessories
    - Apothecary: buys consumables and crafting materials

12. Sell prices must be lower than purchase prices (50% of buy price recommended).

13. Players must not be able to sell quest-critical items that are required for active quests.

14. All sales must require confirmation via a modal dialog.

15. Successfully selling an item must:
    - Add gold to player's balance
    - Remove item from inventory
    - Display a success message

### 4.4 Item Unlocks and Progression

16. Store inventory must be gated by multiple progression factors:
    - Player level (e.g., level 5 weapons unlock at player level 5)
    - Story progress (e.g., advanced items unlock after completing story chapter 2)
    - Area completion (e.g., completing Forest area unlocks forest-themed items)

17. Locked items must be visible in store inventory but clearly marked as "Locked" with unlock requirements displayed.

18. The system must check all unlock conditions when displaying store inventory.

19. Level discounts are NOT implemented - all players pay the same base price for items.

### 4.5 NPC Trading

20. The system must support barter-style trading where players exchange items for other items without gold:
    - Example: Trade 3 Slime Gels for 1 Minor Health Potion

21. The system must support quest-based trades where NPCs request specific items:
    - One-time trades (e.g., "Bring me a Wolf Pelt and I'll give you this sword")
    - Repeatable trades (e.g., "I'll always trade 5 herbs for 1 potion")

22. NPC trades must be defined in the game data files with:
    - Required items (what player must give)
    - Offered items (what NPC provides in return)
    - Trade type (one-time or repeatable)
    - Availability conditions (level, quest state, etc.)

23. Players must receive confirmation dialogs before completing NPC trades.

24. Completed one-time trades must be tracked and prevented from being repeated.

### 4.6 User Interface and Experience

25. Store interfaces must include tutorial tooltips explaining:
    - How to buy and sell items
    - What item stats mean (e.g., "ATK +5 increases your attack damage")
    - Store-specific features (e.g., "This shop specializes in potions")
    - Tutorial triggers on first shop visit (any shop, not location-specific)

26. Shopkeeper NPCs must display friendly, age-appropriate dialogue with character-driven names:
    - Shops have creative names (e.g., "Bob's Blade Emporium" instead of "Weapon Shop")
    - Greeting messages when opening shop
    - Helpful tips about items or gameplay
    - Encouraging feedback after purchases
    - No mature, scary, or inappropriate content

27. Store UI must clearly display:
    - Player's current gold balance (always visible)
    - Item categories/filters
    - Buy/Sell toggle or tabs
    - "Exit Shop" button

28. All store interactions must provide clear visual and textual feedback.

29. Store interfaces must be responsive and work on both desktop and mobile devices.

### 4.7 Edge Cases and Error Handling

30. When a player's inventory is full (50 items maximum) during a purchase:
    - Display a friendly warning: "Your inventory is full! Please make room before buying more items."
    - Prevent the purchase until inventory has space
    - Do not deduct gold

31. Players must not be able to sell items they currently have equipped:
    - Equipped items should be visually indicated
    - Attempting to sell equipped items shows message: "You need to unequip this item first!"

32. All store data and player transactions must persist correctly across save/load operations.

33. If a store fails to load (missing data, corrupted save), display a friendly error message and allow the player to exit gracefully.

34. No buyback system is implemented - all sales are final.

### 4.8 Integration with Existing Systems

35. All items purchased from stores must integrate with the existing equipment system:
    - Weapons and armor can be equipped from inventory
    - Equipment stats apply to player character
    - Follow existing equipment slot rules

36. All monster drops from combat must have sell values:
    - Common drops (Slime Gel, Goblin Tooth, etc.) have base sell prices
    - Rare drops have higher sell values
    - Sell values should be defined in item data files (add `sellPrice` field)

37. Quest system integration:
    - NPCs can request items as part of quest objectives
    - Completing item delivery quests can reward unique shop items
    - Quest items must be marked and protected from selling

38. Store interactions should trigger appropriate game state events for potential future achievement tracking.

### 4.9 Economy Balance

39. Players start with 100 gold at character creation.

40. Gold earning rate from combat should allow players to earn 1000-2000 gold per hour of active play:
    - Monster drops should yield appropriate gold amounts
    - Sold items contribute to gold earnings
    - Balance ensures players can afford upgrades at proper pace

41. Hidden shops unlock when area exploration reaches specific percentage thresholds:
    - System tracks exploration percentage per area
    - Discovery triggers when threshold is met
    - Unlocked shops persist in save data

## 5. Non-Goals (Out of Scope)

1. **Player-to-player trading** - This system focuses on NPC interactions only. Player trading would require multiplayer infrastructure.

2. **Crafting system integration** - While stores sell crafting materials, the crafting system itself is a separate feature.

3. **Reputation/relationship system** - No merchant reputation, loyalty points, or relationship-building mechanics. Pricing and availability are based solely on level and progression.

4. **Dynamic market pricing** - Prices do not fluctuate based on supply/demand, time of day, or market conditions.

5. **Store upgrades** - Shops do not level up, expand, or improve over time.

6. **Auction house or marketplace** - No competitive bidding or player-driven market mechanics.

7. **Currency beyond gold** - No premium currencies, tokens, or alternative payment methods.

8. **Real-money transactions** - This is a single-player browser game with no microtransactions or monetization.

9. **Shop music or sound effects** - Audio implementation is out of scope for this feature.

10. **Localization/internationalization** - All content will be in English only.

## 6. Design Considerations

### 6.1 Visual Design

- Follow the project's existing atomic design pattern (atoms, molecules, organisms)
- Use the established theme colors and kid-friendly visual style from `/docs/context/style_guide.md`
- Create new components:
  - `ShopInterface` (organism) - Main store container
  - `ItemListing` (molecule) - Individual item display in shop
  - `ShopkeeperDialog` (molecule) - NPC dialogue box
  - `TransactionModal` (molecule) - Buy/sell confirmation
  - `PriceTag` (atom) - Gold cost display

### 6.2 Accessibility

- Ensure full keyboard navigation (Tab, Enter, Esc)
- Provide clear focus indicators on all interactive elements
- Use ARIA labels for screen reader support
- Maintain high contrast for readability
- Support existing accessibility features (colorblind mode, text size options)

### 6.3 Mobile Responsiveness

- Store interfaces must work on touch devices
- Larger touch targets for buttons (minimum 44x44px)
- Scrollable item lists with touch-friendly controls
- Confirmation dialogs optimized for mobile screens

## 7. Technical Considerations

### 7.1 State Management

- Extend `ReactGameContext` to include store-related state:
  - `visitedShops: string[]` - Tracks discovered shop locations
  - `completedTrades: string[]` - Tracks one-time NPC trades
  - `shopInventories: Record<string, ShopInventory>` - Store data

- Add reducer actions:
  - `DISCOVER_SHOP` - Unlock a new shop location
  - `PURCHASE_ITEM` - Buy item from shop
  - `SELL_ITEM` - Sell item to shop
  - `COMPLETE_NPC_TRADE` - Execute barter/quest trade

### 7.2 Data Structure

- Create new data files in `public/data/`:
  - `shops.js` - Shop definitions (location, type, shopkeeper info)
  - `shop-inventory.js` - Item listings with unlock requirements
  - `npc-trades.js` - Barter and quest trade definitions

- Define TypeScript interfaces in `src/types/`:
  - `Shop` - Shop metadata
  - `ShopInventory` - Item listings for a shop
  - `NPCTrade` - Trade offer structure
  - `TransactionResult` - Purchase/sale result type

### 7.3 Integration Points

- `AreaExploration.tsx` - Add shop interaction points
- `ReactGameContext.tsx` - Extend state and reducer
- Item data files - Add `sellPrice` field to all items
- Quest system - Define item delivery quest types

### 7.4 Performance

- Lazy load shop data only when player visits a shop
- Cache visited shop inventories to avoid recalculation
- Use React.memo() for item listings to prevent unnecessary re-renders
- Implement virtual scrolling if shop inventories exceed 50+ items

### 7.5 Save System

- Store state must be included in save data:
  - Visited/discovered shops
  - Completed one-time trades
  - Player gold balance (already tracked)

- Ensure backwards compatibility with existing save files
- Validate shop data on load to prevent corruption

## 8. Success Metrics

1. **Player Engagement**:
   - 80%+ of players visit at least one shop within their first play session
   - Players make an average of 5+ purchases per hour of gameplay
   - Players discover at least 50% of available shop locations

2. **Feature Usage**:
   - Average transaction time under 30 seconds (from opening shop to completing purchase)
   - Less than 5% transaction cancellation rate (players backing out after opening confirmation)
   - Players successfully complete tutorial tooltips (tracked if applicable)

3. **Economy Balance** (to be monitored post-launch):
   - Players maintain a healthy gold balance (not too rich, not too poor)
   - Item sell prices feel fair to players (gather feedback)
   - Level-gated items unlock at appropriate rates

4. **Quality Metrics**:
   - Zero crashes or game-breaking bugs related to store system
   - Save/load works correctly 100% of the time
   - No exploits allowing infinite gold or item duplication

## 9. Implementation Notes

All open questions have been resolved and incorporated into the functional requirements above. Key decisions:

- **Starting Gold**: 100 gold (section 4.9)
- **Gold Earning Rate**: 1000-2000 gold per hour of play (section 4.9)
- **Shop Naming**: Creative character-driven names like "Bob's Blade Emporium" (section 4.6)
- **Tutorial Timing**: First time entering any shop (section 4.6)
- **Hidden Shop Discovery**: Exploration percentage thresholds (section 4.9)
- **Maximum Inventory Size**: 50 items (sections 4.2, 4.7)
- **Item Icons**: New assets to be created (section 4.2)
- **Refund Policy**: No buyback system (section 4.7)
- **Shop Music/SFX**: Out of scope (section 5)
- **Localization**: English only, out of scope (section 5)

---

## Appendix: Example Shop Definitions

### Example: Starting Area General Store

```typescript
{
  id: "mistwood-general-store",
  name: "Rosie's Remedies & Rarities", // Creative character-driven name
  type: "general",
  location: "mistwood-forest",
  shopkeeper: {
    name: "Rosie the Shopkeeper",
    greeting: "Welcome to my shop! Let me know if you need any help!",
    buyDialogue: "Great choice! That will help you on your adventure!",
    sellDialogue: "Thanks for bringing these items! Here's your gold."
  },
  buysCategories: ["consumables", "materials", "basic"],
  inventory: [
    { itemId: "minor-health-potion", unlockLevel: 1 },
    { itemId: "minor-mana-potion", unlockLevel: 1 },
    { itemId: "antidote", unlockLevel: 2 },
    { itemId: "rope", unlockLevel: 1 }
  ]
}
```

### Example: NPC Barter Trade

```typescript
{
  id: "herbalist-slime-trade",
  npcName: "Village Herbalist",
  type: "barter",
  repeatable: true,
  requiredItems: [
    { itemId: "slime-gel", quantity: 3 }
  ],
  offeredItems: [
    { itemId: "minor-health-potion", quantity: 1 }
  ],
  dialogue: "I can make potions from slime gel! Bring me 3 and I'll give you a potion."
}
```

---

**Document Version**: 1.1
**Created**: 2025-10-27
**Last Updated**: 2025-10-27
**Status**: Approved - Ready for Implementation
