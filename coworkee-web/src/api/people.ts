import { z } from 'zod';
import { apiFetch, queryString } from './http';
import {
  PersonSchema,
  FilterOptionSchema,
  envelope,
  type Person,
  type FilterOption,
  type Envelope,
} from './schemas';

const PeopleEnvelope = envelope(PersonSchema);
const FiltersEnvelope = envelope(FilterOptionSchema);
const GenerateUsernameSchema = z.object({ username: z.string() });

export interface ListPeopleParams {
  token?: string;
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  officeId?: string;
  organizationId?: string;
  signal?: AbortSignal;
}

/** BR-09/11/12: server-side paged/sorted/filtered list, envelope unwrapped. */
export async function listPeople(p: ListPeopleParams): Promise<Envelope<Person>> {
  const qs = queryString({
    page: p.page,
    size: p.size,
    sort: p.sort,
    search: p.search,
    office_id: p.officeId,
    organization_id: p.organizationId,
  });
  return apiFetch(`/people${qs}`, { token: p.token, schema: PeopleEnvelope, signal: p.signal });
}

/** BR-04: resolve by id, username or email. */
export async function getPerson(
  key: string,
  opts: { token?: string; signal?: AbortSignal } = {},
): Promise<Person> {
  return apiFetch(`/people/${encodeURIComponent(key)}`, {
    token: opts.token,
    schema: PersonSchema,
    signal: opts.signal,
  });
}

/** Writable fields (whitelist; no password — ADR-004). */
export interface PersonInput {
  email: string;
  username: string;
  firstname: string;
  lastname: string;
  title: string;
  phone: string;
  extension?: string | null;
  skype?: string | null;
  linkedin?: string | null;
  picture?: string | null;
  birthday: string;
  started: string;
  ended?: string | null;
  officeId: string;
  organizationId: string;
}

export async function createPerson(input: PersonInput, opts: { token?: string } = {}): Promise<Person> {
  return apiFetch('/people', { method: 'POST', body: input, token: opts.token, schema: PersonSchema });
}

export async function updatePerson(
  id: string,
  input: PersonInput,
  opts: { token?: string } = {},
): Promise<Person> {
  return apiFetch(`/people/${id}`, { method: 'PUT', body: input, token: opts.token, schema: PersonSchema });
}

/** BR-21. */
export async function generateUsername(
  firstname: string,
  lastname: string,
  opts: { token?: string; signal?: AbortSignal } = {},
): Promise<string> {
  const qs = queryString({ firstname, lastname });
  const r = await apiFetch(`/people/generate-username${qs}`, {
    token: opts.token,
    schema: GenerateUsernameSchema,
    signal: opts.signal,
  });
  return r.username;
}

/** BR-11. */
export async function listPeopleFilters(
  field: 'office_id' | 'organization_id',
  opts: { token?: string } = {},
): Promise<FilterOption[]> {
  const qs = queryString({ field });
  const r = await apiFetch(`/people/filters${qs}`, { token: opts.token, schema: FiltersEnvelope });
  return r.data;
}
