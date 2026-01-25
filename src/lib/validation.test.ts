import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  validateCityName,
  validateCoordinates,
  validateNumber,
  validateMessage,
  validateEmail,
  meetsWCAGAA,
  getContrastRatio,
} from './validation';

describe('validation utilities', () => {
  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      // Note: sanitizeString removes HTML tags and <>'" chars, but not parentheses
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert(xss)');
      expect(sanitizeString('<div>Hello</div>')).toBe('Hello');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeString('Hello<>"\'')).toBe('Hello');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  Hello  ')).toBe('Hello');
    });
  });

  describe('validateCityName', () => {
    it('should accept valid city names', () => {
      expect(validateCityName('New York').valid).toBe(true);
      expect(validateCityName('San-Francisco').valid).toBe(true);
      expect(validateCityName('City_123').valid).toBe(true);
    });

    it('should reject empty names', () => {
      expect(validateCityName('').valid).toBe(false);
      expect(validateCityName('   ').valid).toBe(false);
    });

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(51);
      expect(validateCityName(longName).valid).toBe(false);
    });

    it('should reject names with special characters', () => {
      expect(validateCityName('City@123').valid).toBe(false);
      expect(validateCityName('City!').valid).toBe(false);
    });
  });

  describe('validateCoordinates', () => {
    it('should accept valid coordinates', () => {
      expect(validateCoordinates(0, 0, 64).valid).toBe(true);
      expect(validateCoordinates(32, 32, 64).valid).toBe(true);
      expect(validateCoordinates(63, 63, 64).valid).toBe(true);
    });

    it('should reject negative coordinates', () => {
      expect(validateCoordinates(-1, 0, 64).valid).toBe(false);
      expect(validateCoordinates(0, -1, 64).valid).toBe(false);
    });

    it('should reject out-of-bounds coordinates', () => {
      expect(validateCoordinates(64, 0, 64).valid).toBe(false);
      expect(validateCoordinates(0, 64, 64).valid).toBe(false);
    });

    it('should reject non-integer coordinates', () => {
      expect(validateCoordinates(1.5, 0, 64).valid).toBe(false);
      expect(validateCoordinates(0, 1.5, 64).valid).toBe(false);
    });
  });

  describe('validateNumber', () => {
    it('should accept numbers within range', () => {
      expect(validateNumber(5, 0, 10).valid).toBe(true);
      expect(validateNumber(0, 0, 10).valid).toBe(true);
      expect(validateNumber(10, 0, 10).valid).toBe(true);
    });

    it('should reject numbers outside range', () => {
      expect(validateNumber(-1, 0, 10).valid).toBe(false);
      expect(validateNumber(11, 0, 10).valid).toBe(false);
    });

    it('should reject non-numbers', () => {
      expect(validateNumber(NaN, 0, 10).valid).toBe(false);
      expect(validateNumber('5' as any, 0, 10).valid).toBe(false);
    });
  });

  describe('validateMessage', () => {
    it('should accept valid messages', () => {
      const result = validateMessage('Hello world');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Hello world');
    });

    it('should sanitize HTML in messages', () => {
      const result = validateMessage('<b>Hello</b>');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Hello');
    });

    it('should reject empty messages', () => {
      expect(validateMessage('').valid).toBe(false);
      expect(validateMessage('   ').valid).toBe(false);
    });

    it('should reject messages that are too long', () => {
      const longMessage = 'a'.repeat(501);
      expect(validateMessage(longMessage).valid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('test@example.com').valid).toBe(true);
      expect(validateEmail('user+tag@domain.co.uk').valid).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('notanemail').valid).toBe(false);
      expect(validateEmail('@example.com').valid).toBe(false);
      expect(validateEmail('test@').valid).toBe(false);
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate contrast ratio correctly', () => {
      // Black on white should have high contrast (21:1)
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeGreaterThan(20);
    });

    it('should return same ratio regardless of order', () => {
      const ratio1 = getContrastRatio('#000000', '#ffffff');
      const ratio2 = getContrastRatio('#ffffff', '#000000');
      expect(ratio1).toBe(ratio2);
    });
  });

  describe('meetsWCAGAA', () => {
    it('should pass for high contrast combinations', () => {
      expect(meetsWCAGAA('#000000', '#ffffff')).toBe(true);
      expect(meetsWCAGAA('#ffffff', '#000000')).toBe(true);
    });

    it('should fail for low contrast combinations', () => {
      expect(meetsWCAGAA('#888888', '#999999')).toBe(false);
    });

    it('should have lower requirements for large text', () => {
      // #808080 on white has ~3.95:1 contrast ratio
      // Fails normal text (requires 4.5:1) but passes large text (requires 3:1)
      expect(meetsWCAGAA('#808080', '#ffffff', false)).toBe(false);
      expect(meetsWCAGAA('#808080', '#ffffff', true)).toBe(true);
    });
  });
});
