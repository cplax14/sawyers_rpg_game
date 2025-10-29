/**
 * Shop Definitions
 * Defines all shops, their locations, shopkeepers, and buy/sell configurations
 * Ages 7-12 appropriate with friendly shopkeepers and creative names
 */

const ShopData = {
    // ================================================
    // STARTING AREA SHOPS (Mistwood Forest)
    // ================================================
    mistwood_general_store: {
        id: "mistwood_general_store",
        name: "Rosie's Remedies & Rarities",
        type: "general",
        location: "starting_village",
        shopkeeper: {
            name: "Rosie the Shopkeeper",
            mood: "happy",
            avatar: "👩",
            dialogue: {
                greeting: "Welcome to my shop, young adventurer! Let me know if you need any help!",
                buyDialogue: "Great choice! That will help you on your adventure!",
                sellDialogue: "Thanks for bringing these items! Here's your gold.",
                browsing: "Take your time looking around! I have lots of useful items.",
                farewell: "Stay safe out there! Come back anytime!",
                firstVisit: "Hello! I'm Rosie! This is my first shop, and I'm so excited to help brave adventurers like you!",
                tips: [
                    "Potions are great for healing during your adventures!",
                    "Don't forget to stock up before heading into dangerous areas!",
                    "Monster drops can be sold here for gold!"
                ],
                encouragement: [
                    "You're doing great!",
                    "I believe in you!",
                    "Every hero needs supplies!"
                ]
            },
            backstory: "Rosie grew up in Mistwood Village and learned about herbs and potions from her grandmother. She opened this shop to help adventurers stay safe."
        },
        buysCategories: ["consumables", "materials", "misc"],
        unlockRequirements: {
            level: 1
        },
        pricingModifiers: {
            buyMultiplier: 1.0,
            sellMultiplier: 0.5
        },
        theme: {
            primaryColor: "#4CAF50",
            secondaryColor: "#81C784",
            icon: "🏪"
        },
        hidden: false
    },

    // ================================================
    // TOWN SHOPS (Oakwood Village)
    // ================================================
    oakwood_weapon_emporium: {
        id: "oakwood_weapon_emporium",
        name: "Bob's Blade Emporium",
        type: "weapon",
        location: "oakwood_village",
        shopkeeper: {
            name: "Blacksmith Bob",
            mood: "helpful",
            avatar: "👨‍🔧",
            dialogue: {
                greeting: "Ah, a young warrior! Looking for a fine weapon?",
                buyDialogue: "Excellent choice! That blade will serve you well!",
                sellDialogue: "Hmm, good craftsmanship. I'll give you a fair price.",
                browsing: "Feel free to browse! Each weapon here is made with care.",
                farewell: "May your blade stay sharp, adventurer!",
                firstVisit: "Welcome to my forge! I'm Bob, and I've been crafting weapons for 30 years. Let me help you find the perfect blade!",
                tips: [
                    "A good weapon makes all the difference in battle!",
                    "Match your weapon to your fighting style!",
                    "Take care of your equipment and it will take care of you!"
                ],
                encouragement: [
                    "You have the heart of a true warrior!",
                    "That's a wise choice!",
                    "Your skills will grow with practice!"
                ]
            },
            backstory: "Bob learned blacksmithing from his father and grandfather. He takes pride in every weapon he sells and wants to keep adventurers safe."
        },
        buysCategories: ["weapons"],
        unlockRequirements: {
            level: 3,
            areaCompletion: "mistwood_forest"
        },
        pricingModifiers: {
            buyMultiplier: 1.1,
            sellMultiplier: 0.45
        },
        theme: {
            primaryColor: "#FF5722",
            secondaryColor: "#FF8A65",
            icon: "⚔️"
        },
        hidden: false
    },

    oakwood_armor_depot: {
        id: "oakwood_armor_depot",
        name: "Dora's Defense Depot",
        type: "armor",
        location: "oakwood_village",
        shopkeeper: {
            name: "Armorer Dora",
            mood: "neutral",
            avatar: "👩‍🏭",
            dialogue: {
                greeting: "Welcome! Looking for some sturdy armor?",
                buyDialogue: "That will keep you nice and safe!",
                sellDialogue: "I can work with this. Here's your payment.",
                browsing: "Protection is important! Try things on if you'd like.",
                farewell: "Stay protected out there!",
                firstVisit: "Hello! I'm Dora, the village armorer. Good armor can mean the difference between victory and defeat. Let me show you what I have!",
                tips: [
                    "Good armor reduces damage from enemy attacks!",
                    "Helmets and boots provide extra protection!",
                    "Balance defense with mobility for best results!"
                ],
                encouragement: [
                    "Safety first!",
                    "You're thinking smart!",
                    "A protected adventurer is a successful one!"
                ]
            },
            backstory: "Dora is a master of defensive equipment. She believes every adventurer deserves quality protection, no matter their experience level."
        },
        buysCategories: ["armor", "accessories"],
        unlockRequirements: {
            level: 3,
            areaCompletion: "mistwood_forest"
        },
        pricingModifiers: {
            buyMultiplier: 1.1,
            sellMultiplier: 0.45
        },
        theme: {
            primaryColor: "#9C27B0",
            secondaryColor: "#BA68C8",
            icon: "🛡️"
        },
        hidden: false
    },

    oakwood_magic_mysteries: {
        id: "oakwood_magic_mysteries",
        name: "Wizard Wally's Magic Mysteries",
        type: "magic",
        location: "oakwood_village",
        shopkeeper: {
            name: "Wizard Wally",
            mood: "excited",
            avatar: "🧙",
            dialogue: {
                greeting: "Ah! A seeker of magical wonders! Come in, come in!",
                buyDialogue: "Marvelous choice! The magic in this item is quite special!",
                sellDialogue: "Oh my! This has interesting magical properties! Here's your gold.",
                browsing: "Every item here holds a spark of magic! Wonderful, isn't it?",
                farewell: "May magic light your path, young wizard!",
                firstVisit: "Welcome, welcome! I'm Wally, purveyor of all things magical! You'll find enchanted items and mystical curiosities here!",
                tips: [
                    "Magic items can give you special abilities!",
                    "Some accessories boost your magical power!",
                    "Wizards need the right tools for their spells!"
                ],
                encouragement: [
                    "Magic is wonderful!",
                    "You have great taste in magic!",
                    "The arcane arts suit you well!"
                ]
            },
            backstory: "Wally studied at the Mage's Academy and now runs this shop to share magical items with worthy adventurers. He loves seeing new magic users discover their potential."
        },
        buysCategories: ["magic", "accessories"],
        unlockRequirements: {
            level: 5,
            storyProgress: 2
        },
        pricingModifiers: {
            buyMultiplier: 1.2,
            sellMultiplier: 0.4
        },
        theme: {
            primaryColor: "#9C27B0",
            secondaryColor: "#CE93D8",
            icon: "✨"
        },
        hidden: false
    },

    oakwood_apothecary: {
        id: "oakwood_apothecary",
        name: "Penny's Potion Parlor",
        type: "apothecary",
        location: "oakwood_village",
        shopkeeper: {
            name: "Alchemist Penny",
            mood: "happy",
            avatar: "👩‍🔬",
            dialogue: {
                greeting: "Hello there! Need some potions or ingredients?",
                buyDialogue: "Perfect! This potion is freshly brewed!",
                sellDialogue: "Wonderful! I can use these ingredients. Thank you!",
                browsing: "All my potions are made with the finest ingredients!",
                farewell: "Stay healthy and happy!",
                firstVisit: "Welcome to my parlor! I'm Penny, and I make the best potions in the region! Whether you need healing or something special, I've got you covered!",
                tips: [
                    "Always carry healing potions on adventures!",
                    "Different potions help in different situations!",
                    "Ingredients found in the wild can be sold here!"
                ],
                encouragement: [
                    "Health is wealth!",
                    "Smart thinking!",
                    "You'll go far with the right potions!"
                ]
            },
            backstory: "Penny learned alchemy from traveling herbalists. She combines science and a little bit of magic to create amazing potions that help adventurers."
        },
        buysCategories: ["consumables", "materials"],
        unlockRequirements: {
            level: 4,
            areaCompletion: "mistwood_forest"
        },
        pricingModifiers: {
            buyMultiplier: 1.0,
            sellMultiplier: 0.5
        },
        theme: {
            primaryColor: "#4CAF50",
            secondaryColor: "#81C784",
            icon: "⚗️"
        },
        hidden: false
    },

    // ================================================
    // HIDDEN/SPECIAL SHOPS
    // ================================================
    hidden_forest_trader: {
        id: "hidden_forest_trader",
        name: "The Mysterious Merchant",
        type: "general",
        location: "deep_forest",
        shopkeeper: {
            name: "Mysterious Merchant Max",
            mood: "neutral",
            avatar: "🎩",
            dialogue: {
                greeting: "Ah, you found me! Welcome to my hidden shop...",
                buyDialogue: "A rare find! You won't regret this purchase.",
                sellDialogue: "Interesting... I'll add this to my collection.",
                browsing: "I have items you won't find anywhere else. Browse carefully.",
                farewell: "Until we meet again, adventurer...",
                firstVisit: "So, you discovered my secret shop! I'm Max, and I deal in rare and unusual items. If you have the gold, I have the goods.",
                tips: [
                    "Rare items are worth the extra gold!",
                    "Exploration always pays off!",
                    "I only appear to those who search thoroughly!"
                ],
                encouragement: [
                    "You're quite the explorer!",
                    "Excellent discovery!",
                    "Your persistence paid off!"
                ]
            },
            backstory: "Max is a wandering merchant who sets up shop in hidden locations. Nobody knows where he gets his rare items, but they're always worth finding."
        },
        buysCategories: ["consumables", "materials", "accessories", "weapons", "armor"],
        unlockRequirements: {
            level: 7,
            explorationThreshold: 0.75,
            areaCompletion: "mistwood_forest"
        },
        pricingModifiers: {
            buyMultiplier: 1.3,
            sellMultiplier: 0.6
        },
        theme: {
            primaryColor: "#795548",
            secondaryColor: "#A1887F",
            icon: "🎩"
        },
        hidden: true
    },

    crystal_cave_magic_shop: {
        id: "crystal_cave_magic_shop",
        name: "Crystal Cave Enchantments",
        type: "magic",
        location: "crystal_caves",
        shopkeeper: {
            name: "Enchantress Elena",
            mood: "helpful",
            avatar: "🔮",
            dialogue: {
                greeting: "The crystals brought you here... Welcome, seeker.",
                buyDialogue: "The magic chooses its wielder. This is meant for you.",
                sellDialogue: "These items resonate with power. I'll take them.",
                browsing: "Feel the magical energy? Each item is special.",
                farewell: "May the crystal's light guide you.",
                firstVisit: "Welcome to my enchanted shop. I'm Elena, and I work with the cave's natural magic to create powerful items. You must be special to have found this place!",
                tips: [
                    "Crystal-enhanced items are more powerful!",
                    "Magic grows stronger with practice!",
                    "The cave's energy makes these items unique!"
                ],
                encouragement: [
                    "Your magical potential is strong!",
                    "The crystals approve of you!",
                    "You have a gift for magic!"
                ]
            },
            backstory: "Elena discovered the Crystal Caves and learned to channel their magical energy into enchantments. She only reveals her shop to those who prove themselves worthy."
        },
        buysCategories: ["magic", "accessories"],
        unlockRequirements: {
            level: 10,
            storyProgress: 3,
            areaCompletion: "crystal_caves"
        },
        pricingModifiers: {
            buyMultiplier: 1.4,
            sellMultiplier: 0.5
        },
        theme: {
            primaryColor: "#E1BEE7",
            secondaryColor: "#CE93D8",
            icon: "💎"
        },
        hidden: true
    }
};

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ShopData };
}

// Make available globally for browser
if (typeof window !== 'undefined') {
    window.ShopData = ShopData;
}
