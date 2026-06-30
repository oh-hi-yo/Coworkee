import { describe, it, expect } from 'vitest';
import { telUri, skypeUri, mailtoUri, linkedinUrl } from './contact';

describe('telUri (BR-05)', () => {
  it('plain phone', () => {
    expect(telUri('1-261-555-0107')).toBe('tel:1-261-555-0107');
  });
  it('phone with extension (RFC 3966)', () => {
    expect(telUri('1-261-555-0107', '123')).toBe('tel:1-261-555-0107;ext=123');
  });
  it('empty extension is ignored', () => {
    expect(telUri('555', '')).toBe('tel:555');
  });
  it('empty phone -> null', () => {
    expect(telUri('')).toBeNull();
    expect(telUri(null)).toBeNull();
    expect(telUri(undefined)).toBeNull();
  });
});

describe('skypeUri (BR-06)', () => {
  it('builds skype call uri', () => {
    expect(skypeUri('bbanks0')).toBe('skype:bbanks0?call');
  });
  it('empty -> null', () => {
    expect(skypeUri('')).toBeNull();
  });
});

describe('mailtoUri (BR-07)', () => {
  it('builds mailto', () => {
    expect(mailtoUri('a@b.co')).toBe('mailto:a@b.co');
  });
  it('empty -> null', () => {
    expect(mailtoUri(null)).toBeNull();
  });
});

describe('linkedinUrl (BR-08)', () => {
  it('builds profile url', () => {
    expect(linkedinUrl('benjamin.banks')).toBe('http://www.linkedin.com/in/benjamin.banks');
  });
  it('empty -> null', () => {
    expect(linkedinUrl('')).toBeNull();
  });
});
