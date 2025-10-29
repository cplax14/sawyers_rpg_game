import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShopTutorial, TutorialStep } from './ShopTutorial';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
      button: React.forwardRef(({ children, ...props }: any, ref: any) => (
        <button ref={ref} {...props}>
          {children}
        </button>
      )),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock the useGameState hook
jest.mock('../../contexts/ReactGameContext', () => ({
  useGameState: () => ({
    state: {
      shops: {
        shopTutorialCompleted: false,
      },
    },
    dispatch: jest.fn(),
  }),
}));

describe('ShopTutorial', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when isFirstVisit is false', () => {
      const { container } = render(
        <ShopTutorial isFirstVisit={false} onComplete={mockOnComplete} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders tutorial overlay when isFirstVisit is true', () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/tutorial/i)).toBeInTheDocument();
    });

    it('displays first step title and description', () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      expect(screen.getByText('Welcome to the Shop!')).toBeInTheDocument();
      expect(
        screen.getByText(/Hello, young adventurer! Let me show you how shops work/i)
      ).toBeInTheDocument();
    });

    it('displays step indicator showing current progress', () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
    });

    it('displays tutorial icon for each step', () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      // First step has shop icon
      expect(screen.getByText('🏪')).toBeInTheDocument();
    });

    it('displays progress bar with correct initial width', () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      // Progress bar should show ~16.67% (1/6 steps)
      const progressBar = document.querySelector('[style*="width"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('shows "Next" button on first step', () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      const nextButton = screen.getByRole('button', { name: /next step/i });
      expect(nextButton).toBeInTheDocument();
      expect(nextButton).toHaveTextContent('Next →');
    });

    it('does not show "Previous" button on first step', () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      const previousButton = screen.queryByRole('button', { name: /previous step/i });
      expect(previousButton).not.toBeInTheDocument();
    });

    it('advances to next step when "Next" button is clicked', async () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      const nextButton = screen.getByRole('button', { name: /next step/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
        expect(screen.getByText('Browse Items')).toBeInTheDocument();
      });
    });

    it('shows "Previous" button after advancing from first step', async () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      const nextButton = screen.getByRole('button', { name: /next step/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        const previousButton = screen.getByRole('button', { name: /previous step/i });
        expect(previousButton).toBeInTheDocument();
      });
    });

    it('returns to previous step when "Previous" button is clicked', async () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      // Advance to step 2
      const nextButton = screen.getByRole('button', { name: /next step/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
      });

      // Go back to step 1
      const previousButton = screen.getByRole('button', { name: /previous step/i });
      fireEvent.click(previousButton);

      await waitFor(() => {
        expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
        expect(screen.getByText('Welcome to the Shop!')).toBeInTheDocument();
      });
    });

    it('shows "Got It!" button on last step', async () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      // Navigate to last step (step 6)
      for (let i = 0; i < 5; i++) {
        const nextButton = screen.getByRole('button', { name: /next step|finish tutorial/i });
        fireEvent.click(nextButton);
      }

      await waitFor(() => {
        const finishButton = screen.getByRole('button', { name: /finish tutorial/i });
        expect(finishButton).toHaveTextContent('Got It!');
      });
    });

    it('calls onComplete when "Got It!" button is clicked on last step', async () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      // Navigate to last step
      for (let i = 0; i < 5; i++) {
        const nextButton = screen.getByRole('button', { name: /next step|finish tutorial/i });
        fireEvent.click(nextButton);
      }

      await waitFor(() => {
        const finishButton = screen.getByRole('button', { name: /finish tutorial/i });
        fireEvent.click(finishButton);

        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('always shows "Skip Tutorial" button', () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      const skipButton = screen.getByRole('button', { name: /skip tutorial/i });
      expect(skipButton).toBeInTheDocument();
      expect(skipButton).toHaveTextContent('Skip Tutorial');
    });

    it('calls onComplete when "Skip Tutorial" button is clicked', () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      const skipButton = screen.getByRole('button', { name: /skip tutorial/i });
      fireEvent.click(skipButton);

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Navigation', () => {
    it('advances to next step when Enter key is pressed', async () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      fireEvent.keyDown(window, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
      });
    });

    it('advances to next step when ArrowRight key is pressed', async () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      await waitFor(() => {
        expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
      });
    });

    it('returns to previous step when ArrowLeft key is pressed', async () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      // Advance to step 2
      fireEvent.keyDown(window, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Step 2 of 6')).toBeInTheDocument();
      });

      // Go back to step 1
      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      await waitFor(() => {
        expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
      });
    });

    it('does not go before first step when ArrowLeft is pressed', () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      // Try to go back from first step
      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      // Should still be on first step
      expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
      expect(screen.getByText('Welcome to the Shop!')).toBeInTheDocument();
    });

    it('calls onComplete when Escape key is pressed', () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('calls onComplete when Enter is pressed on last step', async () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      // Navigate to last step using keyboard
      for (let i = 0; i < 6; i++) {
        fireEvent.keyDown(window, { key: 'Enter' });
        await waitFor(() => {}, { timeout: 100 });
      }

      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  describe('Progress Bar', () => {
    it('updates progress bar width as steps advance', async () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      const nextButton = screen.getByRole('button', { name: /next step/i });

      // Check initial progress (step 1 = 16.67%)
      let progressFill = document.querySelector('[style*="width: 16"]');
      expect(progressFill).toBeInTheDocument();

      // Advance to step 2 (33.33%)
      fireEvent.click(nextButton);
      await waitFor(() => {
        progressFill = document.querySelector('[style*="width: 33"]');
        expect(progressFill).toBeInTheDocument();
      });

      // Advance to step 3 (50%)
      fireEvent.click(nextButton);
      await waitFor(() => {
        progressFill = document.querySelector('[style*="width: 50"]');
        expect(progressFill).toBeInTheDocument();
      });
    });

    it('shows 100% progress on last step', async () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      // Navigate to last step
      for (let i = 0; i < 5; i++) {
        const nextButton = screen.getByRole('button', { name: /next step|finish tutorial/i });
        fireEvent.click(nextButton);
        await waitFor(() => {}, { timeout: 100 });
      }

      await waitFor(() => {
        const progressFill = document.querySelector('[style*="width: 100"]');
        expect(progressFill).toBeInTheDocument();
      });
    });
  });

  describe('Tutorial Steps Content', () => {
    it('displays all 6 tutorial steps in correct order', async () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      const expectedSteps = [
        'Welcome to the Shop!',
        'Browse Items',
        'Buying Items',
        'Selling Your Stuff',
        'Check Your Gold',
        "You're All Set!",
      ];

      for (let i = 0; i < expectedSteps.length; i++) {
        await waitFor(() => {
          expect(screen.getByText(expectedSteps[i])).toBeInTheDocument();
        });

        if (i < expectedSteps.length - 1) {
          const nextButton = screen.getByRole('button', { name: /next step|finish tutorial/i });
          fireEvent.click(nextButton);
        }
      }
    });

    it('displays age-appropriate encouraging language', () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      // Check for kid-friendly language
      expect(screen.getByText(/young adventurer/i)).toBeInTheDocument();
    });

    it('includes icon emojis for visual engagement', async () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      const expectedIcons = ['🏪', '🔍', '🛒', '💰', '🪙', '🎉'];

      for (let i = 0; i < expectedIcons.length; i++) {
        expect(screen.getByText(expectedIcons[i])).toBeInTheDocument();

        if (i < expectedIcons.length - 1) {
          const nextButton = screen.getByRole('button', { name: /next step|finish tutorial/i });
          fireEvent.click(nextButton);
          await waitFor(() => {}, { timeout: 100 });
        }
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'tutorial-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'tutorial-description');
    });

    it('has accessible button labels', () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      expect(screen.getByRole('button', { name: /next step/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /skip tutorial/i })).toBeInTheDocument();
    });

    it('updates ARIA label when reaching last step', async () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      // Navigate to last step
      for (let i = 0; i < 5; i++) {
        const nextButton = screen.getByRole('button', { name: /next step|finish tutorial/i });
        fireEvent.click(nextButton);
        await waitFor(() => {}, { timeout: 100 });
      }

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /finish tutorial/i })).toBeInTheDocument();
      });
    });
  });

  describe('Spotlight Effect', () => {
    beforeEach(() => {
      // Mock getBoundingClientRect for target elements
      Element.prototype.getBoundingClientRect = jest.fn(() => ({
        top: 100,
        left: 100,
        width: 200,
        height: 50,
        bottom: 150,
        right: 300,
        x: 100,
        y: 100,
        toJSON: () => {},
      }));
    });

    it('does not render spotlight on center-positioned steps', () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      // First step has center position, no spotlight
      const spotlight = document.querySelector('[style*="border: 3px solid #fbbf24"]');
      expect(spotlight).not.toBeInTheDocument();
    });

    it('renders spotlight when step has target selector', async () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      // Add mock element for tutorial target
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-tutorial', 'category-filter');
      document.body.appendChild(mockElement);

      // Navigate to step with target selector (step 2)
      const nextButton = screen.getByRole('button', { name: /next step/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Browse Items')).toBeInTheDocument();
      });

      // Clean up
      document.body.removeChild(mockElement);
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid navigation clicks gracefully', async () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      const nextButton = screen.getByRole('button', { name: /next step/i });

      // Click rapidly
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      await waitFor(() => {
        // Should advance to at least step 2
        expect(screen.getByText(/Step [2-6] of 6/)).toBeInTheDocument();
      });
    });

    it('handles missing tutorial targets gracefully', async () => {
      render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      // Navigate to step with target selector but no matching element
      const nextButton = screen.getByRole('button', { name: /next step/i });
      fireEvent.click(nextButton);

      // Should still render without crashing
      await waitFor(() => {
        expect(screen.getByText('Browse Items')).toBeInTheDocument();
      });
    });

    it('cleans up event listeners on unmount', () => {
      const { unmount } = render(<ShopTutorial isFirstVisit={true} onComplete={mockOnComplete} />);

      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });
});
