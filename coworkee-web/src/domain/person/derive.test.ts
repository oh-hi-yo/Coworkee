import { describe, it, expect } from 'vitest';
import { fullName, personPath } from './derive';

describe('fullName (BR-02)', () => {
  it.each([
    [{ firstname: 'Benjamin', lastname: 'Banks' }, 'Benjamin Banks'],
    [{ firstname: 'Madonna', lastname: '' }, 'Madonna '],
    [{ firstname: '', lastname: 'Cher' }, ' Cher'],
  ])('%o -> %s', (p, expected) => {
    expect(fullName(p)).toBe(expected);
  });
});

describe('personPath (BR-01)', () => {
  it('builds person/{id}', () => {
    expect(personPath({ id: 'a6987240-610f-4dc6-b0a7-3d53d47591ad' })).toBe(
      'person/a6987240-610f-4dc6-b0a7-3d53d47591ad',
    );
  });
});
