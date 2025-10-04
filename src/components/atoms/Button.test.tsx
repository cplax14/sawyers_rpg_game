import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn-button', 'btn-primary', 'btn-md');
  });

  it('renders different variants correctly', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-danger');

    rerender(<Button variant="success">Success</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-success');
  });

  it('renders different sizes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-sm');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-lg');
  });

  it('handles disabled state', () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('btn-disabled');
  });

  it('handles loading state', () => {
    render(<Button loading>Loading</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('btn-loading');

    // Should have spinner
    const spinner = button.querySelector('.btn-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with icons', () => {
    const beforeIcon = <span data-testid="before-icon">🚀</span>;
    const afterIcon = <span data-testid="after-icon">✨</span>;

    render(
      <Button iconBefore={beforeIcon} iconAfter={afterIcon}>
        With Icons
      </Button>
    );

    expect(screen.getByTestId('before-icon')).toBeInTheDocument();
    expect(screen.getByTestId('after-icon')).toBeInTheDocument();
  });

  it('handles full width', () => {
    render(<Button fullWidth>Full Width</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-full-width');
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<Button onClick={handleClick}>Clickable</Button>);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire click when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<Button onClick={handleClick} disabled>Disabled</Button>);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not fire click when loading', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<Button onClick={handleClick} loading>Loading</Button>);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();

    render(<Button ref={ref}>Button</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.tagName).toBe('BUTTON');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('passes through HTML attributes', () => {
    render(
      <Button type="submit" data-testid="submit-button">
        Submit
      </Button>
    );

    const button = screen.getByTestId('submit-button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('maintains accessibility with screen readers', () => {
    render(
      <Button aria-label="Custom aria label" aria-describedby="help-text">
        Button
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Custom aria label');
    expect(button).toHaveAttribute('aria-describedby', 'help-text');
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Keyboard</Button>);

    const button = screen.getByRole('button');
    button.focus();

    expect(button).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalled();
  });
});