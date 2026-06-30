/** BR-01 / BR-02 — derived person fields, ported from the ExtJS model calculate fields. */

export interface NamedPerson {
  firstname: string;
  lastname: string;
}

/** BR-02: `firstname + ' ' + lastname` (model/Person.js fullname calculate). */
export function fullName(p: NamedPerson): string {
  return p.firstname + ' ' + p.lastname;
}

/** BR-01: `person/{id}` (model/Base.js url calculate → `{entityName:lowercase}/{id}`). */
export function personPath(p: { id: string }): string {
  return 'person/' + p.id;
}
