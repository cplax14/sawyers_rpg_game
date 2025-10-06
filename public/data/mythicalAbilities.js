/**
 * Mythical Abilities and Passive Traits Data
 *
 * Defines ultimate abilities for Mythical rarity creatures and
 * passive traits for Gen 3+ creatures.
 *
 * Mythical Abilities: Powerful signature moves exclusive to Mythical creatures
 * Gen 5 Ultimate Abilities: Generation 5 exclusive abilities
 * Passive Traits: Always-active bonuses for Gen 3+
 */

const MythicalAbilitiesData = {
  // ================================================
  // MYTHICAL ULTIMATE ABILITIES
  // ================================================
  mythicalAbilities: {
    divine_wrath: {
      id: 'divine_wrath',
      name: 'Divine Wrath',
      description: 'Channel holy power to strike all enemies with devastating light damage. Ignores 50% of enemy defense.',
      type: 'attack',
      element: 'light',
      mpCost: 80,
      power: 200,
      target: 'all_enemies',
      castTime: 2.5,
      cooldown: 3,
      minRarity: 'mythical',
      effects: [
        {
          type: 'damage',
          power: 200,
          element: 'light',
          scaling: 'magicAttack',
          scalingMultiplier: 2.0,
          ignoreDefense: 0.5
        },
        {
          type: 'apply_debuff',
          debuff: 'holy_burn',
          duration: 2,
          chance: 0.6
        }
      ],
      animation: 'divine_light_explosion'
    },

    cosmic_storm: {
      id: 'cosmic_storm',
      name: 'Cosmic Storm',
      description: 'Summon a devastating storm of cosmic energy that damages and debuffs all enemies. Reduces enemy magic defense by 40%.',
      type: 'attack',
      element: 'lightning',
      mpCost: 75,
      power: 180,
      target: 'all_enemies',
      castTime: 2.0,
      cooldown: 3,
      minRarity: 'mythical',
      effects: [
        {
          type: 'damage',
          power: 180,
          element: 'lightning',
          scaling: 'magicAttack',
          scalingMultiplier: 1.8
        },
        {
          type: 'apply_debuff',
          debuff: 'magic_break',
          value: -0.4,
          duration: 3
        },
        {
          type: 'apply_debuff',
          debuff: 'paralysis',
          duration: 1,
          chance: 0.4
        }
      ],
      animation: 'cosmic_lightning_storm'
    },

    eternal_rebirth: {
      id: 'eternal_rebirth',
      name: 'Eternal Rebirth',
      description: 'Resurrect with 50% HP when defeated. Can only trigger once per battle.',
      type: 'passive_trigger',
      element: 'holy',
      mpCost: 0,
      target: 'self',
      minRarity: 'mythical',
      effects: [
        {
          type: 'auto_revive',
          hpPercent: 0.5,
          triggerOnce: true,
          condition: 'hp_zero'
        }
      ],
      animation: 'phoenix_rebirth'
    },

    apocalypse: {
      id: 'apocalypse',
      name: 'Apocalypse',
      description: 'Ultimate dark magic that deals massive damage to all enemies. Damage scales with missing HP.',
      type: 'attack',
      element: 'dark',
      mpCost: 100,
      power: 250,
      target: 'all_enemies',
      castTime: 3.0,
      cooldown: 5,
      minRarity: 'mythical',
      effects: [
        {
          type: 'damage',
          power: 250,
          element: 'dark',
          scaling: 'magicAttack',
          scalingMultiplier: 2.5,
          missingHpBonus: 1.0 // +100% damage at 0% HP
        },
        {
          type: 'apply_debuff',
          debuff: 'doom',
          duration: 3,
          chance: 0.3
        }
      ],
      animation: 'apocalyptic_void'
    },

    primal_fury: {
      id: 'primal_fury',
      name: 'Primal Fury',
      description: 'Unleash savage power, attacking all enemies 3 times with increasing damage. Each hit has 30% critical chance.',
      type: 'attack',
      element: 'neutral',
      mpCost: 60,
      power: 80,
      target: 'all_enemies',
      castTime: 1.5,
      cooldown: 3,
      minRarity: 'mythical',
      effects: [
        {
          type: 'multi_hit',
          hits: 3,
          power: 80,
          scaling: 'attack',
          scalingMultiplier: 1.5,
          damageIncrease: 0.3, // +30% per hit
          critChance: 0.3
        }
      ],
      animation: 'savage_rampage'
    },

    time_stop: {
      id: 'time_stop',
      name: 'Time Stop',
      description: 'Freeze time, allowing 2 consecutive turns. During time stop, attacks have +50% damage.',
      type: 'buff',
      element: 'neutral',
      mpCost: 90,
      target: 'self',
      castTime: 0.5,
      cooldown: 6,
      minRarity: 'mythical',
      effects: [
        {
          type: 'extra_turn',
          turns: 2
        },
        {
          type: 'apply_buff',
          buff: 'time_acceleration',
          value: 0.5, // +50% damage
          duration: 2
        }
      ],
      animation: 'temporal_freeze'
    },

    elemental_convergence: {
      id: 'elemental_convergence',
      name: 'Elemental Convergence',
      description: 'Combine all elements into one devastating attack. Damage type adapts to enemy weakness.',
      type: 'attack',
      element: 'neutral',
      mpCost: 85,
      power: 190,
      target: 'single_enemy',
      castTime: 2.2,
      cooldown: 4,
      minRarity: 'mythical',
      effects: [
        {
          type: 'adaptive_damage',
          power: 190,
          scaling: 'magicAttack',
          scalingMultiplier: 2.0,
          adaptToWeakness: true
        },
        {
          type: 'penetrate_resistance',
          amount: 0.7 // Ignore 70% of resistance
        }
      ],
      animation: 'elemental_fusion'
    },

    soul_harvest: {
      id: 'soul_harvest',
      name: 'Soul Harvest',
      description: 'Drain the life force of all enemies, dealing damage and healing for 50% of damage dealt.',
      type: 'attack',
      element: 'dark',
      mpCost: 70,
      power: 140,
      target: 'all_enemies',
      castTime: 1.8,
      cooldown: 3,
      minRarity: 'mythical',
      effects: [
        {
          type: 'damage',
          power: 140,
          element: 'dark',
          scaling: 'magicAttack',
          scalingMultiplier: 1.6
        },
        {
          type: 'lifesteal',
          percent: 0.5
        }
      ],
      animation: 'soul_drain_aura'
    }
  },

  // ================================================
  // GEN 5 ULTIMATE ABILITIES
  // ================================================
  gen5Ultimates: {
    legendary_strike: {
      id: 'legendary_strike',
      name: 'Legendary Strike',
      description: 'A perfect strike that never misses and always critically hits. Gen 5 exclusive.',
      type: 'attack',
      element: 'neutral',
      mpCost: 50,
      power: 220,
      target: 'single_enemy',
      castTime: 1.5,
      cooldown: 2,
      minGeneration: 5,
      effects: [
        {
          type: 'damage',
          power: 220,
          scaling: 'attack',
          scalingMultiplier: 3.0,
          guaranteedHit: true,
          guaranteedCrit: true
        }
      ],
      animation: 'perfect_strike'
    },

    ancestral_power: {
      id: 'ancestral_power',
      name: 'Ancestral Power',
      description: 'Channel the power of all ancestors. Damage increases by 20% for each parent generation.',
      type: 'attack',
      element: 'neutral',
      mpCost: 65,
      power: 150,
      target: 'all_enemies',
      castTime: 2.0,
      cooldown: 3,
      minGeneration: 5,
      effects: [
        {
          type: 'damage',
          power: 150,
          scaling: 'magicAttack',
          scalingMultiplier: 1.5,
          generationBonus: 0.2 // +20% per generation
        }
      ],
      animation: 'ancestral_spirits'
    },

    perfect_evolution: {
      id: 'perfect_evolution',
      name: 'Perfect Evolution',
      description: 'Temporarily evolve to peak form. All stats +100% for 3 turns.',
      type: 'buff',
      element: 'neutral',
      mpCost: 80,
      target: 'self',
      castTime: 1.0,
      cooldown: 5,
      minGeneration: 5,
      effects: [
        {
          type: 'apply_buff',
          buff: 'perfect_form',
          value: 1.0, // +100% all stats
          duration: 3
        },
        {
          type: 'restore_hp',
          percent: 0.3
        }
      ],
      animation: 'evolution_aura'
    },

    omega_beam: {
      id: 'omega_beam',
      name: 'Omega Beam',
      description: 'Fire a concentrated beam of pure energy. Pierces all defenses and barriers.',
      type: 'attack',
      element: 'light',
      mpCost: 95,
      power: 280,
      target: 'single_enemy',
      castTime: 2.5,
      cooldown: 4,
      minGeneration: 5,
      effects: [
        {
          type: 'damage',
          power: 280,
          scaling: 'magicAttack',
          scalingMultiplier: 3.5,
          ignoreDefense: 1.0, // Ignore 100% defense
          pierceBarrier: true
        }
      ],
      animation: 'omega_laser'
    },

    genesis_nova: {
      id: 'genesis_nova',
      name: 'Genesis Nova',
      description: 'Create a new star, dealing massive damage and fully restoring your MP.',
      type: 'attack',
      element: 'fire',
      mpCost: 100,
      power: 300,
      target: 'all_enemies',
      castTime: 3.5,
      cooldown: 6,
      minGeneration: 5,
      effects: [
        {
          type: 'damage',
          power: 300,
          element: 'fire',
          scaling: 'magicAttack',
          scalingMultiplier: 3.0
        },
        {
          type: 'restore_mp',
          percent: 1.0 // Restore 100% MP
        },
        {
          type: 'apply_debuff',
          debuff: 'burn',
          duration: 3,
          chance: 0.8
        }
      ],
      animation: 'supernova_explosion'
    }
  },

  // ================================================
  // PASSIVE TRAITS
  // ================================================
  passiveTraits: {
    // Stat Boost Traits
    titan_strength: {
      id: 'titan_strength',
      name: 'Titan Strength',
      description: 'Overwhelming physical power. +30% Attack.',
      category: 'stat_boost',
      rarity: 'rare',
      minGeneration: 3,
      percentModifiers: {
        attackBonus: 0.30
      },
      icon: 'icon_strength'
    },

    iron_hide: {
      id: 'iron_hide',
      name: 'Iron Hide',
      description: 'Incredibly tough skin. +30% Defense.',
      category: 'stat_boost',
      rarity: 'rare',
      minGeneration: 3,
      percentModifiers: {
        defenseBonus: 0.30
      },
      icon: 'icon_defense'
    },

    arcane_mastery: {
      id: 'arcane_mastery',
      name: 'Arcane Mastery',
      description: 'Natural affinity for magic. +30% Magic Attack.',
      category: 'stat_boost',
      rarity: 'rare',
      minGeneration: 3,
      percentModifiers: {
        magicBonus: 0.30
      },
      icon: 'icon_magic'
    },

    swift_reflexes: {
      id: 'swift_reflexes',
      name: 'Swift Reflexes',
      description: 'Lightning-fast movements. +40% Speed.',
      category: 'stat_boost',
      rarity: 'rare',
      minGeneration: 3,
      percentModifiers: {
        attackBonus: 0.20,
        defenseBonus: 0.20
      },
      icon: 'icon_speed'
    },

    vitality_surge: {
      id: 'vitality_surge',
      name: 'Vitality Surge',
      description: 'Exceptional health and stamina. +40% HP and MP.',
      category: 'stat_boost',
      rarity: 'epic',
      minGeneration: 3,
      percentModifiers: {
        hpBonus: 0.40,
        mpBonus: 0.40
      },
      icon: 'icon_vitality'
    },

    perfect_balance: {
      id: 'perfect_balance',
      name: 'Perfect Balance',
      description: 'Harmonious stat distribution. +20% to all stats.',
      category: 'stat_boost',
      rarity: 'legendary',
      minGeneration: 4,
      percentModifiers: {
        allStatsBonus: 0.20
      },
      icon: 'icon_balance'
    },

    // Resistance Traits
    flame_ward: {
      id: 'flame_ward',
      name: 'Flame Ward',
      description: 'Natural resistance to fire. +50% Fire resistance.',
      category: 'resistance',
      rarity: 'uncommon',
      minGeneration: 3,
      resistances: {
        fire: 50
      },
      icon: 'icon_fire_resist'
    },

    frost_immunity: {
      id: 'frost_immunity',
      name: 'Frost Immunity',
      description: 'Immune to ice and cold. +75% Ice resistance.',
      category: 'resistance',
      rarity: 'rare',
      minGeneration: 3,
      resistances: {
        ice: 75
      },
      icon: 'icon_ice_resist'
    },

    storm_born: {
      id: 'storm_born',
      name: 'Storm Born',
      description: 'Born in the storm. +50% Lightning resistance.',
      category: 'resistance',
      rarity: 'uncommon',
      minGeneration: 3,
      resistances: {
        lightning: 50
      },
      icon: 'icon_lightning_resist'
    },

    holy_blessing: {
      id: 'holy_blessing',
      name: 'Holy Blessing',
      description: 'Blessed by light. +60% Light resistance, +30% Dark resistance.',
      category: 'resistance',
      rarity: 'epic',
      minGeneration: 4,
      resistances: {
        light: 60,
        dark: 30
      },
      icon: 'icon_holy'
    },

    elemental_harmony: {
      id: 'elemental_harmony',
      name: 'Elemental Harmony',
      description: 'In tune with all elements. +30% resistance to all elements.',
      category: 'resistance',
      rarity: 'legendary',
      minGeneration: 5,
      resistances: {
        fire: 30,
        water: 30,
        earth: 30,
        air: 30,
        light: 30,
        dark: 30,
        ice: 30,
        lightning: 30,
        nature: 30
      },
      icon: 'icon_elements',
      isUltimate: true
    },

    // Special Effect Traits
    regeneration: {
      id: 'regeneration',
      name: 'Regeneration',
      description: 'Gradually restore HP each turn. Restores 5% max HP.',
      category: 'regeneration',
      rarity: 'rare',
      minGeneration: 3,
      specialEffects: [
        {
          type: 'regeneration',
          value: 0.05,
          description: 'Restore 5% HP per turn'
        }
      ],
      icon: 'icon_regen'
    },

    critical_edge: {
      id: 'critical_edge',
      name: 'Critical Edge',
      description: 'Increased critical hit chance. +25% critical chance.',
      category: 'critical',
      rarity: 'epic',
      minGeneration: 3,
      specialEffects: [
        {
          type: 'critical_chance',
          value: 0.25,
          description: '+25% critical hit chance'
        }
      ],
      icon: 'icon_critical'
    },

    counter_stance: {
      id: 'counter_stance',
      name: 'Counter Stance',
      description: '30% chance to counter physical attacks.',
      category: 'special_effect',
      rarity: 'epic',
      minGeneration: 4,
      specialEffects: [
        {
          type: 'counter_attack',
          value: 0.30,
          description: '30% chance to counter when attacked'
        }
      ],
      icon: 'icon_counter'
    },

    first_strike: {
      id: 'first_strike',
      name: 'First Strike',
      description: 'Always attack first in battle, regardless of speed.',
      category: 'special_effect',
      rarity: 'legendary',
      minGeneration: 4,
      specialEffects: [
        {
          type: 'first_strike',
          value: 1,
          description: 'Always attack first'
        }
      ],
      icon: 'icon_first_strike'
    },

    last_stand: {
      id: 'last_stand',
      name: 'Last Stand',
      description: 'When HP drops below 20%, all stats +50% for the rest of the battle.',
      category: 'special_effect',
      rarity: 'legendary',
      minGeneration: 4,
      specialEffects: [
        {
          type: 'last_stand',
          value: 0.50,
          description: '+50% all stats when HP < 20%'
        }
      ],
      icon: 'icon_last_stand'
    },

    phoenix_soul: {
      id: 'phoenix_soul',
      name: 'Phoenix Soul',
      description: 'Revive once per battle with 30% HP when defeated.',
      category: 'special_effect',
      rarity: 'legendary',
      minGeneration: 5,
      specialEffects: [
        {
          type: 'regeneration',
          value: 0.10,
          description: 'Restore 10% HP per turn'
        }
      ],
      icon: 'icon_phoenix',
      isUltimate: true
    },

    omega_force: {
      id: 'omega_force',
      name: 'Omega Force',
      description: 'The ultimate power. +50% to all stats, +50% critical chance.',
      category: 'stat_boost',
      rarity: 'mythical',
      minGeneration: 5,
      percentModifiers: {
        allStatsBonus: 0.50
      },
      specialEffects: [
        {
          type: 'critical_chance',
          value: 0.50,
          description: '+50% critical hit chance'
        }
      ],
      icon: 'icon_omega',
      isUltimate: true
    }
  }
};

// Export for use in React components
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MythicalAbilitiesData;
}
