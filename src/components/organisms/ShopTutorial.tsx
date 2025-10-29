import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { useGameState } from '../../contexts/ReactGameContext';

/**
 * Tutorial step configuration
 */
export interface TutorialStep {
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Target element selector for spotlight effect */
  targetSelector?: string;
  /** Position of the tutorial content relative to target */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Icon to display with the step */
  icon?: string;
}

/**
 * Props for ShopTutorial component
 */
export interface ShopTutorialProps {
  /** Whether this is the player's first shop visit */
  isFirstVisit: boolean;
  /** Callback when tutorial is completed or skipped */
  onComplete: () => void;
  /** Additional className */
  className?: string;
}

// Tutorial steps for shop system
const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to the Shop!',
    description:
      'Hello, young adventurer! Let me show you how shops work in our world. You can buy helpful items and sell things you have collected!',
    position: 'center',
    icon: '🏪',
  },
  {
    title: 'Browse Items',
    description:
      'Use the category buttons to filter items, or search for something specific. Items are organized by type: weapons, armor, consumables, and more!',
    targetSelector: '[data-tutorial="category-filter"]',
    position: 'bottom',
    icon: '🔍',
  },
  {
    title: 'Buying Items',
    description:
      'When you find something you want, click on it to see more details. Then click "Buy" to purchase it with your gold. Make sure you have enough gold!',
    targetSelector: '[data-tutorial="item-listing"]',
    position: 'right',
    icon: '🛒',
  },
  {
    title: 'Selling Your Stuff',
    description:
      'Click the "Sell Items" tab to switch to selling mode. You can sell items from your inventory to earn gold. Different shops buy different types of items!',
    targetSelector: '[data-tutorial="sell-tab"]',
    position: 'bottom',
    icon: '💰',
  },
  {
    title: 'Check Your Gold',
    description:
      'Your gold balance is always shown at the top. Keep track of how much you have so you can plan your purchases wisely!',
    targetSelector: '[data-tutorial="gold-balance"]',
    position: 'bottom',
    icon: '🪙',
  },
  {
    title: "You're All Set!",
    description:
      'Great job! You now know how to use shops. Explore, buy better equipment, and sell your loot to become the best adventurer ever!',
    position: 'center',
    icon: '🎉',
  },
];

