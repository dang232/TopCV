import { describe, expect, it } from 'vitest';

import { reorderFields } from './reorderFields';

describe('reorderFields', () => {
  it('moves an item from one index to another', () => {
    expect(reorderFields(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('returns the original array reference for no-op or out-of-bounds moves', () => {
    const original = ['a', 'b'];

    expect(reorderFields(original, 1, 1)).toBe(original);
    expect(reorderFields(original, -1, 0)).toBe(original);
    expect(reorderFields(original, 0, 2)).toBe(original);
  });

  it('preserves valid falsy values when reordering generic arrays', () => {
    expect(reorderFields([0, 1, 2], 0, 2)).toEqual([1, 2, 0]);
    expect(reorderFields([false, true], 0, 1)).toEqual([true, false]);
    expect(reorderFields(['', 'filled'], 0, 1)).toEqual(['filled', '']);
  });
});
