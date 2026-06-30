import { describe, it, expect } from 'vitest';
import { actionIconCls } from './actionIcon';

describe('actionIconCls (BR-16)', () => {
  it.each([
    ['profile', 'x-fa fa-user'],
    ['email', 'x-fa fa-envelope'],
    ['phone', 'x-fa fa-phone'],
    ['skype', 'x-fab fa-skype'],
    ['linkedin', 'x-fab fa-linkedin'],
  ])('%s -> %s', (type, expected) => {
    expect(actionIconCls(type)).toBe(expected);
  });
});