// Styles
const tutorialStyles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    zIndex: 2000,
    pointerEvents: 'auto' as const,
  },
  spotlight: {
    position: 'fixed' as const,
    border: '3px solid #fbbf24',
    borderRadius: '12px',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8), 0 0 20px #fbbf24',
    pointerEvents: 'none' as const,
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 2001,
  },
  contentContainer: {
    position: 'fixed' as const,
    zIndex: 2002,
    maxWidth: '500px',
    padding: '2rem',
  },
  content: {
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    borderRadius: '20px',
    padding: '2rem',
    border: '3px solid #fbbf24',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(251, 191, 36, 0.3)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  icon: {
    fontSize: '3rem',
    lineHeight: 1,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold' as const,
    color: '#fbbf24',
    margin: '0 0 0.25rem 0',
  },
  stepIndicator: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: 0,
  },
  description: {
    fontSize: '1.0625rem',
    lineHeight: 1.6,
    color: '#e2e8f0',
    marginBottom: '2rem',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.75rem',
  },
  skipButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    background: 'transparent',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  progressBar: {
    width: '100%',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '2px',
    overflow: 'hidden',
    marginTop: '1.5rem',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

/**
 * ShopTutorial - Interactive overlay tutorial for shop system
 *
 * Multi-step tutorial that guides players through shop features on their first visit.
 * Includes spotlight effects, step-by-step progression, and clear visual indicators.
 * Designed for ages 7-12 with encouraging, easy-to-understand language.
 *
 * Features:
 * - 6 tutorial steps covering all shop features
 * - Spotlight effect highlighting relevant UI elements
 * - Next/Previous/Skip navigation
 * - Progress indicator
 * - Keyboard navigation (Enter, Escape, Arrow keys)
 * - Persistent completion state
 * - Age-appropriate language and encouragement
 *
 * @example
 * ```tsx
 * <ShopTutorial
 *   isFirstVisit={!state.shops?.shopTutorialCompleted}
 *   onComplete={() => dispatch({ type: 'COMPLETE_SHOP_TUTORIAL' })}
 * />
 * ```
 */
export const ShopTutorial: React.FC<ShopTutorialProps> = ({
  isFirstVisit,
  onComplete,
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [contentPosition, setContentPosition] = useState({
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  });
  const contentRef = useRef<HTMLDivElement>(null);

  // Don't show tutorial if not first visit
  if (!isFirstVisit) {
    return null;
  }

  const currentTutorialStep = TUTORIAL_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  /**
   * Update spotlight and content position based on target element
   */
  const updatePositions = useCallback(() => {
    const step = TUTORIAL_STEPS[currentStep];

    if (!step.targetSelector) {
      // Center position for steps without target
      setSpotlightRect(null);
      setContentPosition({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
      return;
    }

    // Wait a bit for DOM to be ready
    setTimeout(() => {
      const targetElement = document.querySelector(step.targetSelector!) as HTMLElement;

      if (!targetElement) {
        console.warn(`Tutorial target not found: ${step.targetSelector}`);
        setSpotlightRect(null);
        setContentPosition({
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        });
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      setSpotlightRect(rect);

      // Calculate content position based on step position
      const padding = 20;
      let newPosition: any = {};

      switch (step.position) {
        case 'top':
          newPosition = {
            left: `${rect.left + rect.width / 2}px`,
            bottom: `${window.innerHeight - rect.top + padding}px`,
            transform: 'translateX(-50%)',
          };
          break;
        case 'bottom':
          newPosition = {
            left: `${rect.left + rect.width / 2}px`,
            top: `${rect.bottom + padding}px`,
            transform: 'translateX(-50%)',
          };
          break;
        case 'left':
          newPosition = {
            right: `${window.innerWidth - rect.left + padding}px`,
            top: `${rect.top + rect.height / 2}px`,
            transform: 'translateY(-50%)',
          };
          break;
        case 'right':
          newPosition = {
            left: `${rect.right + padding}px`,
            top: `${rect.top + rect.height / 2}px`,
            transform: 'translateY(-50%)',
          };
          break;
        default:
          newPosition = {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          };
      }

      setContentPosition(newPosition);
    }, 100);
  }, [currentStep]);

  // Update positions when step changes or window resizes
  useEffect(() => {
    updatePositions();

    const handleResize = () => updatePositions();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [updatePositions]);

  /**
   * Navigate to next step
   */
  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastStep, onComplete]);

  /**
   * Navigate to previous step
   */
  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  }, [isFirstStep]);

  /**
   * Skip tutorial entirely
   */
  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'Escape':
          e.preventDefault();
          handleSkip();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious, handleSkip]);

  return (
    <AnimatePresence>
      <motion.div
        style={tutorialStyles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        role='dialog'
        aria-modal='true'
        aria-labelledby='tutorial-title'
        aria-describedby='tutorial-description'
      >
        {/* Spotlight effect */}
        {spotlightRect && (
          <motion.div
            style={{
              ...tutorialStyles.spotlight,
              top: `${spotlightRect.top}px`,
              left: `${spotlightRect.left}px`,
              width: `${spotlightRect.width}px`,
              height: `${spotlightRect.height}px`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}

        {/* Tutorial content */}
        <motion.div
          ref={contentRef}
          className={className}
          style={{
            ...tutorialStyles.contentContainer,
            ...contentPosition,
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div style={tutorialStyles.content}>
            {/* Header */}
            <div style={tutorialStyles.header}>
              {currentTutorialStep.icon && (
                <span style={tutorialStyles.icon} aria-hidden='true'>
                  {currentTutorialStep.icon}
                </span>
              )}
              <div style={tutorialStyles.titleSection}>
                <h2 id='tutorial-title' style={tutorialStyles.title}>
                  {currentTutorialStep.title}
                </h2>
                <p style={tutorialStyles.stepIndicator}>
                  Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                </p>
              </div>
            </div>

            {/* Description */}
            <p id='tutorial-description' style={tutorialStyles.description}>
              {currentTutorialStep.description}
            </p>

            {/* Footer */}
            <div style={tutorialStyles.footer}>
              <button
                style={tutorialStyles.skipButton}
                onClick={handleSkip}
                aria-label='Skip tutorial'
              >
                Skip Tutorial
              </button>

              <div style={tutorialStyles.buttonGroup}>
                {!isFirstStep && (
                  <Button
                    variant='secondary'
                    size='md'
                    onClick={handlePrevious}
                    aria-label='Previous step'
                  >
                    ← Previous
                  </Button>
                )}

                <Button
                  variant='primary'
                  size='md'
                  onClick={handleNext}
                  aria-label={isLastStep ? 'Finish tutorial' : 'Next step'}
                >
                  {isLastStep ? 'Got It!' : 'Next →'}
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div style={tutorialStyles.progressBar}>
              <div
                style={{
                  ...tutorialStyles.progressFill,
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShopTutorial;
