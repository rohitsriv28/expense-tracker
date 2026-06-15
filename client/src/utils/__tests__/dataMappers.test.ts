import { describe, it, expect } from 'vitest';
import { resolveExpenseVisuals, categoryHex, findCategory } from '../dataMappers';
import type { Category } from '../../types';

const mockCategories: Category[] = [
  { _id: 'cat1', userId: 'u1', name: 'Food & Drink', icon: 'Coffee', color: 'bg-orange-600', sortOrder: 0, isDefault: true, createdAt: '2026-01-01' },
  { _id: 'cat2', userId: 'u1', name: 'Transport', icon: 'Car', color: '#3b82f6', sortOrder: 1, isDefault: true, createdAt: '2026-01-01' },
  { _id: 'cat3', userId: 'u1', name: 'Shopping', icon: 'ShoppingBag', color: 'bg-rose-600', sortOrder: 2, isDefault: true, createdAt: '2026-01-01' },
];

describe('dataMappers', () => {

  describe('resolveExpenseVisuals', () => {
    it('should resolve a matching category by name', () => {
      const result = resolveExpenseVisuals(mockCategories, 'Food & Drink');
      expect(result.categoryName).toBe('Food & Drink');
      expect(result.icon).toBe('Coffee');
    });

    it('should resolve category name case-insensitively', () => {
      const result = resolveExpenseVisuals(mockCategories, 'transport');
      expect(result.categoryName).toBe('Transport');
    });

    it('should resolve by _id', () => {
      const result = resolveExpenseVisuals(mockCategories, 'cat1');
      expect(result.categoryName).toBe('Food & Drink');
    });

    it('should return default values for unknown category', () => {
      const result = resolveExpenseVisuals(mockCategories, 'NonExistent');
      expect(result.categoryName).toBe('NonExistent');
      expect(result.color).toBe('#94a3b8');
      expect(result.icon).toBe('MoreHorizontal');
    });

    it('should return "Unknown" for empty string', () => {
      const result = resolveExpenseVisuals(mockCategories, '');
      expect(result.categoryName).toBe('Unknown');
    });
  });

  describe('categoryHex', () => {
    it('should return hex directly when color is already hex', () => {
      expect(categoryHex(mockCategories[1])).toBe('#3b82f6');
    });

    it('should resolve Tailwind bg-color-XXX to hex', () => {
      expect(categoryHex(mockCategories[0])).toBe('#f97316'); // orange
    });

    it('should resolve rose Tailwind color', () => {
      expect(categoryHex(mockCategories[2])).toBe('#f43f5e'); // rose
    });

    it('should return default slate for unrecognized Tailwind class', () => {
      const cat = { ...mockCategories[0], color: 'bg-unknown-600' } as Category;
      expect(categoryHex(cat)).toBe('#94a3b8');
    });
  });

  describe('findCategory', () => {
    it('should find by _id', () => {
      expect(findCategory(mockCategories, 'cat2')?.name).toBe('Transport');
    });

    it('should find by name (case-insensitive)', () => {
      expect(findCategory(mockCategories, 'shopping')?.name).toBe('Shopping');
    });

    it('should return undefined for undefined input', () => {
      expect(findCategory(mockCategories, undefined)).toBeUndefined();
    });

    it('should return undefined for non-matching', () => {
      expect(findCategory(mockCategories, 'zzz')).toBeUndefined();
    });
  });
});
