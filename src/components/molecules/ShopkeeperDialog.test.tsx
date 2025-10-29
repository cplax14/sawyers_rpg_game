import React from 'react';
import { render, screen } from '@testing-library/react';
import { ShopkeeperDialog } from './ShopkeeperDialog';

describe('ShopkeeperDialog', () => {
  it('renders with required props', () => {
    render(<ShopkeeperDialog shopkeeper='Rosie' message='Welcome to my shop!' />);

    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByText('Rosie')).toBeInTheDocument();
    expect(screen.getByText(/Welcome to my shop!/)).toBeInTheDocument();
  });

  it('displays shopkeeper name', () => {
    render(<ShopkeeperDialog shopkeeper='Bob the Blacksmith' message='Need some weapons?' />);

    expect(screen.getByText('Bob the Blacksmith')).toBeInTheDocument();
  });

  it('displays message text', () => {
    render(
      <ShopkeeperDialog
        shopkeeper='Test Shopkeeper'
        message='This is a test message for the shopkeeper dialogue system.'
      />
    );

    expect(screen.getByText(/This is a test message/)).toBeInTheDocument();
  });

  describe('mood variants', () => {
    it('renders happy mood', () => {
      const { container } = render(
        <ShopkeeperDialog shopkeeper='Happy Harry' message='Great to see you!' mood='happy' />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
      // Happy emoji should be present
      expect(screen.getByText(/😊/)).toBeInTheDocument();
    });

    it('renders neutral mood (default)', () => {
      const { container } = render(
        <ShopkeeperDialog shopkeeper='Neutral Nancy' message='Hello there.' mood='neutral' />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByText(/🙂/)).toBeInTheDocument();
    });

    it('renders grumpy mood', () => {
      const { container } = render(
        <ShopkeeperDialog shopkeeper='Grumpy Gus' message='What do you want?' mood='grumpy' />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByText(/😠/)).toBeInTheDocument();
    });

    it('renders excited mood', () => {
      const { container } = render(
        <ShopkeeperDialog
          shopkeeper='Excited Eddie'
          message='Wow! Check out these items!'
          mood='excited'
        />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByText(/🤩/)).toBeInTheDocument();
    });

    it('renders helpful mood', () => {
      const { container } = render(
        <ShopkeeperDialog
          shopkeeper='Helpful Helen'
          message='Let me help you find what you need!'
          mood='helpful'
        />
      );

      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByText(/🤗/)).toBeInTheDocument();
    });
  });

  describe('avatar display', () => {
    it('displays custom avatar when provided', () => {
      render(<ShopkeeperDialog shopkeeper='Custom Shopkeeper' message='Hello!' avatar='👨‍🔧' />);

      expect(screen.getByText('👨‍🔧')).toBeInTheDocument();
    });

    it('displays default avatar based on mood when no avatar provided', () => {
      render(<ShopkeeperDialog shopkeeper='Default Avatar' message='Hello!' mood='happy' />);

      // Happy mood default avatar is 🧙
      expect(screen.getByText('🧙')).toBeInTheDocument();
    });

    it('displays neutral avatar for neutral mood', () => {
      render(<ShopkeeperDialog shopkeeper='Neutral Person' message='Hello.' mood='neutral' />);

      expect(screen.getByText('🧑‍💼')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('provides accessible region role', () => {
      render(<ShopkeeperDialog shopkeeper='Test Shopkeeper' message='Test message' />);

      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
    });

    it('provides aria-label with shopkeeper name and message', () => {
      render(<ShopkeeperDialog shopkeeper='Rosie' message='Welcome to my shop!' />);

      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-label', 'Rosie says: Welcome to my shop!');
    });

    it('marks as aria-live for dynamic updates', () => {
      render(<ShopkeeperDialog shopkeeper='Test' message='Test' />);

      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-live', 'polite');
    });

    it('marks decorative elements as aria-hidden', () => {
      const { container } = render(<ShopkeeperDialog shopkeeper='Test' message='Test' />);

      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });
  });

  describe('message formatting', () => {
    it('handles short messages', () => {
      render(<ShopkeeperDialog shopkeeper='Short' message='Hi!' />);

      expect(screen.getByText(/Hi!/)).toBeInTheDocument();
    });

    it('handles long messages', () => {
      const longMessage =
        'Welcome to my shop! We have the finest weapons, armor, and potions in all the land. Take your time browsing and let me know if you need any help finding something specific!';

      render(<ShopkeeperDialog shopkeeper='Verbose Vendor' message={longMessage} />);

      expect(screen.getByText(new RegExp(longMessage.substring(0, 20)))).toBeInTheDocument();
    });

    it('handles special characters in message', () => {
      render(
        <ShopkeeperDialog
          shopkeeper='Special'
          message="Hello! How's your adventure going? I've got great deals today!"
        />
      );

      expect(screen.getByText(/How's your adventure/)).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    render(<ShopkeeperDialog shopkeeper='Test' message='Test' className='custom-dialog-class' />);

    const region = screen.getByRole('region');
    expect(region).toHaveClass('custom-dialog-class');
  });

  describe('visual elements', () => {
    it('renders speech bubble structure', () => {
      const { container } = render(<ShopkeeperDialog shopkeeper='Test' message='Test message' />);

      // Speech bubble should be present
      expect(container.querySelector('p')).toBeInTheDocument();
    });

    it('includes mood indicator emoji', () => {
      render(<ShopkeeperDialog shopkeeper='Happy Person' message='Great day!' mood='happy' />);

      // Happy emoji should be in the message
      expect(screen.getByText(/😊/)).toBeInTheDocument();
    });
  });

  describe('kid-friendly content', () => {
    it('displays encouraging messages appropriately', () => {
      render(
        <ShopkeeperDialog
          shopkeeper='Friendly Vendor'
          message="You're doing great! Keep up the good work, young adventurer!"
          mood='happy'
        />
      );

      expect(screen.getByText(/You're doing great!/)).toBeInTheDocument();
    });

    it('displays helpful tips appropriately', () => {
      render(
        <ShopkeeperDialog
          shopkeeper='Wise Merchant'
          message='Remember, health potions can save your life in tough battles!'
          mood='helpful'
        />
      );

      expect(screen.getByText(/health potions can save your life/)).toBeInTheDocument();
    });
  });
});
