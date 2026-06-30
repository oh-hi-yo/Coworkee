import { describe, it, expect } from 'vitest';
import { groupByLastInitial } from './grouping';

describe('groupByLastInitial (BR-10)', () => {
  it('groups consecutive lastnames by first letter', () => {
    const people = [
      { lastname: 'Armstrong' },
      { lastname: 'Bailey' },
      { lastname: 'Banks' },
      { lastname: 'Cooper' },
    ];
    const groups = groupByLastInitial(people);
    expect(groups.map((g) => g.letter)).toEqual(['A', 'B', 'C']);
    expect(groups[1].items).toHaveLength(2);
  });

  it('uppercases the grouping letter', () => {
    expect(groupByLastInitial([{ lastname: 'aaron' }])[0].letter).toBe('A');
  });
});
