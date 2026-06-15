import { describe, it, expect } from 'vitest';
import { evaluateMathExpression } from '../mathParser';

describe('evaluateMathExpression', () => {
  // ─── Basic arithmetic ─────────────────────────────────────────────────────────

  describe('basic arithmetic', () => {
    it('should parse simple integers', () => {
      expect(evaluateMathExpression('42')).toBe(42);
    });

    it('should parse decimals', () => {
      expect(evaluateMathExpression('3.14')).toBe(3.14);
    });

    it('should add two numbers', () => {
      expect(evaluateMathExpression('100+50')).toBe(150);
    });

    it('should subtract', () => {
      expect(evaluateMathExpression('200-75')).toBe(125);
    });

    it('should multiply', () => {
      expect(evaluateMathExpression('12*5')).toBe(60);
    });

    it('should divide', () => {
      expect(evaluateMathExpression('100/4')).toBe(25);
    });

    it('should handle spaces', () => {
      expect(evaluateMathExpression('10 + 20 + 30')).toBe(60);
    });
  });

  // ─── Operator precedence ──────────────────────────────────────────────────────

  describe('operator precedence', () => {
    it('should multiply before adding', () => {
      expect(evaluateMathExpression('2+3*4')).toBe(14);
    });

    it('should divide before subtracting', () => {
      expect(evaluateMathExpression('10-6/3')).toBe(8);
    });

    it('should handle parentheses overriding precedence', () => {
      expect(evaluateMathExpression('(2+3)*4')).toBe(20);
    });

    it('should handle nested parentheses', () => {
      expect(evaluateMathExpression('((2+3)*4)+1')).toBe(21);
    });
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should return null for empty string', () => {
      expect(evaluateMathExpression('')).toBeNull();
    });

    it('should return null for whitespace only', () => {
      expect(evaluateMathExpression('   ')).toBeNull();
    });

    it('should return null for negative result', () => {
      expect(evaluateMathExpression('5-10')).toBeNull();
    });

    it('should return null for division by zero', () => {
      expect(evaluateMathExpression('10/0')).toBeNull();
    });

    it('should return null for alphabetic characters', () => {
      expect(evaluateMathExpression('abc')).toBeNull();
    });

    it('should return null for special characters', () => {
      expect(evaluateMathExpression('10$5')).toBeNull();
    });

    it('should return null for unclosed parenthesis', () => {
      expect(evaluateMathExpression('(2+3')).toBeNull();
    });

    it('should round to 2 decimal places', () => {
      expect(evaluateMathExpression('10/3')).toBe(3.33);
    });

    it('should handle unary plus', () => {
      expect(evaluateMathExpression('+5')).toBe(5);
    });

    it('should return null for multiple decimal points', () => {
      expect(evaluateMathExpression('1.2.3')).toBeNull();
    });
  });

  // ─── Real-world expense entry scenarios ───────────────────────────────────────

  describe('expense entry scenarios', () => {
    it('should split a bill: 500/3', () => {
      expect(evaluateMathExpression('500/3')).toBe(166.67);
    });

    it('should add tip: 450+45', () => {
      expect(evaluateMathExpression('450+45')).toBe(495);
    });

    it('should calculate total: 120+80+200', () => {
      expect(evaluateMathExpression('120+80+200')).toBe(400);
    });

    it('should calculate percentage discount: 1000*0.9', () => {
      expect(evaluateMathExpression('1000*0.9')).toBe(900);
    });
  });
});
