/**
 * AI Performance Utilities Tests
 */

import { renderHook } from '@testing-library/react';
import {
  useConfidenceLevel,
  useConfidenceColor,
  useCachedAICalculation,
  clearAICache,
  getAICacheStats,
} from '../ai-performance';

describe('AI Performance Utilities', () => {
  beforeEach(() => {
    clearAICache();
  });

  describe('useConfidenceLevel', () => {
    it('should return correct confidence levels', () => {
      const { result: highResult } = renderHook(() => useConfidenceLevel(85));
      expect(highResult.current).toBe('high');

      const { result: mediumResult } = renderHook(() => useConfidenceLevel(65));
      expect(mediumResult.current).toBe('medium');

      const { result: lowResult } = renderHook(() => useConfidenceLevel(45));
      expect(lowResult.current).toBe('low');
    });

    it('should memoize results', () => {
      const { result, rerender } = renderHook(
        ({ confidence }) => useConfidenceLevel(confidence),
        { initialProps: { confidence: 85 } }
      );

      const firstResult = result.current;
      rerender({ confidence: 85 });
      expect(result.current).toBe(firstResult);
    });
  });

  describe('useConfidenceColor', () => {
    it('should return correct colors for confidence levels', () => {
      const { result: highResult } = renderHook(() => useConfidenceColor(85, true));
      expect(highResult.current).toBe('success');

      const { result: mediumResult } = renderHook(() => useConfidenceColor(65, true));
      expect(mediumResult.current).toBe('warning');

      const { result: lowResult } = renderHook(() => useConfidenceColor(45, true));
      expect(lowResult.current).toBe('error');
    });

    it('should return primary when color coding is disabled', () => {
      const { result } = renderHook(() => useConfidenceColor(85, false));
      expect(result.current).toBe('primary');
    });
  });

  describe('useCachedAICalculation', () => {
    it('should cache calculation results', () => {
      const expensiveCalculation = jest.fn(() => 'calculated-value');

      const { result: firstResult } = renderHook(() =>
        useCachedAICalculation('test-key', expensiveCalculation, [1, 2, 3])
      );

      const { result: secondResult } = renderHook(() =>
        useCachedAICalculation('test-key', expensiveCalculation, [1, 2, 3])
      );

      expect(firstResult.current).toBe('calculated-value');
      expect(secondResult.current).toBe('calculated-value');
      expect(expensiveCalculation).toHaveBeenCalledTimes(1);
    });

    it('should recalculate when dependencies change', () => {
      const expensiveCalculation = jest.fn(() => 'calculated-value');

      const { result: firstResult } = renderHook(() =>
        useCachedAICalculation('test-key', expensiveCalculation, [1, 2, 3])
      );

      const { result: secondResult } = renderHook(() =>
        useCachedAICalculation('test-key', expensiveCalculation, [1, 2, 4])
      );

      expect(firstResult.current).toBe('calculated-value');
      expect(secondResult.current).toBe('calculated-value');
      expect(expensiveCalculation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', () => {
      const stats = getAICacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('limit');
      expect(stats).toHaveProperty('usage');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.limit).toBe('number');
      expect(typeof stats.usage).toBe('number');
    });

    it('should clear cache', () => {
      // Add something to cache
      renderHook(() =>
        useCachedAICalculation('test-key', () => 'value', [1])
      );

      let stats = getAICacheStats();
      expect(stats.size).toBeGreaterThan(0);

      clearAICache();
      stats = getAICacheStats();
      expect(stats.size).toBe(0);
    });
  });
});