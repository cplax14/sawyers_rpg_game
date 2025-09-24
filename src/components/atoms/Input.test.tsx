import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('renders basic input correctly', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter text');
  });

  it('renders with label', () => {
    render(<Input label="Username" placeholder="Enter username" />);
    const label = screen.getByText('Username');
    const input = screen.getByRole('textbox');

    expect(label).toBeInTheDocument();
    expect(input).toHaveAccessibleName('Username');
  });

  it('shows required asterisk when required', () => {
    render(<Input label="Password" required />);
    const requiredIndicator = screen.getByLabelText('required');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveTextContent('*');
  });

  it('displays helper text', () => {
    render(<Input label="Email" helperText="Enter a valid email address" />);
    const helperText = screen.getByText('Enter a valid email address');
    expect(helperText).toBeInTheDocument();
  });

  it('displays error message and sets aria-invalid', () => {
    render(<Input label="Email" error="Invalid email format" />);
    const input = screen.getByRole('textbox');
    const errorMessage = screen.getByRole('alert');

    expect(errorMessage).toHaveTextContent('Invalid email format');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('error'));
  });

  it('prioritizes error message over helper text', () => {
    render(
      <Input
        label="Email"
        helperText="Enter your email"
        error="Invalid format"
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid format');
    expect(screen.queryByText('Enter your email')).not.toBeInTheDocument();
  });

  it('handles size variants', () => {
    const { rerender } = render(<Input size="sm" data-testid="input-sm" />);
    expect(screen.getByTestId('input-sm')).toHaveClass('sm');

    rerender(<Input size="md" data-testid="input-md" />);
    expect(screen.getByTestId('input-md')).toHaveClass('md');

    rerender(<Input size="lg" data-testid="input-lg" />);
    expect(screen.getByTestId('input-lg')).toHaveClass('lg');
  });

  it('handles style variants', () => {
    const { rerender } = render(<Input variant="default" data-testid="input-default" />);
    expect(screen.getByTestId('input-default')).toHaveClass('default');

    rerender(<Input variant="search" data-testid="input-search" />);
    expect(screen.getByTestId('input-search')).toHaveClass('search');

    rerender(<Input variant="password" data-testid="input-password" />);
    expect(screen.getByTestId('input-password')).toHaveClass('password');
  });

  it('renders password toggle button for password variant', () => {
    render(<Input variant="password" label="Password" />);
    const toggleButton = screen.getByLabelText('Show password');
    expect(toggleButton).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<Input variant="password" label="Password" />);

    const input = screen.getByLabelText('Password');
    const toggleButton = screen.getByLabelText('Show password');

    // Initially password type
    expect(input).toHaveAttribute('type', 'password');

    // Click to show password
    await user.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();

    // Click to hide password again
    await user.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Show password')).toBeInTheDocument();
  });

  it('renders icons correctly', () => {
    const iconBefore = <span data-testid="icon-before">🔍</span>;
    const iconAfter = <span data-testid="icon-after">✓</span>;

    render(
      <Input
        iconBefore={iconBefore}
        iconAfter={iconAfter}
        data-testid="input-with-icons"
      />
    );

    expect(screen.getByTestId('icon-before')).toBeInTheDocument();
    expect(screen.getByTestId('icon-after')).toBeInTheDocument();
    expect(screen.getByTestId('input-with-icons')).toHaveClass('hasIconBefore', 'hasIconAfter');
  });

  it('does not render iconAfter when variant is password', () => {
    const iconAfter = <span data-testid="icon-after">✓</span>;

    render(
      <Input
        variant="password"
        iconAfter={iconAfter}
      />
    );

    expect(screen.queryByTestId('icon-after')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Show password')).toBeInTheDocument();
  });

  it('handles focus and blur events', async () => {
    const user = userEvent.setup();
    render(<Input data-testid="focus-input" />);

    const input = screen.getByTestId('focus-input');

    await user.click(input);
    expect(input).toHaveClass('focused');

    await user.tab(); // Move focus away
    expect(input).not.toHaveClass('focused');
  });

  it('handles disabled state', () => {
    render(<Input disabled data-testid="disabled-input" />);
    const input = screen.getByTestId('disabled-input');

    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled');
  });

  it('applies fullWidth class correctly', () => {
    const { container } = render(<Input fullWidth />);
    const inputContainer = container.firstChild;
    expect(inputContainer).toHaveClass('fullWidth');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('handles custom className', () => {
    const { container } = render(<Input className="custom-class" />);
    const inputContainer = container.firstChild;
    expect(inputContainer).toHaveClass('custom-class');
  });

  it('generates unique IDs for accessibility', () => {
    render(
      <>
        <Input label="First Input" />
        <Input label="Second Input" />
      </>
    );

    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0].id).toBeDefined();
    expect(inputs[1].id).toBeDefined();
    expect(inputs[0].id).not.toBe(inputs[1].id);
  });

  it('uses provided ID when given', () => {
    render(<Input id="custom-id" label="Custom Input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'custom-id');
  });

  it('handles typing and value changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'test value');
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('test value');
  });

  it('handles framer motion props', () => {
    render(
      <Input
        whileFocus={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        data-testid="motion-input"
      />
    );

    const input = screen.getByTestId('motion-input');
    expect(input).toBeInTheDocument();
  });
});