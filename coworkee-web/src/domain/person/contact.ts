/**
 * BR-05~08 — contact URI builders, ported from model/Person.js (phoneCall, skypeCall,
 * mailTo, linkedIn). The ExtJS methods returned `false` when the source field was empty;
 * here we return `null` so callers can hide the action.
 */

const isEmpty = (v?: string | null): boolean => v === undefined || v === null || v === '';

/** BR-05: `tel:{phone}` plus `;ext={extension}` per RFC 3966. */
export function telUri(phone?: string | null, extension?: string | null): string | null {
  if (isEmpty(phone)) {
    return null;
  }
  let url = 'tel:' + phone;
  if (!isEmpty(extension)) {
    url += ';ext=' + extension;
  }
  return url;
}

/** BR-06: `skype:{username}?call`. */
export function skypeUri(username?: string | null): string | null {
  return isEmpty(username) ? null : 'skype:' + username + '?call';
}

/** BR-07: `mailto:{email}`. */
export function mailtoUri(email?: string | null): string | null {
  return isEmpty(email) ? null : 'mailto:' + email;
}

/** BR-08: LinkedIn profile URL. */
export function linkedinUrl(username?: string | null): string | null {
  return isEmpty(username) ? null : 'http://www.linkedin.com/in/' + username;
}
