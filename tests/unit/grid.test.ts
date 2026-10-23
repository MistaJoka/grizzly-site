import { describe, expect, it } from 'vitest';
import { gridSpans } from '../../src/lib/grid';

describe('gridSpans', () => {
  it('runs in thirds when the count divides by three', () => {
    expect(gridSpans(3)).toEqual(['lg:col-span-2', 'lg:col-span-2', 'lg:col-span-2']);
  });
  it('opens with two halves when two are left over', () => {
    expect(gridSpans(5)).toEqual(['lg:col-span-3', 'lg:col-span-3', 'lg:col-span-2', 'lg:col-span-2', 'lg:col-span-2']);
  });
  it('opens with a full row when one is left over', () => {
    expect(gridSpans(4)[0]).toBe('lg:col-span-6');
    expect(gridSpans(1)).toEqual(['lg:col-span-6']);
  });
  it('handles an empty list', () => {
    expect(gridSpans(0)).toEqual([]);
  });
});
