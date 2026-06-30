/**
 * BR-15 (HIGH RISK) — faithful port of the ExtJS `Ext.util.Format.dateDiff` override
 * (client/overrides/util/Format.js), which itself relies on `Ext.Date.diff`,
 * `Ext.Date.add` and `Ext.util.Format.plural`.
 *
 * Used for birthday age and tenure on the detail page (BR-17). The threshold ladder
 * and pluralization are replicated EXACTLY — do not "improve" them. Characterization
 * tests in dateDiff.test.ts pin the behavior.
 */

export type DiffUnit = 'ms' | 's' | 'mi' | 'h' | 'd' | 'w' | 'mo' | 'y';

const UNIT_NAME: Record<DiffUnit, string> = {
  ms: 'millisecond',
  s: 'second',
  mi: 'minute',
  h: 'hour',
  d: 'day',
  w: 'week',
  mo: 'month',
  y: 'year',
};

/** Ext.util.Format.plural — `1 year`, `2 years`, `0 days`. */
export function plural(value: number, word: string, pluralForm?: string): string {
  return value + ' ' + (value === 1 ? word : pluralForm ?? word + 's');
}

function daysInMonth(year: number, monthIndex: number): number {
  // monthIndex may be out of 0..11; JS Date normalizes it.
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Subset of Ext.Date.add needed by diff() for month/year (with day clamping). */
function extDateAdd(date: Date, unit: DiffUnit, value: number): Date {
  const d = new Date(date.getTime());
  switch (unit) {
    case 'ms':
      d.setTime(d.getTime() + value);
      break;
    case 's':
      d.setTime(d.getTime() + value * 1000);
      break;
    case 'mi':
      d.setTime(d.getTime() + value * 60000);
      break;
    case 'h':
      d.setTime(d.getTime() + value * 3600000);
      break;
    case 'd':
      d.setDate(d.getDate() + value);
      break;
    case 'w':
      d.setDate(d.getDate() + value * 7);
      break;
    case 'mo': {
      let day = date.getDate();
      if (day > 28) {
        day = Math.min(day, daysInMonth(date.getFullYear(), date.getMonth() + value));
      }
      d.setDate(day);
      d.setMonth(date.getMonth() + value);
      break;
    }
    case 'y': {
      let day = date.getDate();
      if (day > 28) {
        day = Math.min(day, daysInMonth(date.getFullYear() + value, date.getMonth()));
      }
      d.setDate(day);
      d.setFullYear(date.getFullYear() + value);
      break;
    }
  }
  return d;
}

/** Ext.Date.diff(min, max, unit). */
export function extDateDiff(min: Date, max: Date, unit: DiffUnit): number {
  const delta = max.getTime() - min.getTime();
  switch (unit) {
    case 'ms':
      return delta;
    case 's':
      return Math.floor(delta / 1000);
    case 'mi':
      return Math.floor(delta / 60000);
    case 'h':
      return Math.floor(delta / 3600000);
    case 'd':
      return Math.floor(delta / 86400000);
    case 'w':
      return Math.floor(delta / (86400000 * 7));
    case 'mo': {
      let est =
        max.getFullYear() * 12 + max.getMonth() - (min.getFullYear() * 12 + min.getMonth());
      if (extDateAdd(min, 'mo', est).getTime() > max.getTime()) {
        est--;
      }
      return est;
    }
    case 'y': {
      let est = max.getFullYear() - min.getFullYear();
      if (extDateAdd(min, 'y', est).getTime() > max.getTime()) {
        est--;
      }
      return est;
    }
  }
}

/**
 * dateDiff(v0, v1[, unit]) — auto-selects a unit by the legacy second thresholds and
 * returns a pluralized, human-readable string (e.g. `41 years`, `1 day`).
 */
export function dateDiff(v0: Date, v1: Date, unit: DiffUnit | 'auto' = 'auto'): string {
  let u: DiffUnit;
  if (unit === 'auto') {
    const seconds = Math.floor((v1.getTime() - v0.getTime()) / 1000);
    u =
      seconds < 1
        ? 'ms' // 1 second
        : seconds < 60
          ? 's' // 1 minute
          : seconds < 3600
            ? 'mi' // 60 minutes
            : seconds < 86400
              ? 'h' // 24 hours
              : seconds < 604800
                ? 'd' // 7 days
                : seconds < 2419200
                  ? 'w' // 4 weeks
                  : seconds < 31622400
                    ? 'mo' // 366 days
                    : 'y';
  } else {
    u = unit;
  }
  return plural(extDateDiff(v0, v1, u), UNIT_NAME[u]);
}
