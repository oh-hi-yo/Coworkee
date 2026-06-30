/** BR-10 — group people by the first letter of the lastname (A-Z directory). */
export interface PersonGroup<T> {
  letter: string;
  items: T[];
}

export function groupByLastInitial<T extends { lastname: string }>(people: T[]): PersonGroup<T>[] {
  const groups: PersonGroup<T>[] = [];
  let current: PersonGroup<T> | undefined;
  for (const p of people) {
    const letter = (p.lastname[0] ?? '').toUpperCase();
    if (!current || current.letter !== letter) {
      current = { letter, items: [] };
      groups.push(current);
    }
    current.items.push(p);
  }
  return groups;
}
