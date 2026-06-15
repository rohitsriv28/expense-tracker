import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent, formatShortDate, formatMonthYear } from '../formatters';

describe('formatters', () => {

  describe('formatCurrency', () => {
    it('should format a simple amount in INR', () => {
      const result = formatCurrency(1500);
      expect(result).toContain('1,500');
    });

    it('should format zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    it('should format with decimal precision', () => {
      const result = formatCurrency(99.5);
      expect(result).toContain('99.5');
    });

    it('should use compact notation for large numbers', () => {
      const result = formatCurrency(150000, { compact: true });
      // en-IN compact for 1.5L or 1,50,000 → typically "₹1.5L"
      expect(result.length).toBeLessThan(10);
    });

    it('should NOT use compact notation for small numbers even if option is set', () => {
      const result = formatCurrency(500, { compact: true });
      expect(result).toContain('500');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-250);
      expect(result).toContain('250');
    });

    it('should respect custom currency', () => {
      const result = formatCurrency(100, { currency: 'USD' });
      expect(result).toContain('$');
    });
  });

  describe('formatPercent', () => {
    it('should format integer percentages', () => {
      expect(formatPercent(75)).toBe('75');
    });

    it('should format fractional percentages with max 1 decimal', () => {
      const result = formatPercent(33.333);
      expect(result).toBe('33.3');
    });

    it('should format zero', () => {
      expect(formatPercent(0)).toBe('0');
    });
  });

  describe('formatShortDate', () => {
    it('should format date as "day month"', () => {
      const result = formatShortDate(new Date(2026, 5, 13)); // June 13
      expect(result).toMatch(/13/);
      expect(result).toMatch(/Jun/);
    });
  });

  describe('formatMonthYear', () => {
    it('should format as "Month Year"', () => {
      const result = formatMonthYear(new Date(2026, 5, 1));
      expect(result).toMatch(/June/);
      expect(result).toMatch(/2026/);
    });
  });
});
