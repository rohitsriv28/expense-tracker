import { describe, it, expect } from 'vitest';
import {
  isMonthlyEnvelopeBudget,
  calculateHealthScore,
  calculateEnvelopeSummary,
  convertLegacyBudget,
} from '../budgetService';
import type { MonthlyEnvelopeBudget, MonthlyEnvelopeSummary } from '../../types';

describe('budgetService', () => {

  describe('isMonthlyEnvelopeBudget', () => {
    it('should return true for monthly_envelope type', () => {
      const budget = { type: 'monthly_envelope' } as any;
      expect(isMonthlyEnvelopeBudget(budget)).toBe(true);
    });

    it('should return false for other types', () => {
      const budget = { type: 'other_type' } as any;
      expect(isMonthlyEnvelopeBudget(budget)).toBe(false);
    });
  });

  describe('calculateHealthScore', () => {
    it('should return 100 for empty summaries', () => {
      expect(calculateHealthScore([])).toBe(100);
    });

    it('should return 100 when all budgets are within limits', () => {
      const summaries = [
        { budget: { amount: 5000 }, status: 'safe' },
        { budget: { amount: 3000 }, status: 'warning' },
      ] as MonthlyEnvelopeSummary[];

      expect(calculateHealthScore(summaries)).toBe(100);
    });

    it('should reduce score for exceeded budgets', () => {
      const summaries = [
        { budget: { amount: 5000 }, status: 'safe' },
        { budget: { amount: 5000 }, status: 'exceeded' },
      ] as MonthlyEnvelopeSummary[];

      expect(calculateHealthScore(summaries)).toBe(50);
    });

    it('should return 0 when all budgets are exceeded', () => {
      const summaries = [
        { budget: { amount: 5000 }, status: 'exceeded' },
        { budget: { amount: 3000 }, status: 'exceeded' },
      ] as MonthlyEnvelopeSummary[];

      expect(calculateHealthScore(summaries)).toBe(0);
    });

    it('should handle zero-amount budgets', () => {
      const summaries = [
        { budget: { amount: 0 }, status: 'safe' },
      ] as MonthlyEnvelopeSummary[];

      expect(calculateHealthScore(summaries)).toBe(100);
    });
  });

  describe('convertLegacyBudget', () => {
    it('should return same budget if already monthly_envelope', () => {
      const budget: MonthlyEnvelopeBudget = {
        _id: 'b1', userId: 'u1', type: 'monthly_envelope',
        name: 'Test', amount: 10000, month: 5, year: 2026,
        allocations: {}, createdAt: '2026-01-01',
      };
      expect(convertLegacyBudget(budget)).toBe(budget);
    });

    it('should convert a legacy budget with limit field', () => {
      const legacy = { _id: 'b2', userId: 'u2', type: 'legacy', limit: 5000, createdAt: '2025-01-01' };
      const result = convertLegacyBudget(legacy);
      expect(result.type).toBe('monthly_envelope');
      expect(result.amount).toBe(5000);
      expect(result.name).toBe('Legacy Budget');
    });
  });

  describe('calculateEnvelopeSummary', () => {
    const budget: MonthlyEnvelopeBudget = {
      _id: 'b1', userId: 'u1', type: 'monthly_envelope',
      name: 'June 2026', amount: 20000, month: 5, year: 2026,
      allocations: { 'cat_food': 5000, 'cat_transport': 3000 },
      createdAt: '2026-01-01',
    };

    const categories = [
      { _id: 'cat_food', name: 'Food', icon: 'Coffee', color: '#fff' },
      { _id: 'cat_transport', name: 'Transport', icon: 'Car', color: '#fff' },
    ];

    it('should compute summary with zero expenses', () => {
      const summary = calculateEnvelopeSummary(budget, [], categories);

      expect(summary.totalSpent).toBe(0);
      expect(summary.remaining).toBe(20000);
      expect(summary.percentage).toBe(0);
      expect(summary.status).toBe('safe');
    });

    it('should compute summary with matching expenses', () => {
      const expenses = [
        { amount: 2000, date: '2026-06-10', category: 'Food' },
        { amount: 1500, date: '2026-06-15', category: 'Transport' },
      ];

      const summary = calculateEnvelopeSummary(budget, expenses, categories);

      expect(summary.totalSpent).toBe(3500);
      expect(summary.remaining).toBe(16500);
    });

    it('should exclude expenses outside the budget month', () => {
      const expenses = [
        { amount: 1000, date: '2026-06-10', category: 'Food' },
        { amount: 2000, date: '2026-07-01', category: 'Food' }, // July - outside
      ];

      const summary = calculateEnvelopeSummary(budget, expenses, categories);

      expect(summary.totalSpent).toBe(1000);
    });

    it('should mark status as exceeded when over budget', () => {
      const expenses = [
        { amount: 25000, date: '2026-06-10', category: 'Food' },
      ];

      const summary = calculateEnvelopeSummary(budget, expenses, categories);

      expect(summary.status).toBe('exceeded');
      expect(summary.percentage).toBeGreaterThan(100);
    });

    it('should handle uncategorized expenses in unallocated pool', () => {
      const expenses = [
        { amount: 500, date: '2026-06-10' }, // No category
      ];

      const summary = calculateEnvelopeSummary(budget, expenses, categories);

      expect(summary.unallocated.spent).toBe(500);
    });
  });
});
