/**
 * Date helpers. BR-03: `YYYY-MM-DD` strings are calendar dates with no timezone —
 * parse to local midnight, never shift. BR-17: display format `F jS, Y`
 * (e.g. `December 12th, 1984`).
 */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Parse `YYYY-MM-DD` to a local-midnight Date (no TZ conversion). */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** PHP-style ordinal suffix used by ExtJS `jS`. */
function ordinal(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/** Format an ISO `YYYY-MM-DD` as `F jS, Y` (BR-17). */
export function formatLongDate(iso: string): string {
  const date = parseLocalDate(iso);
  const day = date.getDate();
  return `${MONTHS[date.getMonth()]} ${day}${ordinal(day)}, ${date.getFullYear()}`;
}
