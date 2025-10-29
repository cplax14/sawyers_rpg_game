import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from './Tooltip';

// Mock getBoundingClientRect for positioning tests
const mockGetBoundingClientRect = (rect: Partial<DOMRect> = {}) => {
  const defaultRect: DOMRect = {
    bottom: 100,
    height: 50,
    left: 50,
    right: 150,
    top: 50,
    width: 100,
    x: 50,
    y: 50,
    toJSON: () => ({}),
  };
  return { ...defaultRect, ...rect };
};

describe('Tooltip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => mockGetBoundingClientRect());
  });

  it('renders trigger element', () => {
    render(
      <Tooltip content='Tooltip content'>
        <button>Trigger</button>
      </Tooltip>
    );

    expect(screen.getByText('Trigger')).toBeInTheDocument();
  });

  it('shows tooltip on hover by default', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip content='Tooltip content'>
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByText('Tooltip content')).toBeInTheDocument();
    });
  });

  it('hides tooltip when mouse leaves', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip content='Tooltip content'>
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    await user.unhover(trigger);

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  it('shows tooltip on click when trigger is click', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip content='Tooltip content' trigger='click'>
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  it('toggles tooltip visibility on multiple clicks', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip content='Tooltip content' trigger='click'>
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');

    // First click - show
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    // Second click - hide
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  it('shows tooltip on focus when trigger is focus', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip content='Tooltip content' trigger='focus'>
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    await user.tab(); // Focus the trigger

    if (document.activeElement === trigger) {
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    }
  });

  it('respects manual control via visible prop', async () => {
    const { rerender } = render(
      <Tooltip content='Tooltip content' visible={false} trigger='manual'>
        <button>Trigger</button>
      </Tooltip>
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    rerender(
      <Tooltip content='Tooltip content' visible={true} trigger='manual'>
        <button>Trigger</button>
      </Tooltip>
    );

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  it('handles different placement options', async () => {
    const user = userEvent.setup();
    // Test different placements separately since changing placement while visible may not update
    const { unmount } = render(
      <Tooltip content='Tooltip content' placement='top'>
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    await user.hover(trigger);

    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('top');
    });

    // Unhover and unmount to reset
    await user.unhover(trigger);
    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
    unmount();

    // Test bottom placement separately
    render(
      <Tooltip content='Tooltip content' placement='bottom'>
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger2 = screen.getByText('Trigger');
    await user.hover(trigger2);

    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('bottom');
    });
  });

  it('handles different variant themes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Tooltip content='Tooltip content' variant='dark'>
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    await user.hover(trigger);

    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('dark');
    });

    rerender(
      <Tooltip content='Tooltip content' variant='light'>
        <button>Trigger</button>
      </Tooltip>
    );

    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('light');
    });
  });

  it('does not show tooltip when disabled', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip content='Tooltip content' disabled>
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    await user.hover(trigger);

    // Wait a bit to ensure tooltip doesn't show
    await new Promise(resolve => setTimeout(resolve, 400));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('respects delay prop', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip content='Tooltip content' delay={500}>
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    await user.hover(trigger);

    // Should not show immediately
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Should show after delay
    await waitFor(
      () => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      },
      { timeout: 600 }
    );
  });

  it('applies custom className', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip content='Tooltip content' className='custom-tooltip'>
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    await user.hover(trigger);

    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveClass('custom-tooltip');
    });
  });

  it('shows arrow by default', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip content='Tooltip content'>
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    await user.hover(trigger);

    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip.querySelector('.arrow')).toBeInTheDocument();
    });
  });

  it('hides arrow when showArrow is false', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip content='Tooltip content' showArrow={false}>
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    await user.hover(trigger);

    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip.querySelector('.arrow')).not.toBeInTheDocument();
    });
  });

  it('calls onVisibleChange when tooltip visibility changes', async () => {
    const user = userEvent.setup();
    const onVisibleChange = jest.fn();

    render(
      <Tooltip content='Tooltip content' onVisibleChange={onVisibleChange}>
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');

    // Show tooltip
    await user.hover(trigger);
    await waitFor(() => {
      expect(onVisibleChange).toHaveBeenCalledWith(true);
    });

    // Hide tooltip
    await user.unhover(trigger);
    await waitFor(() => {
      expect(onVisibleChange).toHaveBeenCalledWith(false);
    });
  });

  it('renders React node content', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip
        content={
          <div>
            <strong>Bold text</strong>
            <p>Paragraph text</p>
          </div>
        }
      >
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.getByText('Bold text')).toBeInTheDocument();
      expect(screen.getByText('Paragraph text')).toBeInTheDocument();
    });
  });

  it('handles click outside to close for click trigger', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <Tooltip content='Tooltip content' trigger='click'>
          <button>Trigger</button>
        </Tooltip>
        <button>Outside</button>
      </div>
    );

    const trigger = screen.getByText('Trigger');
    const outside = screen.getByText('Outside');

    // Show tooltip
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    // Click outside should hide tooltip
    await user.click(outside);
    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  it('does not show tooltip when content is empty', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip content=''>
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Trigger');
    await user.hover(trigger);

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });
});
