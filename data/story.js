/**
 * Story System Data
 * Defines story events, dialogue, choices, and multiple endings
 */

const StoryData = {
    // Story events and their dialogue
    events: {
        game_start: {
            name: "The Beginning",
            description: "Your adventure starts in a peaceful village",
            type: "intro",
            dialogue: [
                {
                    speaker: "Narrator",
                    text: "Welcome to the world of monsters and magic. You are a young adventurer ready to explore the unknown."
                },
                {
                    speaker: "Village Elder",
                    text: "Ah, another brave soul seeking adventure! Choose your path wisely, for the world beyond our village is full of wonders and dangers."
                },
                {
                    speaker: "Village Elder", 
                    text: "Before you go, let me teach you about the ancient art of monster taming..."
                }
            ],
            choices: [],
            outcomes: {
                default: {
                    storyFlags: ["tutorial_start"],
                    unlockAreas: [],
                    items: ["starter_kit"]
                }
            }
        },
        
        tutorial_complete: {
            name: "First Steps",
            description: "You've learned the basics of adventure",
            type: "tutorial",
            dialogue: [
                {
                    speaker: "Village Elder",
                    text: "Excellent! You've mastered the fundamentals. The Forest Path to the north is perfect for a beginner like yourself."
                }
            ],
            choices: [],
            outcomes: {
                default: {
                    storyFlags: ["forest_path_available"],
                    unlockAreas: ["forest_path"],
                    items: ["basic_supplies"]
                }
            }
        },
        
        first_monster_encounter: {
            name: "Wild Encounter",
            description: "Your first battle with a wild monster",
            type: "encounter",
            dialogue: [
                {
                    speaker: "Narrator",
                    text: "A wild creature appears! This is your chance to test your skills... and perhaps make a new companion."
                }
            ],
            choices: [
                {
                    text: "Try to capture it",
                    outcome: "attempt_capture"
                },
                {
                    text: "Fight defensively",
                    outcome: "defensive_fight"
                }
            ],
            outcomes: {
                attempt_capture: {
                    storyFlags: ["capture_attempt_made"],
                    unlockAreas: ["plains"],
                    dialogue: [
                        {
                            speaker: "Narrator",
                            text: "You attempt to capture the creature. Whether you succeed or fail, you've taken your first step as a monster tamer."
                        }
                    ]
                },
                defensive_fight: {
                    storyFlags: ["cautious_fighter"],
                    unlockAreas: ["plains"],
                    dialogue: [
                        {
                            speaker: "Narrator", 
                            text: "You fight carefully, learning the creature's patterns. Knowledge gained through observation serves you well."
                        }
                    ]
                }
            }
        },
        
        pack_encounter: {
            name: "The Wolf Pack",
            description: "You encounter a coordinated pack of wolves",
            type: "major_encounter",
            dialogue: [
                {
                    speaker: "Narrator",
                    text: "The forest grows quiet. Suddenly, glowing eyes emerge from the shadows. A pack of wolves surrounds you, led by a magnificent alpha."
                },
                {
                    speaker: "Alpha Wolf",
                    text: "Grrrowwwl... *The alpha wolf regards you with intelligent eyes, as if measuring your worth*"
                }
            ],
            choices: [
                {
                    text: "Show respect to the alpha",
                    outcome: "respectful_approach"
                },
                {
                    text: "Stand your ground boldly",
                    outcome: "bold_stance"
                },
                {
                    text: "Try to communicate with them",
                    outcome: "communication_attempt",
                    classRequirement: ["ranger", "paladin"]
                }
            ],
            outcomes: {
                respectful_approach: {
                    storyFlags: ["wolf_respect_earned", "nature_affinity"],
                    unlockAreas: ["wolf_den"],
                    items: ["wolf_tracker"],
                    dialogue: [
                        {
                            speaker: "Alpha Wolf",
                            text: "*The alpha wolf nods approvingly and howls. The pack disperses, but not before the alpha drops something at your feet.*"
                        }
                    ]
                },
                bold_stance: {
                    storyFlags: ["wolf_challenge_issued", "warrior_path"],
                    unlockAreas: ["wolf_den"],
                    items: ["wolf_tracker"],
                    dialogue: [
                        {
                            speaker: "Alpha Wolf",
                            text: "*The alpha wolf snarls but there's respect in its eyes. It marks you as a worthy opponent.*"
                        }
                    ]
                },
                communication_attempt: {
                    storyFlags: ["wolf_friendship", "beast_speaker", "special_bond"],
                    unlockAreas: ["wolf_den", "mystic_grove"],
                    items: ["wolf_companion", "nature_blessing"],
                    dialogue: [
                        {
                            speaker: "Alpha Wolf",
                            text: "*The wolf's eyes widen in surprise. You sense its thoughts - respect, curiosity, and... friendship.*"
                        },
                        {
                            speaker: "Narrator",
                            text: "Your connection with nature has opened new paths. The mystical grove reveals itself to you."
                        }
                    ]
                }
            }
        },
        
        dragon_encounter: {
            name: "The Ancient Dragon",
            description: "Face to face with a legendary dragon",
            type: "boss_encounter",
            dialogue: [
                {
                    speaker: "Narrator",
                    text: "At the peak of the mountain, ancient treasure glitters around a massive form. The dragon awakens, its eyes like molten gold."
                },
                {
                    speaker: "Ancient Dragon",
                    text: "So... another small one seeks the ancient treasures. Tell me, little tamer, what brings you to my domain?"
                }
            ],
            choices: [
                {
                    text: "I seek knowledge and friendship",
                    outcome: "peaceful_approach"
                },
                {
                    text: "I've come to prove my strength",
                    outcome: "challenge_dragon"
                },
                {
                    text: "I want to understand the old ways",
                    outcome: "wisdom_seeker"
                }
            ],
            outcomes: {
                peaceful_approach: {
                    storyFlags: ["dragon_friendship", "peaceful_resolution"],
                    items: ["dragon_ally", "wisdom_gem"],
                    dialogue: [
                        {
                            speaker: "Ancient Dragon",
                            text: "Interesting... Few seek friendship with dragonkind. Very well. Prove your heart is true."
                        }
                    ]
                },
                challenge_dragon: {
                    storyFlags: ["dragon_challenge", "warrior_ending"],
                    items: ["dragon_scale", "courage_medal"],
                    dialogue: [
                        {
                            speaker: "Ancient Dragon",
                            text: "Bold! I respect courage. Face me then, and let us see what you are truly made of!"
                        }
                    ]
                },
                wisdom_seeker: {
                    storyFlags: ["dragon_wisdom", "scholar_path", "ancient_knowledge"],
                    items: ["ancient_tome", "dragon_blessing"],
                    unlockAreas: ["ancient_ruins"],
                    dialogue: [
                        {
                            speaker: "Ancient Dragon",
                            text: "Ahh, wisdom... The rarest treasure of all. Yes, I will share the old knowledge with you."
                        }
                    ]
                }
            }
        },
        
        final_trial: {
            name: "The Final Trial",
            description: "The ultimate test of your journey",
            type: "ending_event",
            dialogue: [
                {
                    speaker: "Ancient Guardian",
                    text: "You have traveled far, young tamer. But one final trial remains. What is your ultimate goal?"
                }
            ],
            choices: [
                {
                    text: "To protect all creatures, great and small",
                    outcome: "guardian_ending"
                },
                {
                    text: "To become the greatest monster master",
                    outcome: "master_ending"
                },
                {
                    text: "To bring peace between humans and monsters",
                    outcome: "peace_ending"
                },
                {
                    text: "To uncover all the world's mysteries",
                    outcome: "explorer_ending"
                }
            ]
        }
    },
    
    // Different possible endings
    endings: {
        guardian_ending: {
            name: "Guardian of the Realm",
            description: "You became a protector of all creatures",
            dialogue: [
                {
                    speaker: "Narrator",
                    text: "Your compassion and dedication have earned you the title of Guardian. Monsters and humans alike look to you for protection."
                },
                {
                    speaker: "Ancient Guardian",
                    text: "The realm is safe in your hands. Your bond with all creatures will ensure peace for generations to come."
                }
            ],
            requirements: ["peaceful_approach", "nature_affinity", "beast_speaker"],
            unlocks: ["new_game_plus", "guardian_mode"]
        },
        
        master_ending: {
            name: "Supreme Monster Master",
            description: "You achieved unparalleled mastery over monsters",
            dialogue: [
                {
                    speaker: "Narrator",
                    text: "Through skill, strategy, and determination, you have become the greatest monster tamer the world has ever known."
                },
                {
                    speaker: "Ancient Guardian",
                    text: "Your mastery is complete. The monsters follow you not out of fear, but out of respect and admiration."
                }
            ],
            requirements: ["dragon_challenge", "warrior_path", "all_monsters_captured"],
            unlocks: ["master_mode", "legendary_monsters"]
        },
        
        peace_ending: {
            name: "Harbinger of Peace",
            description: "You brought harmony between all species",
            dialogue: [
                {
                    speaker: "Narrator",
                    text: "Your diplomatic nature and understanding heart have created lasting peace. The age of fear between species is over."
                },
                {
                    speaker: "Village Elder",
                    text: "What you have accomplished will be remembered forever. Peace reigns because of your wisdom."
                }
            ],
            requirements: ["dragon_friendship", "wolf_friendship", "peaceful_resolution"],
            unlocks: ["peace_mode", "diplomatic_options"]
        },
        
        explorer_ending: {
            name: "Seeker of Truth",
            description: "You uncovered the deepest mysteries of the world",
            dialogue: [
                {
                    speaker: "Narrator",
                    text: "Your thirst for knowledge has revealed secrets that were lost to time. The world's mysteries are yours to command."
                },
                {
                    speaker: "Ancient Dragon",
                    text: "Knowledge is indeed the greatest treasure. Use what you have learned wisely."
                }
            ],
            requirements: ["dragon_wisdom", "ancient_knowledge", "all_areas_explored"],
            unlocks: ["scholar_mode", "hidden_areas"]
        }
    },
    
    // Character development paths
    characterPaths: {
        warrior_path: {
            name: "Path of the Warrior",
            description: "Focus on strength and direct confrontation",
            bonuses: ["increased_attack", "combat_mastery", "intimidation"]
        },
        
        peaceful_path: {
            name: "Path of Harmony", 
            description: "Focus on understanding and cooperation",
            bonuses: ["increased_capture_rate", "monster_friendship", "diplomatic_solutions"]
        },
        
        scholar_path: {
            name: "Path of Knowledge",
            description: "Focus on learning and discovery",
            bonuses: ["monster_insights", "area_secrets", "ancient_knowledge"]
        },
        
        nature_path: {
            name: "Path of Nature",
            description: "Focus on connection with the natural world",
            bonuses: ["beast_communication", "nature_magic", "environmental_bonuses"]
        }
    },
    
    // Story progression tracking
    storyProgress: {
        currentEvent: "game_start",
        completedEvents: [],
        storyFlags: [],
        characterPath: null,
        endingPath: null
    },
    
    /**
     * Get story event data
     */
    getEvent: function(eventName) {
        return this.events[eventName] || null;
    },
    
    /**
     * Get ending data
     */
    getEnding: function(endingName) {
        return this.endings[endingName] || null;
    },
    
    /**
     * Check if story requirements are met
     */
    checkRequirements: function(requirements, playerFlags) {
        if (!requirements || requirements.length === 0) return true;
        
        return requirements.every(flag => playerFlags.includes(flag));
    },
    
    /**
     * Get available endings based on player's story flags
     */
    getAvailableEndings: function(playerFlags) {
        const availableEndings = [];
        
        for (const [endingName, ending] of Object.entries(this.endings)) {
            if (this.checkRequirements(ending.requirements, playerFlags)) {
                availableEndings.push(endingName);
            }
        }
        
        return availableEndings;
    },
    
    /**
     * Process story choice outcome
     */
    processChoice: function(eventName, choiceOutcome) {
        const event = this.getEvent(eventName);
        if (!event || !event.outcomes[choiceOutcome]) return null;
        
        const outcome = event.outcomes[choiceOutcome];
        
        return {
            storyFlags: outcome.storyFlags || [],
            unlockAreas: outcome.unlockAreas || [],
            items: outcome.items || [],
            dialogue: outcome.dialogue || []
        };
    },
    
    /**
     * Get story events available in an area
     */
    getAreaEvents: function(areaName, playerFlags) {
        const availableEvents = [];
        
        for (const [eventName, event] of Object.entries(this.events)) {
            // Check if event can trigger in this area (from AreaData)
            if (typeof AreaData !== 'undefined') {
                const area = AreaData.getArea(areaName);
                if (area && area.storyEvents.includes(eventName)) {
                    // Check if player meets requirements for this event
                    if (!playerFlags.includes(eventName + '_completed')) {
                        availableEvents.push(eventName);
                    }
                }
            }
        }
        
        return availableEvents;
    },
    
    /**
     * Generate dynamic dialogue based on player's path and flags
     */
    generateDynamicDialogue: function(baseDialogue, playerFlags, playerPath) {
        // Modify dialogue based on player's choices and path
        let modifiedDialogue = [...baseDialogue];
        
        // Add path-specific dialogue
        if (playerPath === 'warrior_path' && playerFlags.includes('dragon_challenge')) {
            modifiedDialogue.push({
                speaker: "Narrator",
                text: "Your warrior's spirit burns bright, intimidating lesser creatures but earning respect from the mighty."
            });
        }
        
        if (playerPath === 'peaceful_path' && playerFlags.includes('beast_speaker')) {
            modifiedDialogue.push({
                speaker: "Narrator", 
                text: "The creatures of the wild sense your gentle nature and are drawn to your peaceful aura."
            });
        }
        
        return modifiedDialogue;
    },
    
    /**
     * Calculate story branching based on player choices
     */
    calculateStoryBranch: function(playerFlags) {
        let score = {
            warrior: 0,
            peaceful: 0,
            scholar: 0,
            nature: 0
        };
        
        // Score based on flags
        if (playerFlags.includes('dragon_challenge')) score.warrior += 2;
        if (playerFlags.includes('wolf_respect_earned')) score.peaceful += 2;
        if (playerFlags.includes('ancient_knowledge')) score.scholar += 2;
        if (playerFlags.includes('beast_speaker')) score.nature += 2;
        
        // Return dominant path
        const maxScore = Math.max(...Object.values(score));
        return Object.keys(score).find(key => score[key] === maxScore) + '_path';
    }
};

// Make available globally
window.StoryData = StoryData;