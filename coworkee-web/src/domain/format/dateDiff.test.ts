import { describe, it, expect } from 'vitest';
import { dateDiff, extDateDiff, plural } from './dateDiff';

// Local-midnight date (matches how ExtJS parsed `Y-m-d` fields). BR-03.
const d = (iso: string) => {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
};

describe('plural (Ext.util.Format.plural)', () => {
  it('singular vs plural', () => {
    expect(plural(1, 'year')).toBe('1 year');
    expect(plural(2, 'year')).toBe('2 years');
    expect(plural(0, 'day')).toBe('0 days');
  });
});

describe('dateDiff auto unit ladder + pluralization (BR-15)', () => {
  it('full years (age) — clamps to completed years', () => {
    // born 1984-12-12, "today" 2026-06-30 -> 41 (turns 42 in December)
    expect(dateDiff(d('1984-12-12'), d('2026-06-30'))).toBe('41 years');
  });

  it('exactly one year is singular', () => {
    expect(dateDiff(d('2020-01-01'), d('2021-01-01'))).toBe('1 year');
  });

  it('tenure across several years', () => {
    expect(dateDiff(d('2009-11-06'), d('2015-11-06'))).toBe('6 years');
  });

  it('months when under a year', () => {
    expect(dateDiff(d('2026-01-01'), d('2026-03-15'))).toBe('2 months');
  });

  it('weeks tier (4 weeks > x >= 1 week)', () => {
    // 9 days -> seconds in [604800, 2419200) -> weeks -> floor(9/7) = 1
    expect(dateDiff(d('2026-06-01'), d('2026-06-10'))).toBe('1 week');
  });

  it('days tier, singular', () => {
    expect(dateDiff(d('2026-06-01'), d('2026-06-02'))).toBe('1 day');
  });

  it('days tier, plural', () => {
    expect(dateDiff(d('2026-06-01'), d('2026-06-04'))).toBe('3 days');
  });
});

describe('extDateDiff explicit units', () => {
  it('year estimate decrements when add overshoots', () => {
    expect(extDateDiff(d('1984-12-12'), d('2026-06-30'), 'y')).toBe(41);
  });
  it('leap-day birthday — faithful to Ext.Date.add day-clamping', () => {
    // born 2000-02-29; Ext.Date.add(min,'y',25) clamps Feb-29 -> Feb-28 (2025 not a leap
    // year), which equals 2025-02-28 (not greater), so est stays 25. We replicate ExtJS
    // exactly rather than the intuitive 24.
    expect(extDateDiff(d('2000-02-29'), d('2025-02-28'), 'y')).toBe(25);
    expect(extDateDiff(d('2000-02-29'), d('2025-02-27'), 'y')).toBe(24);
    expect(extDateDiff(d('2000-02-29'), d('2025-03-01'), 'y')).toBe(25);
  });
});
