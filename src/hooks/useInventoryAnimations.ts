import { useCallback, useState, useRef } from 'react';
import { Variants } from 'framer-motion';

export interface AnimationConfig {
  duration: number;
  ease: string | number[];
  delay?: number;
}

export interface FeedbackState {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration: number;
  id: string;
}

export interface InventoryAnimations {
  // Card animations
  cardHover: Variants;
  cardTap: Variants;
  cardSelect: Variants;
  cardDeselect: Variants;
  cardDrop: Variants;
  cardPickup: Variants;

  // List animations
  listItem: Variants;
  staggerContainer: Variants;

  // Modal/popup animations
  modalEntry: Variants;
  modalExit: Variants;
  slideIn: Variants;
  slideOut: Variants;

  // Action feedback animations
  equipSuccess: Variants;
  equipError: Variants;
  useItem: Variants;
  deleteItem: Variants;

  // Loading states
  shimmer: Variants;
  pulse: Variants;

  // Tab transitions
  tabEntry: Variants;
  tabExit: Variants;
}

export const useInventoryAnimations = () => {
  const [feedbackQueue, setFeedbackQueue] = useState<FeedbackState[]>([]);
  const feedbackIdCounter = useRef(0);

  // Animation configurations
  const fastConfig: AnimationConfig = { duration: 0.2, ease: 'easeOut' };
  const normalConfig: AnimationConfig = { duration: 0.3, ease: 'easeInOut' };
  const slowConfig: AnimationConfig = { duration: 0.5, ease: 'easeInOut' };

  // Core animation variants
  const animations: InventoryAnimations = {
    // Card animations for items, equipment, creatures
    cardHover: {
      rest: {
        scale: 1,
        y: 0,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: fastConfig
      },
      hover: {
        scale: 1.03,
        y: -2,
        boxShadow: '0 8px 25px rgba(79, 195, 247, 0.3)',
        transition: fastConfig
      }
    },

    cardTap: {
      rest: { scale: 1, transition: fastConfig },
      tap: { scale: 0.97, transition: { duration: 0.1 } }
    },

    cardSelect: {
      unselected: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        transition: normalConfig
      },
      selected: {
        borderColor: 'rgba(79, 195, 247, 0.6)',
        backgroundColor: 'rgba(79, 195, 247, 0.1)',
        boxShadow: '0 0 20px rgba(79, 195, 247, 0.3)',
        transition: normalConfig
      }
    },

    cardDeselect: {
      selected: {
        borderColor: 'rgba(79, 195, 247, 0.6)',
        backgroundColor: 'rgba(79, 195, 247, 0.1)',
        transition: normalConfig
      },
      unselected: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        transition: normalConfig
      }
    },

    cardDrop: {
      initial: { scale: 1, rotate: 0, opacity: 1 },
      dropping: {
        scale: 0.8,
        rotate: -10,
        opacity: 0.7,
        transition: { duration: 0.4, ease: 'easeIn' }
      },
      dropped: {
        scale: 0,
        opacity: 0,
        transition: { duration: 0.2 }
      }
    },

    cardPickup: {
      initial: { scale: 0, opacity: 0, y: 20 },
      picking: {
        scale: 1.1,
        opacity: 1,
        y: -5,
        transition: { duration: 0.3, ease: 'easeOut' }
      },
      picked: {
        scale: 1,
        y: 0,
        transition: { duration: 0.2 }
      }
    },

    // List and container animations
    listItem: {
      hidden: {
        opacity: 0,
        x: -20,
        transition: fastConfig
      },
      visible: {
        opacity: 1,
        x: 0,
        transition: fastConfig
      },
      exit: {
        opacity: 0,
        x: 20,
        transition: fastConfig
      }
    },

    staggerContainer: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.05,
          delayChildren: 0.1
        }
      }
    },

    // Modal and popup animations
    modalEntry: {
      hidden: {
        opacity: 0,
        scale: 0.9,
        y: 20
      },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          type: 'spring',
          damping: 25,
          stiffness: 300
        }
      }
    },

    modalExit: {
      visible: { opacity: 1, scale: 1, y: 0 },
      exit: {
        opacity: 0,
        scale: 0.9,
        y: 20,
        transition: normalConfig
      }
    },

    slideIn: {
      hidden: { x: '100%', opacity: 0 },
      visible: {
        x: 0,
        opacity: 1,
        transition: {
          type: 'spring',
          damping: 30,
          stiffness: 300
        }
      }
    },

    slideOut: {
      visible: { x: 0, opacity: 1 },
      exit: {
        x: '-100%',
        opacity: 0,
        transition: normalConfig
      }
    },

    // Action feedback animations
    equipSuccess: {
      initial: { scale: 1, backgroundColor: 'transparent' },
      success: {
        scale: [1, 1.05, 1],
        backgroundColor: ['transparent', 'rgba(34, 197, 94, 0.2)', 'transparent'],
        transition: { duration: 0.6 }
      }
    },

    equipError: {
      initial: { x: 0, backgroundColor: 'transparent' },
      error: {
        x: [0, -5, 5, -5, 5, 0],
        backgroundColor: ['transparent', 'rgba(239, 68, 68, 0.2)', 'transparent'],
        transition: { duration: 0.5 }
      }
    },

    useItem: {
      initial: { scale: 1, opacity: 1 },
      using: {
        scale: [1, 1.2, 0.8],
        opacity: [1, 0.8, 0],
        transition: { duration: 0.8, ease: 'easeInOut' }
      },
      used: {
        scale: 0,
        opacity: 0,
        transition: { duration: 0.1 }
      }
    },

    deleteItem: {
      initial: { scale: 1, opacity: 1, filter: 'brightness(1)' },
      deleting: {
        scale: [1, 1.1, 0],
        opacity: [1, 0.5, 0],
        filter: ['brightness(1)', 'brightness(1.5)', 'brightness(0)'],
        transition: { duration: 0.6 }
      }
    },

    // Loading states
    shimmer: {
      initial: { opacity: 0.3 },
      shimmer: {
        opacity: [0.3, 0.7, 0.3],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }
      }
    },

    pulse: {
      initial: { scale: 1, opacity: 1 },
      pulse: {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }
      }
    },

    // Tab transitions
    tabEntry: {
      hidden: {
        opacity: 0,
        x: 30,
        scale: 0.95
      },
      visible: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
          duration: 0.4,
          ease: 'easeOut'
        }
      }
    },

    tabExit: {
      visible: { opacity: 1, x: 0, scale: 1 },
      exit: {
        opacity: 0,
        x: -30,
        scale: 0.95,
        transition: {
          duration: 0.3,
          ease: 'easeIn'
        }
      }
    }
  };

  // Feedback management
  const showFeedback = useCallback((
    type: FeedbackState['type'],
    message: string,
    duration: number = 3000
  ) => {
    const id = `feedback-${++feedbackIdCounter.current}`;
    const feedback: FeedbackState = { type, message, duration, id };

    setFeedbackQueue(prev => [...prev, feedback]);

    // Auto-remove after duration
    setTimeout(() => {
      setFeedbackQueue(prev => prev.filter(f => f.id !== id));
    }, duration);

    return id;
  }, []);

  const removeFeedback = useCallback((id: string) => {
    setFeedbackQueue(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearAllFeedback = useCallback(() => {
    setFeedbackQueue([]);
  }, []);

  // Pre-built animation triggers
  const triggerEquipSuccess = useCallback(() => {
    return showFeedback('success', 'Item equipped successfully!', 2000);
  }, [showFeedback]);

  const triggerEquipError = useCallback((reason: string) => {
    return showFeedback('error', `Cannot equip: ${reason}`, 3000);
  }, [showFeedback]);

  const triggerUseItem = useCallback((itemName: string) => {
    return showFeedback('success', `Used ${itemName}`, 2000);
  }, [showFeedback]);

  const triggerDeleteItem = useCallback((itemName: string) => {
    return showFeedback('warning', `Deleted ${itemName}`, 2000);
  }, [showFeedback]);

  const triggerSaveLoadout = useCallback(() => {
    return showFeedback('info', 'Equipment loadout saved!', 2000);
  }, [showFeedback]);

  const triggerAutoSort = useCallback(() => {
    return showFeedback('info', 'Inventory sorted automatically', 2000);
  }, [showFeedback]);

  return {
    animations,
    feedbackQueue,
    showFeedback,
    removeFeedback,
    clearAllFeedback,
    // Pre-built triggers
    triggerEquipSuccess,
    triggerEquipError,
    triggerUseItem,
    triggerDeleteItem,
    triggerSaveLoadout,
    triggerAutoSort,
    // Animation configs for custom use
    fastConfig,
    normalConfig,
    slowConfig
  };
};

export default useInventoryAnimations;