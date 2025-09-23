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

        // 9.6.b Further branches and areas
        grove_ritual: {
            name: "Rite of the Grove",
            description: "A quiet ritual binds your spirit to the wilds",
            type: "ritual",
            dialogue: [
                { speaker: "Narrator", text: "Forest lights dance in a circle. A low hum rises as if the trees themselves are singing." }
            ],
            choices: [
                { text: "Perform the ritual", outcome: "perform_ritual" },
                { text: "Decline respectfully", outcome: "decline_ritual" }
            ],
            outcomes: {
                perform_ritual: {
                    storyFlags: ["peace_symbol", "nature_affinity"],
                    unlockAreas: ["sacred_clearing"],
                    items: ["grove_token"],
                    dialogue: [
                        { speaker: "Narrator", text: "Warmth spreads through your chest. You sense the forest will answer your call in times of need." }
                    ]
                },
                decline_ritual: {
                    storyFlags: ["respectful_decline"],
                    unlockAreas: [],
                    items: [],
                    dialogue: [
                        { speaker: "Narrator", text: "The lights dim, not offended but contemplative. You may return when ready." }
                    ]
                }
            }
        },

        wolf_den_challenge: {
            name: "Challenge at the Den",
            description: "Prove yourself before the pack",
            type: "trial",
            dialogue: [
                { speaker: "Narrator", text: "The wolves watch from ledges above as the alpha steps forward, scarred and regal." }
            ],
            choices: [
                { text: "Face the alpha with honor", outcome: "face_alpha" },
                { text: "Back down and observe", outcome: "back_down" }
            ],
            outcomes: {
                face_alpha: {
                    storyFlags: ["wolf_challenge_won", "warrior_path"],
                    unlockAreas: ["mountain_pass"],
                    items: ["fang_medal"],
                    dialogue: [
                        { speaker: "Alpha Wolf", text: "Strength tempered by respect. You may pass, pack-friend." }
                    ]
                },
                back_down: {
                    storyFlags: ["humility_lesson"],
                    unlockAreas: [],
                    items: [],
                    dialogue: [
                        { speaker: "Narrator", text: "You bow your head. Wisdom in knowing when not to fight." }
                    ]
                }
            }
        },

        inner_ruins_lore: {
            name: "Library of Echoes",
            description: "Whispers of the ancients linger in stone",
            type: "lore",
            dialogue: [
                { speaker: "Narrator", text: "Shelves carved into stone hold tablets that glow faintly as you approach." }
            ],
            choices: [
                { text: "Study the tablet deeply", outcome: "study_tablet" },
                { text: "Note the runes and move on", outcome: "move_on" }
            ],
            outcomes: {
                study_tablet: {
                    storyFlags: ["ancient_knowledge_plus", "scholar_path"],
                    unlockAreas: ["library_of_echoes"],
                    items: ["codex_fragment"],
                    dialogue: [
                        { speaker: "Narrator", text: "The meanings unfold like petals. New pathways of thought open within you." }
                    ]
                },
                move_on: {
                    storyFlags: ["missed_clue"],
                    unlockAreas: [],
                    items: [],
                    dialogue: [
                        { speaker: "Narrator", text: "You record what you can, but the deeper truth slips away for now." }
                    ]
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
            encounter: {
                species: "slime",
                level: 1,
                immediate: true
            },
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

        mystic_grove_discovery: {
            name: "Whispers of the Grove",
            description: "A hidden grove calls to those attuned to nature",
            type: "exploration",
            dialogue: [
                {
                    speaker: "Narrator",
                    text: "You notice a faint shimmer between the trees. The air is thick with the scent of moss and magic."
                }
            ],
            choices: [
                { text: "Follow the whispers", outcome: "attune_nature" },
                { text: "Mark the place for later", outcome: "cautious_note" }
            ],
            outcomes: {
                attune_nature: {
                    storyFlags: ["nature_attuned", "beast_speaker"],
                    unlockAreas: ["mystic_grove"],
                    items: ["nature_charm"],
                    dialogue: [
                        { speaker: "Narrator", text: "You step through the veil. The grove welcomes you; you feel the wild's heartbeat align with your own." }
                    ]
                },
                cautious_note: {
                    storyFlags: ["careful_scout"],
                    unlockAreas: [],
                    items: ["hand_drawn_map"],
                    dialogue: [
                        { speaker: "Narrator", text: "You sketch the landmarks and retreat. Wisdom sometimes lies in patience." }
                    ]
                }
            }
        },

        ruins_puzzle: {
            name: "Riddles of the Ruins",
            description: "Ancient mechanisms guard forgotten knowledge",
            type: "exploration",
            dialogue: [
                {
                    speaker: "Narrator",
                    text: "Within the ruins, stone tiles hum with dormant power. A riddle echoes: \"Only those who seek truly shall pass.\""
                }
            ],
            choices: [
                { text: "Attempt the riddle", outcome: "solve_riddle" },
                { text: "Force the mechanism", outcome: "force_mechanism" }
            ],
            outcomes: {
                solve_riddle: {
                    storyFlags: ["ancient_knowledge", "scholar_path"],
                    unlockAreas: ["ancient_ruins_inner"],
                    items: ["inscribed_key"],
                    dialogue: [
                        { speaker: "Narrator", text: "With patience and insight, the pattern reveals itself. The gate opens with a resonant chime." }
                    ]
                },
                force_mechanism: {
                    storyFlags: ["reckless_approach"],
                    unlockAreas: [],
                    items: ["cracked_relic"],
                    dialogue: [
                        { speaker: "Narrator", text: "You pry at the tiles; something cracks. A hidden cache spills a damaged relic, but the gate remains shut." }
                    ]
                }
            }
        },

        // ================================================
        // MID-GAME EXPANSION EVENTS
        // ================================================

        crystal_cave_mystery: {
            name: "The Singing Crystals",
            description: "Strange melodies echo through the crystal caves",
            type: "exploration",
            dialogue: [
                {
                    speaker: "Narrator",
                    text: "Deep in the crystal caves, you hear an ethereal melody. The crystals themselves seem to be singing in harmony."
                },
                {
                    speaker: "Crystal Spirit",
                    text: "Who dares disturb our eternal song? Are you friend or foe to the ancient harmonies?"
                }
            ],
            choices: [
                {
                    text: "Listen and try to join the song",
                    outcome: "join_harmony"
                },
                {
                    text: "Ask about the crystal's power",
                    outcome: "seek_knowledge"
                },
                {
                    text: "Offer to protect the crystals",
                    outcome: "offer_protection"
                },
                {
                    text: "Study the magical resonance",
                    outcome: "magical_study",
                    classRequirement: ["wizard", "paladin"]
                }
            ],
            outcomes: {
                join_harmony: {
                    storyFlags: ["crystal_harmony", "music_affinity", "peaceful_nature"],
                    unlockAreas: ["harmonic_sanctum"],
                    items: ["resonance_crystal", "harmony_stone"],
                    dialogue: [
                        {
                            speaker: "Crystal Spirit",
                            text: "Your voice blends beautifully with our eternal chorus. You are welcome in our sacred chambers."
                        }
                    ]
                },
                seek_knowledge: {
                    storyFlags: ["crystal_lore", "scholar_path"],
                    unlockAreas: ["crystal_library"],
                    items: ["crystal_codex", "knowledge_gem"],
                    dialogue: [
                        {
                            speaker: "Crystal Spirit",
                            text: "Knowledge seekers are rare. The crystals hold memories of ages past. Learn well."
                        }
                    ]
                },
                offer_protection: {
                    storyFlags: ["crystal_guardian", "protector_oath", "guardian_path"],
                    unlockAreas: ["crystal_vault"],
                    items: ["guardian_crystal", "protection_ward"],
                    dialogue: [
                        {
                            speaker: "Crystal Spirit",
                            text: "A noble offer! We accept your protection. Guard our song from those who would silence it."
                        }
                    ]
                },
                magical_study: {
                    storyFlags: ["crystal_mastery", "arcane_knowledge", "mage_path"],
                    unlockAreas: ["crystal_laboratory"],
                    items: ["crystal_wand", "arcane_focus", "spell_amplifier"],
                    dialogue: [
                        {
                            speaker: "Crystal Spirit",
                            text: "You understand the deeper magics! Use this knowledge to weave wonders, not destruction."
                        }
                    ]
                }
            }
        },

        abandoned_village: {
            name: "Echoes of the Past",
            description: "You discover a village lost to time",
            type: "exploration",
            dialogue: [
                {
                    speaker: "Narrator",
                    text: "Overgrown buildings rise from the forest floor. This was once a thriving village, but something drove everyone away."
                },
                {
                    speaker: "Ghost of the Village Elder",
                    text: "A living soul... it has been so long. Please, help us find peace at last."
                }
            ],
            choices: [
                {
                    text: "Investigate what happened here",
                    outcome: "investigate_mystery"
                },
                {
                    text: "Try to help the spirits",
                    outcome: "help_spirits"
                },
                {
                    text: "Search for valuable items",
                    outcome: "search_loot"
                },
                {
                    text: "Perform a cleansing ritual",
                    outcome: "cleansing_ritual",
                    classRequirement: ["paladin", "wizard"]
                }
            ],
            outcomes: {
                investigate_mystery: {
                    storyFlags: ["village_mystery_solved", "detective_skills", "truth_seeker"],
                    unlockAreas: ["hidden_shrine"],
                    items: ["ancient_diary", "mystery_key"],
                    dialogue: [
                        {
                            speaker: "Ghost of the Village Elder",
                            text: "You have uncovered our tragic tale. The knowledge you seek lies in the shrine beyond."
                        }
                    ]
                },
                help_spirits: {
                    storyFlags: ["spirit_helper", "compassionate_heart", "guardian_nature"],
                    unlockAreas: ["spirit_realm"],
                    items: ["spirit_charm", "blessing_of_peace"],
                    dialogue: [
                        {
                            speaker: "Ghost of the Village Elder",
                            text: "Your kindness has freed us from our earthly bonds. Take our blessing, compassionate one."
                        }
                    ]
                },
                search_loot: {
                    storyFlags: ["treasure_hunter", "practical_minded"],
                    unlockAreas: [],
                    items: ["ancient_gold", "forgotten_equipment", "rare_materials"],
                    dialogue: [
                        {
                            speaker: "Narrator",
                            text: "You find valuable items, but the spirits grow restless at your mercenary approach."
                        }
                    ]
                },
                cleansing_ritual: {
                    storyFlags: ["holy_cleanser", "divine_power", "spiritual_mastery"],
                    unlockAreas: ["sanctified_grove"],
                    items: ["holy_relic", "purification_crystal", "divine_blessing"],
                    dialogue: [
                        {
                            speaker: "Ghost of the Village Elder",
                            text: "The divine light cleanses all shadows. You wield holy power with wisdom and grace."
                        }
                    ]
                }
            }
        },

        rival_tamer_encounter: {
            name: "The Rival's Challenge",
            description: "Another monster tamer blocks your path",
            type: "rival_encounter",
            dialogue: [
                {
                    speaker: "Rival Tamer",
                    text: "So you're the famous tamer I've been hearing about. I doubt you're as skilled as they say."
                },
                {
                    speaker: "Rival Tamer",
                    text: "Let's settle this with a proper monster battle! Winner takes the loser's rarest creature!"
                }
            ],
            choices: [
                {
                    text: "Accept the challenge",
                    outcome: "accept_duel"
                },
                {
                    text: "Suggest we work together instead",
                    outcome: "suggest_cooperation"
                },
                {
                    text: "Decline and try to walk away",
                    outcome: "decline_challenge"
                },
                {
                    text: "Challenge them to a knowledge contest",
                    outcome: "knowledge_contest",
                    classRequirement: ["wizard"]
                }
            ],
            outcomes: {
                accept_duel: {
                    storyFlags: ["rival_defeated", "competitive_nature", "combat_proven"],
                    unlockAreas: ["rival_hideout"],
                    items: ["victory_trophy", "rare_monster"],
                    dialogue: [
                        {
                            speaker: "Rival Tamer",
                            text: "Impressive... You've earned my respect. Keep that creature - you've proven yourself worthy."
                        }
                    ]
                },
                suggest_cooperation: {
                    storyFlags: ["rival_ally", "diplomatic_success", "team_player"],
                    unlockAreas: ["shared_camp", "team_routes"],
                    items: ["friendship_bond", "cooperation_reward"],
                    dialogue: [
                        {
                            speaker: "Rival Tamer",
                            text: "Cooperation? I... hadn't considered that. Yes, together we could achieve much more!"
                        }
                    ]
                },
                decline_challenge: {
                    storyFlags: ["conflict_avoider", "peaceful_resolution"],
                    unlockAreas: [],
                    items: [],
                    dialogue: [
                        {
                            speaker: "Rival Tamer",
                            text: "Running away? Coward! But... perhaps there's wisdom in avoiding needless conflict."
                        }
                    ]
                },
                knowledge_contest: {
                    storyFlags: ["intellectual_victory", "scholar_respect", "wisdom_proven"],
                    unlockAreas: ["academy_entrance"],
                    items: ["knowledge_crown", "scholarly_recognition"],
                    dialogue: [
                        {
                            speaker: "Rival Tamer",
                            text: "Your knowledge surpasses even your battle skills. I concede - teach me your ways!"
                        }
                    ]
                }
            }
        },

        merchant_caravan: {
            name: "The Traveling Merchants",
            description: "A caravan seeks safe passage through dangerous territory",
            type: "encounter",
            dialogue: [
                {
                    speaker: "Caravan Leader",
                    text: "Ah, a skilled tamer! We're carrying precious cargo but the road ahead is treacherous. Would you escort us?"
                },
                {
                    speaker: "Merchant",
                    text: "We can offer rare items as payment, or share information about hidden treasures!"
                }
            ],
            choices: [
                {
                    text: "Agree to escort them for payment",
                    outcome: "paid_escort"
                },
                {
                    text: "Offer to help for free",
                    outcome: "charitable_help"
                },
                {
                    text: "Ask about the information instead",
                    outcome: "seek_information"
                },
                {
                    text: "Negotiate a trade agreement",
                    outcome: "trade_deal",
                    classRequirement: ["rogue"]
                }
            ],
            outcomes: {
                paid_escort: {
                    storyFlags: ["merchant_escort", "business_minded"],
                    unlockAreas: ["trading_post"],
                    items: ["merchant_gold", "rare_goods", "trade_connections"],
                    dialogue: [
                        {
                            speaker: "Caravan Leader",
                            text: "Your protection was worth every coin. Take this as agreed payment, plus a bonus for excellence!"
                        }
                    ]
                },
                charitable_help: {
                    storyFlags: ["generous_heart", "merchant_friend", "karma_bonus"],
                    unlockAreas: ["merchant_network"],
                    items: ["gratitude_gift", "merchant_favor", "good_reputation"],
                    dialogue: [
                        {
                            speaker: "Caravan Leader",
                            text: "Your kindness will not be forgotten. Merchants across the land will know of your generosity!"
                        }
                    ]
                },
                seek_information: {
                    storyFlags: ["treasure_seeker", "information_gatherer"],
                    unlockAreas: ["secret_cache", "hidden_route"],
                    items: ["treasure_map", "secret_knowledge"],
                    dialogue: [
                        {
                            speaker: "Merchant",
                            text: "Knowledge is indeed valuable! This map shows caches we've discovered in our travels."
                        }
                    ]
                },
                trade_deal: {
                    storyFlags: ["master_negotiator", "business_network", "trade_connections"],
                    unlockAreas: ["merchant_guild"],
                    items: ["trade_contract", "exclusive_goods", "merchant_badge"],
                    dialogue: [
                        {
                            speaker: "Caravan Leader",
                            text: "A shrewd negotiator! This deal benefits us both. Welcome to our trading network!"
                        }
                    ]
                }
            }
        },

        ancient_temple_trial: {
            name: "Trial of the Ancient Temple",
            description: "A forgotten temple tests the worthy",
            type: "trial",
            dialogue: [
                {
                    speaker: "Temple Guardian",
                    text: "Only those pure of purpose may enter the inner sanctum. Face the three trials: Body, Mind, and Spirit."
                },
                {
                    speaker: "Temple Guardian",
                    text: "Which trial do you choose to face first? Choose wisely - each path shapes your destiny."
                }
            ],
            choices: [
                {
                    text: "Face the Trial of Body (Combat)",
                    outcome: "trial_body"
                },
                {
                    text: "Face the Trial of Mind (Puzzle)",
                    outcome: "trial_mind"
                },
                {
                    text: "Face the Trial of Spirit (Meditation)",
                    outcome: "trial_spirit"
                },
                {
                    text: "Ask to understand the temple's history first",
                    outcome: "seek_wisdom"
                }
            ],
            outcomes: {
                trial_body: {
                    storyFlags: ["trial_warrior", "physical_mastery", "strength_proven"],
                    unlockAreas: ["warrior_sanctum"],
                    items: ["strength_relic", "combat_blessing", "warrior_mark"],
                    dialogue: [
                        {
                            speaker: "Temple Guardian",
                            text: "Your strength is matched by your resolve. The warrior's path is yours to walk."
                        }
                    ]
                },
                trial_mind: {
                    storyFlags: ["trial_scholar", "mental_mastery", "wisdom_proven"],
                    unlockAreas: ["scholar_sanctum"],
                    items: ["wisdom_relic", "mental_blessing", "scholar_mark"],
                    dialogue: [
                        {
                            speaker: "Temple Guardian",
                            text: "Your mind pierces through illusion to truth. The scholar's path opens before you."
                        }
                    ]
                },
                trial_spirit: {
                    storyFlags: ["trial_mystic", "spiritual_mastery", "soul_proven"],
                    unlockAreas: ["mystic_sanctum"],
                    items: ["spirit_relic", "soul_blessing", "mystic_mark"],
                    dialogue: [
                        {
                            speaker: "Temple Guardian",
                            text: "Your spirit shines with pure intention. The mystic's path calls to your soul."
                        }
                    ]
                },
                seek_wisdom: {
                    storyFlags: ["temple_historian", "ancient_knowledge", "lore_master"],
                    unlockAreas: ["temple_archives"],
                    items: ["temple_chronicles", "ancient_wisdom", "historian_mark"],
                    dialogue: [
                        {
                            speaker: "Temple Guardian",
                            text: "Knowledge before action - wise indeed. The chronicles reveal much to the patient seeker."
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
        },

        // ================================================
        // CHARACTER CLASS-SPECIFIC STORY BRANCHES
        // ================================================

        knight_honor_test: {
            name: "The Knight's Honor",
            description: "A test of chivalric values",
            type: "class_trial",
            classRequirement: ["knight"],
            dialogue: [
                {
                    speaker: "Fallen Knight",
                    text: "I once wore armor like yours, served the same ideals. But honor is a burden too heavy for some."
                },
                {
                    speaker: "Fallen Knight",
                    text: "Will you help a disgraced knight find redemption, or cast judgment upon my failures?"
                }
            ],
            choices: [
                {
                    text: "Offer to help restore his honor",
                    outcome: "redeem_knight"
                },
                {
                    text: "Challenge him to prove his worth",
                    outcome: "honor_duel"
                },
                {
                    text: "Seek to understand his fall",
                    outcome: "understand_failure"
                }
            ],
            outcomes: {
                redeem_knight: {
                    storyFlags: ["knight_redeemer", "mercy_shown", "honor_restored"],
                    unlockAreas: ["hall_of_honor"],
                    items: ["redemption_blade", "mercy_shield", "chivalric_seal"],
                    dialogue: [
                        {
                            speaker: "Fallen Knight",
                            text: "Your compassion has restored what I thought lost forever. Honor can be rebuilt, one righteous act at a time."
                        }
                    ]
                },
                honor_duel: {
                    storyFlags: ["honor_defender", "justice_upheld", "trial_by_combat"],
                    unlockAreas: ["champions_arena"],
                    items: ["justice_sword", "honor_crown", "victory_standard"],
                    dialogue: [
                        {
                            speaker: "Fallen Knight",
                            text: "Your blade speaks truth! I accept defeat and the chance to earn back what I've lost."
                        }
                    ]
                },
                understand_failure: {
                    storyFlags: ["wisdom_seeker", "empathetic_knight", "deeper_understanding"],
                    unlockAreas: ["chamber_of_reflection"],
                    items: ["understanding_helm", "empathy_gauntlets", "wisdom_scroll"],
                    dialogue: [
                        {
                            speaker: "Fallen Knight",
                            text: "Few knights would listen to my story. Your wisdom goes beyond simple concepts of right and wrong."
                        }
                    ]
                }
            }
        },

        wizard_arcane_mystery: {
            name: "The Arcane Paradox",
            description: "A magical puzzle that defies understanding",
            type: "class_trial",
            classRequirement: ["wizard"],
            dialogue: [
                {
                    speaker: "Ancient Mage",
                    text: "Young wizard, you face a paradox that has puzzled mages for centuries. Magic flows backward here, effects precede causes."
                },
                {
                    speaker: "Ancient Mage",
                    text: "How will you unravel this mystery? Your approach will determine your mastery of the arcane arts."
                }
            ],
            choices: [
                {
                    text: "Study the paradox systematically",
                    outcome: "systematic_study"
                },
                {
                    text: "Embrace the chaos and adapt",
                    outcome: "chaos_adaptation"
                },
                {
                    text: "Seek the fundamental cause",
                    outcome: "root_cause_analysis"
                }
            ],
            outcomes: {
                systematic_study: {
                    storyFlags: ["methodical_mage", "systematic_magic", "arcane_scholar"],
                    unlockAreas: ["library_infinite"],
                    items: ["codex_methodicus", "systematic_staff", "scholars_robe"],
                    dialogue: [
                        {
                            speaker: "Ancient Mage",
                            text: "Method in madness! Your systematic approach reveals patterns others missed. True mastery lies in understanding."
                        }
                    ]
                },
                chaos_adaptation: {
                    storyFlags: ["chaos_mage", "adaptive_magic", "wild_mastery"],
                    unlockAreas: ["chaos_laboratory"],
                    items: ["chaos_orb", "adaptive_wand", "wild_magic_tome"],
                    dialogue: [
                        {
                            speaker: "Ancient Mage",
                            text: "To dance with chaos is the highest art! Your flexibility where others see only confusion is remarkable."
                        }
                    ]
                },
                root_cause_analysis: {
                    storyFlags: ["truth_seeker_mage", "fundamental_understanding", "core_wisdom"],
                    unlockAreas: ["source_chamber"],
                    items: ["truth_crystal", "fundamental_focus", "source_knowledge"],
                    dialogue: [
                        {
                            speaker: "Ancient Mage",
                            text: "To seek the source is to touch the foundation of all magic. Few dare look so deep into the fundamental forces."
                        }
                    ]
                }
            }
        },

        rogue_heist_opportunity: {
            name: "The Perfect Heist",
            description: "An opportunity that tests skill and ethics",
            type: "class_trial",
            classRequirement: ["rogue"],
            dialogue: [
                {
                    speaker: "Master Thief",
                    text: "A corrupt noble hoards wealth while people starve. Their treasure vault has one weakness - you."
                },
                {
                    speaker: "Master Thief",
                    text: "Will you take this chance to redistribute their ill-gotten gains, or find another way to serve justice?"
                }
            ],
            choices: [
                {
                    text: "Execute the heist flawlessly",
                    outcome: "perfect_heist"
                },
                {
                    text: "Expose the noble's corruption instead",
                    outcome: "expose_corruption"
                },
                {
                    text: "Steal only what's needed for the poor",
                    outcome: "robin_hood_approach"
                }
            ],
            outcomes: {
                perfect_heist: {
                    storyFlags: ["master_thief", "flawless_execution", "heist_expert"],
                    unlockAreas: ["thieves_guild"],
                    items: ["master_lockpicks", "shadow_cloak", "thieves_crown"],
                    dialogue: [
                        {
                            speaker: "Master Thief",
                            text: "Perfection! Not a trace left behind. You've mastered the art of the invisible hand."
                        }
                    ]
                },
                expose_corruption: {
                    storyFlags: ["noble_rogue", "justice_seeker", "corruption_fighter"],
                    unlockAreas: ["justice_network"],
                    items: ["evidence_collection", "truth_serum", "justice_badge"],
                    dialogue: [
                        {
                            speaker: "Master Thief",
                            text: "Using shadows to bring light to darkness - a noble use of our skills. The people will remember this."
                        }
                    ]
                },
                robin_hood_approach: {
                    storyFlags: ["peoples_champion", "righteous_thief", "balanced_justice"],
                    unlockAreas: ["hidden_sanctuary"],
                    items: ["peoples_favor", "balanced_scales", "champions_blessing"],
                    dialogue: [
                        {
                            speaker: "Master Thief",
                            text: "Taking only what's needed shows wisdom beyond mere skill. You understand the true purpose of our craft."
                        }
                    ]
                }
            }
        },

        paladin_faith_crisis: {
            name: "Crisis of Faith",
            description: "When divine guidance seems absent",
            type: "class_trial",
            classRequirement: ["paladin"],
            dialogue: [
                {
                    speaker: "Tormented Paladin",
                    text: "My prayers go unanswered, my holy powers dim. Have I been abandoned by the divine, or have I lost my way?"
                },
                {
                    speaker: "Tormented Paladin",
                    text: "How does one restore faith when the very foundations seem to crumble?"
                }
            ],
            choices: [
                {
                    text: "Help them find inner strength",
                    outcome: "inner_strength"
                },
                {
                    text: "Seek divine guidance together",
                    outcome: "divine_guidance"
                },
                {
                    text: "Question the nature of faith itself",
                    outcome: "philosophical_approach"
                }
            ],
            outcomes: {
                inner_strength: {
                    storyFlags: ["inner_light_paladin", "self_reliant_faith", "personal_divinity"],
                    unlockAreas: ["inner_sanctum"],
                    items: ["inner_light_mace", "self_blessed_armor", "personal_prayer_book"],
                    dialogue: [
                        {
                            speaker: "Tormented Paladin",
                            text: "The divine was within me all along! Your guidance has shown me that faith begins in the heart."
                        }
                    ]
                },
                divine_guidance: {
                    storyFlags: ["divine_messenger", "faithful_servant", "blessed_guidance"],
                    unlockAreas: ["celestial_chamber"],
                    items: ["divine_artifact", "blessed_symbol", "celestial_blessing"],
                    dialogue: [
                        {
                            speaker: "Tormented Paladin",
                            text: "Through your faith, mine is restored! The divine speaks through acts of compassion like yours."
                        }
                    ]
                },
                philosophical_approach: {
                    storyFlags: ["questioning_paladin", "philosophical_faith", "deeper_understanding"],
                    unlockAreas: ["hall_of_contemplation"],
                    items: ["philosophers_mace", "contemplative_shield", "wisdom_prayer_book"],
                    dialogue: [
                        {
                            speaker: "Tormented Paladin",
                            text: "Questions lead to deeper truths! Your willingness to examine faith itself has strengthened mine."
                        }
                    ]
                }
            }
        },

        ranger_nature_call: {
            name: "The Wild's Calling",
            description: "When nature itself asks for help",
            type: "class_trial",
            classRequirement: ["ranger"],
            dialogue: [
                {
                    speaker: "Spirit of the Wild",
                    text: "Ranger, the balance is threatened. Civilization encroaches, ancient groves fall. What path will you choose?"
                },
                {
                    speaker: "Spirit of the Wild",
                    text: "Will you fight to preserve the old ways, or seek harmony between progress and preservation?"
                }
            ],
            choices: [
                {
                    text: "Defend the wilderness at all costs",
                    outcome: "wild_defender"
                },
                {
                    text: "Seek balance between nature and civilization",
                    outcome: "balance_seeker"
                },
                {
                    text: "Become a bridge between both worlds",
                    outcome: "bridge_builder"
                }
            ],
            outcomes: {
                wild_defender: {
                    storyFlags: ["nature_guardian", "wild_protector", "primal_alliance"],
                    unlockAreas: ["primal_stronghold"],
                    items: ["guardian_bow", "primal_armor", "nature_blessing"],
                    dialogue: [
                        {
                            speaker: "Spirit of the Wild",
                            text: "Your dedication to the untamed world is absolute. The wild claims you as its champion."
                        }
                    ]
                },
                balance_seeker: {
                    storyFlags: ["balance_keeper", "harmonious_ranger", "dual_understanding"],
                    unlockAreas: ["harmony_grove"],
                    items: ["balance_bow", "harmony_cloak", "dual_blessing"],
                    dialogue: [
                        {
                            speaker: "Spirit of the Wild",
                            text: "Wisdom in seeking middle ground. Both worlds can thrive when guided by understanding hearts."
                        }
                    ]
                },
                bridge_builder: {
                    storyFlags: ["world_bridge", "diplomatic_ranger", "unity_champion"],
                    unlockAreas: ["unity_outpost"],
                    items: ["unity_bow", "diplomatic_gear", "bridge_blessing"],
                    dialogue: [
                        {
                            speaker: "Spirit of the Wild",
                            text: "To stand between worlds and bring them together - this is the highest calling of a ranger."
                        }
                    ]
                }
            }
        },

        warrior_ultimate_test: {
            name: "The Final Battle",
            description: "Face the ultimate test of a warrior's strength",
            type: "class_trial",
            classRequirement: ["warrior"],
            dialogue: [
                {
                    speaker: "Legendary Champion",
                    text: "You've proven yourself against many foes, but do you have what it takes to face a true legend?"
                },
                {
                    speaker: "Legendary Champion",
                    text: "This is not just about strength - it's about the warrior spirit that drives you forward."
                }
            ],
            choices: [
                {
                    text: "Face them with pure strength",
                    outcome: "pure_strength"
                },
                {
                    text: "Fight with tactical brilliance",
                    outcome: "tactical_genius"
                },
                {
                    text: "Channel your warrior's spirit",
                    outcome: "spirit_warrior"
                }
            ],
            outcomes: {
                pure_strength: {
                    storyFlags: ["strength_legend", "pure_warrior", "unstoppable_force"],
                    unlockAreas: ["champions_hall"],
                    items: ["legendary_weapon", "strength_crown", "power_gauntlets"],
                    dialogue: [
                        {
                            speaker: "Legendary Champion",
                            text: "Raw power perfected! You have achieved the pinnacle of physical mastery. Few can match your strength."
                        }
                    ]
                },
                tactical_genius: {
                    storyFlags: ["tactical_master", "strategic_warrior", "battle_genius"],
                    unlockAreas: ["war_college"],
                    items: ["tactical_blade", "strategic_armor", "battle_manual"],
                    dialogue: [
                        {
                            speaker: "Legendary Champion",
                            text: "Brilliance in battle! Your mind is as sharp as your blade. True warriors think as well as fight."
                        }
                    ]
                },
                spirit_warrior: {
                    storyFlags: ["spiritual_warrior", "indomitable_will", "warrior_soul"],
                    unlockAreas: ["spirit_dojo"],
                    items: ["soul_weapon", "spirit_armor", "warriors_heart"],
                    dialogue: [
                        {
                            speaker: "Legendary Champion",
                            text: "The warrior's spirit burns bright within you! This inner fire will never be extinguished."
                        }
                    ]
                }
            }
        },

        // ================================================
        // ENDGAME AND FINALE EVENTS
        // ================================================

        convergence_point: {
            name: "The Great Convergence",
            description: "All paths lead to this moment of decision",
            type: "major_event",
            dialogue: [
                {
                    speaker: "Narrator",
                    text: "The threads of fate converge here. Your choices throughout your journey have shaped this moment."
                },
                {
                    speaker: "Cosmic Entity",
                    text: "Mortal tamer, you have walked many paths and faced countless trials. Now you must choose your legacy."
                }
            ],
            choices: [
                {
                    text: "Unite all the paths you've walked",
                    outcome: "unity_path",
                    requirement: ["multiple_paths_completed"]
                },
                {
                    text: "Embrace your strongest conviction",
                    outcome: "conviction_path"
                },
                {
                    text: "Transcend all previous limitations",
                    outcome: "transcendence_path",
                    requirement: ["master_level_achieved"]
                },
                {
                    text: "Create an entirely new path",
                    outcome: "innovation_path",
                    requirement: ["creative_solutions_used"]
                }
            ],
            outcomes: {
                unity_path: {
                    storyFlags: ["path_unifier", "balanced_master", "harmony_achieved"],
                    unlockAreas: ["unity_nexus"],
                    items: ["convergence_artifact", "unity_crown", "harmony_staff"],
                    dialogue: [
                        {
                            speaker: "Cosmic Entity",
                            text: "To unite seemingly opposing forces - this is wisdom beyond measure. You have achieved true balance."
                        }
                    ]
                },
                conviction_path: {
                    storyFlags: ["unwavering_conviction", "path_master", "true_believer"],
                    unlockAreas: ["conviction_shrine"],
                    items: ["conviction_relic", "believers_crown", "faith_artifact"],
                    dialogue: [
                        {
                            speaker: "Cosmic Entity",
                            text: "Unwavering dedication to your chosen path shows the strength of your character. Your conviction inspires others."
                        }
                    ]
                },
                transcendence_path: {
                    storyFlags: ["transcendent_being", "limitation_breaker", "evolved_consciousness"],
                    unlockAreas: ["transcendent_realm"],
                    items: ["transcendence_orb", "evolution_crown", "cosmic_artifact"],
                    dialogue: [
                        {
                            speaker: "Cosmic Entity",
                            text: "You have broken through the barriers that limit others. Your consciousness has evolved beyond mortal bounds."
                        }
                    ]
                },
                innovation_path: {
                    storyFlags: ["path_creator", "innovative_spirit", "reality_shaper"],
                    unlockAreas: ["creation_workshop"],
                    items: ["innovation_tool", "creators_crown", "reality_gem"],
                    dialogue: [
                        {
                            speaker: "Cosmic Entity",
                            text: "To forge entirely new possibilities where none existed - you have become a creator of realities."
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