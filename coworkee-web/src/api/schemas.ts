import { z } from 'zod';

/**
 * Zod schemas at the API boundary (P4 anti-corruption layer). The backend keeps the
 * legacy `{ data, total }` envelope (ADR-002); these schemas describe the *unwrapped*
 * resources so components only ever see clean, typed data.
 *
 * BR-03: birthday/started/ended are `YYYY-MM-DD` strings, never parsed to TZ-shifted Dates here.
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const LocationSchema = z.object({
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

export const OfficeRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string().nullable(),
  country: z.string().nullable(),
});

export const OrganizationRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const PersonRefSchema = z.object({
  id: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  fullname: z.string(),
  title: z.string().nullable(),
  picture: z.string().nullable(),
});

export const PersonSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  fullname: z.string(),
  title: z.string().nullable(),
  phone: z.string().nullable(),
  extension: z.string().nullable(),
  skype: z.string().nullable(),
  linkedin: z.string().nullable(),
  picture: z.string().nullable(),
  birthday: isoDate,
  started: isoDate.nullable(),
  ended: isoDate.nullable(),
  office: OfficeRefSchema.nullable(),
  organization: OrganizationRefSchema.nullable(),
  url: z.string(),
});

export const OfficeSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  postcode: z.string().nullable(),
  region: z.string().nullable(),
  city: z.string(),
  country: z.string(),
  location: LocationSchema,
});

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  manager: PersonRefSchema.nullable(),
});

export const ActionSchema = z.object({
  id: z.string(),
  type: z.string(),
  subject: z.string().nullable(),
  created: z.string(),
});

export const FilterOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  count: z.number(),
});

/** `{ data, total }` envelope wrapper for list endpoints. */
export function envelope<T extends z.ZodTypeAny>(item: T) {
  return z.object({ data: z.array(item), total: z.number() });
}

export type Person = z.infer<typeof PersonSchema>;
export type Office = z.infer<typeof OfficeSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type FilterOption = z.infer<typeof FilterOptionSchema>;
export type Envelope<T> = { data: T[]; total: number };
