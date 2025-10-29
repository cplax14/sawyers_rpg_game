import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = '';
  });

  it('renders when open', () => {
    render(<Modal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<Modal {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Modal {...defaultProps} title='Test Modal' />);

    const title = screen.getByText('Test Modal');
    expect(title).toBeInTheDocument();
    expect(title).toHaveAttribute('id', 'modal-title');
  });

  it('renders close button by default', () => {
    render(<Modal {...defaultProps} />);

    const closeButton = screen.getByLabelText('Close modal');
    expect(closeButton).toBeInTheDocument();
  });

  it('hides close button when showCloseButton is false', () => {
    render(<Modal {...defaultProps} showCloseButton={false} />);

    expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<Modal {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByLabelText('Close modal');
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when escape key is pressed', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<Modal {...defaultProps} onClose={onClose} />);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on escape when closeOnEscape is false', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />);

    await user.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<Modal {...defaultProps} onClose={onClose} />);

    // Click on the overlay (not the modal content)
    const overlay = screen.getByRole('dialog').parentElement;
    if (overlay) {
      await user.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('does not close when overlay is clicked and closeOnOverlayClick is false', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false} />);

    const overlay = screen.getByRole('dialog').parentElement;
    if (overlay) {
      await user.click(overlay);
      expect(onClose).not.toHaveBeenCalled();
    }
  });

  it('does not close when modal content is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<Modal {...defaultProps} onClose={onClose} />);

    const modal = screen.getByRole('dialog');
    await user.click(modal);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('handles different size variants', () => {
    const { rerender } = render(<Modal {...defaultProps} size='sm' />);
    expect(screen.getByRole('dialog')).toHaveClass('sm');

    rerender(<Modal {...defaultProps} size='md' />);
    expect(screen.getByRole('dialog')).toHaveClass('md');

    rerender(<Modal {...defaultProps} size='lg' />);
    expect(screen.getByRole('dialog')).toHaveClass('lg');

    rerender(<Modal {...defaultProps} size='xl' />);
    expect(screen.getByRole('dialog')).toHaveClass('xl');
  });

  it('applies custom className', () => {
    render(<Modal {...defaultProps} className='custom-modal' />);

    expect(screen.getByRole('dialog')).toHaveClass('custom-modal');
  });

  it('applies custom overlay className', () => {
    render(<Modal {...defaultProps} overlayClassName='custom-overlay' />);

    const overlay = screen.getByRole('dialog').parentElement;
    expect(overlay).toHaveClass('custom-overlay');
  });

  it('prevents body scroll when open', () => {
    render(<Modal {...defaultProps} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', () => {
    const { rerender } = render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<Modal {...defaultProps} isOpen={false} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('does not prevent body scroll when preventBodyScroll is false', () => {
    render(<Modal {...defaultProps} preventBodyScroll={false} />);

    expect(document.body.style.overflow).toBe('');
  });

  it('sets proper ARIA attributes', () => {
    render(<Modal {...defaultProps} title='Test Modal' />);

    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(modal).toHaveAttribute('tabIndex', '-1');
  });

  it('focuses modal when opened', async () => {
    render(<Modal {...defaultProps} />);

    await waitFor(() => {
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveFocus();
    });
  });

  it('handles focus trap with tab navigation', async () => {
    const user = userEvent.setup();

    render(
      <Modal {...defaultProps} title='Test Modal'>
        <button>First button</button>
        <button>Second button</button>
        <input placeholder='Test input' />
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close modal');
    const firstButton = screen.getByText('First button');
    const secondButton = screen.getByText('Second button');
    const input = screen.getByPlaceholderText('Test input');

    // Focus should be on modal initially
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveFocus();
    });

    // Tab through elements
    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.tab();
    expect(firstButton).toHaveFocus();

    await user.tab();
    expect(secondButton).toHaveFocus();

    await user.tab();
    expect(input).toHaveFocus();

    // Tab from last element should cycle to first
    await user.tab();
    expect(closeButton).toHaveFocus();
  });

  it('handles reverse tab navigation', async () => {
    const user = userEvent.setup();

    render(
      <Modal {...defaultProps} title='Test Modal'>
        <button>First button</button>
        <button>Second button</button>
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close modal');
    const secondButton = screen.getByText('Second button');

    // Focus the close button first
    closeButton.focus();

    // Shift+Tab from first element should go to last
    await user.tab({ shift: true });
    expect(secondButton).toHaveFocus();
  });

  it('disables focus trap when disableFocusTrap is true', () => {
    render(<Modal {...defaultProps} disableFocusTrap={true} />);

    // Modal should not automatically focus when focus trap is disabled
    const modal = screen.getByRole('dialog');
    expect(modal).not.toHaveFocus();
  });

  it('animates in and out properly', async () => {
    const { rerender } = render(<Modal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(<Modal {...defaultProps} isOpen={false} />);

    // Modal should be removed from DOM after close
    // Note: In test environment, framer-motion animations are instant
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
