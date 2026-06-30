import { describe, it, expect } from 'vitest';
import { parseLocalDate, formatLongDate } from './date';

describe('parseLocalDate (BR-03 — no TZ shift)', () => {
  it('parses to local midnight, same calendar day', () => {
    const d = parseLocalDate('1984-12-12');
    expect(d.getFullYear()).toBe(1984);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(12);
  });
});

describe('formatLongDate (BR-17 — F jS, Y)', () => {
  it.each([
    ['1984-12-12', 'December 12th, 1984'],
    ['2009-11-01', 'November 1st, 2009'],
    ['2020-03-02', 'March 2nd, 2020'],
    ['2020-03-03', 'March 3rd, 2020'],
    ['2020-03-11', 'March 11th, 2020'],
    ['2020-03-21', 'March 21st, 2020'],
    ['2020-03-22', 'March 22nd, 2020'],
  ])('%s -> %s', (iso, expected) => {
    expect(formatLongDate(iso)).toBe(expected);
  });
});
