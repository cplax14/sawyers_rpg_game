/**
 * Unit Tests for validateParticleCount
 *
 * Tests the particle count validation function that enforces performance limits
 * Task 5.10: Particle count validation
 */

import { validateParticleCount } from '../types';

describe('validateParticleCount', () => {
  let consoleError: jest.SpyInstance;
  let consoleWarn: jest.SpyInstance;

  beforeEach(() => {
    // Mock console methods
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  describe('Development Mode Behavior', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('does not log anything for counts within recommended limits', () => {
      // Arrange
      const count = 15;
      const componentName = 'FireballAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('does not log for counts at exactly recommended max (20)', () => {
      // Arrange
      const count = 20;
      const componentName = 'IceShardAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('warns when count exceeds recommended max but is below hard max', () => {
      // Arrange
      const count = 25;
      const componentName = 'LightningAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('LightningAnimation')
      );
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Particle count (25)')
      );
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('exceeds recommended max (20)')
      );
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('warns for count at 21 (just above recommended)', () => {
      // Arrange
      const count = 21;
      const componentName = 'MeteorAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Particle count (21)')
      );
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('warns for count at exactly hard max (30)', () => {
      // Arrange
      const count = 30;
      const componentName = 'HolyBeamAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Particle count (30)')
      );
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('errors when count exceeds hard maximum (31+)', () => {
      // Arrange
      const count = 31;
      const componentName = 'FireballAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('FireballAnimation')
      );
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Particle count (31)')
      );
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('EXCEEDS maximum (30)')
      );
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('performance issues')
      );
    });

    it('errors for very high particle counts', () => {
      // Arrange
      const count = 100;
      const componentName = 'TestAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Particle count (100)')
      );
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('EXCEEDS maximum (30)')
      );
    });

    it('includes phase information when provided', () => {
      // Arrange
      const count = 25;
      const componentName = 'FireballAnimation';
      const phase = 'impact';

      // Act
      validateParticleCount(count, componentName, phase);

      // Assert
      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('FireballAnimation - impact')
      );
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Particle count (25)')
      );
    });

    it('includes different phases correctly', () => {
      // Arrange & Act
      validateParticleCount(25, 'MeteorAnimation', 'charge');
      validateParticleCount(25, 'MeteorAnimation', 'travel');
      validateParticleCount(25, 'MeteorAnimation', 'impact');

      // Assert
      expect(consoleWarn).toHaveBeenCalledTimes(3);
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('MeteorAnimation - charge')
      );
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('MeteorAnimation - travel')
      );
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('MeteorAnimation - impact')
      );
    });

    it('works without phase parameter', () => {
      // Arrange
      const count = 25;
      const componentName = 'IceShardAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('IceShardAnimation')
      );
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.not.stringContaining(' - ')
      );
    });

    it('handles zero particle count without warnings', () => {
      // Arrange
      const count = 0;
      const componentName = 'TestAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('handles single particle count without warnings', () => {
      // Arrange
      const count = 1;
      const componentName = 'TestAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });
  });

  describe('Production Mode Behavior', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('does not log warnings in production mode even with high counts', () => {
      // Arrange
      const count = 25;
      const componentName = 'FireballAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('does not log errors in production mode even when exceeding max', () => {
      // Arrange
      const count = 50;
      const componentName = 'TestAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('silently accepts any particle count in production', () => {
      // Arrange
      const testCounts = [0, 1, 20, 21, 30, 31, 100, 1000];

      // Act & Assert
      testCounts.forEach(count => {
        consoleWarn.mockClear();
        consoleError.mockClear();

        validateParticleCount(count, 'ProductionAnimation');

        expect(consoleWarn).not.toHaveBeenCalled();
        expect(consoleError).not.toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('handles negative particle counts without crashing', () => {
      // Arrange
      const count = -5;
      const componentName = 'TestAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert - negative counts are technically under limits, so no warnings
      expect(consoleWarn).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('handles very large component names', () => {
      // Arrange
      const count = 25;
      const componentName = 'A'.repeat(1000);

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('A'.repeat(100)) // At least contains part of the name
      );
    });

    it('handles empty component name', () => {
      // Arrange
      const count = 25;
      const componentName = '';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).toHaveBeenCalledTimes(1);
    });

    it('handles empty phase string', () => {
      // Arrange
      const count = 25;
      const componentName = 'TestAnimation';
      const phase = '';

      // Act
      validateParticleCount(count, componentName, phase);

      // Assert
      expect(consoleWarn).toHaveBeenCalledTimes(1);
      // When phase is empty string, it's still treated as falsy by the code
      // so the location becomes just the component name without " - "
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('TestAnimation]')
      );
    });

    it('handles special characters in component name', () => {
      // Arrange
      const count = 25;
      const componentName = 'Test<Animation>Component-v2.0';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Test<Animation>Component-v2.0')
      );
    });

    it('handles special characters in phase', () => {
      // Arrange
      const count = 25;
      const componentName = 'TestAnimation';
      const phase = 'impact-phase-1';

      // Act
      validateParticleCount(count, componentName, phase);

      // Assert
      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('TestAnimation - impact-phase-1')
      );
    });

    it('handles fractional particle counts (rounds in message)', () => {
      // Arrange
      const count = 25.7;
      const componentName = 'TestAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Particle count (25.7)')
      );
    });
  });

  describe('Boundary Conditions', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('does not warn at count = 19', () => {
      // Arrange
      const count = 19;
      const componentName = 'TestAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('does not warn at count = 20 (recommended max)', () => {
      // Arrange
      const count = 20;
      const componentName = 'TestAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('warns at count = 21', () => {
      // Arrange
      const count = 21;
      const componentName = 'TestAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('warns at count = 29', () => {
      // Arrange
      const count = 29;
      const componentName = 'TestAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('warns but does not error at count = 30 (hard max)', () => {
      // Arrange
      const count = 30;
      const componentName = 'TestAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('errors at count = 31', () => {
      // Arrange
      const count = 31;
      const componentName = 'TestAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Message Content Validation', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('warning message includes all required information', () => {
      // Arrange
      const count = 25;
      const componentName = 'FireballAnimation';
      const phase = 'impact';

      // Act
      validateParticleCount(count, componentName, phase);

      // Assert
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️')
      );
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('[FireballAnimation - impact]')
      );
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Particle count (25)')
      );
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('exceeds recommended max (20)')
      );
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Consider reducing for better performance')
      );
    });

    it('error message includes all required information', () => {
      // Arrange
      const count = 35;
      const componentName = 'MeteorAnimation';

      // Act
      validateParticleCount(count, componentName);

      // Assert
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('🚨')
      );
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('[MeteorAnimation]')
      );
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Particle count (35)')
      );
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('EXCEEDS maximum (30)')
      );
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('performance issues')
      );
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Reduce particle count immediately')
      );
    });
  });
});
