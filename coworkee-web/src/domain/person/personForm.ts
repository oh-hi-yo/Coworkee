import { z } from 'zod';

/**
 * BR-18 — required fields for the create/edit Wizard: firstname, lastname, username,
 * birthday, email, phone, title, started, office, organization. Username keeps the legacy
 * `len >= 6` rule. No password (ADR-004 → BR-19/20 N/A). The legacy default
 * `requiredMessage` ("This field is required") is preserved.
 */
const REQUIRED = 'This field is required';
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date');
const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const optional = z.string().optional();

export const personFormSchema = z.object({
  firstname: z.string().min(1, REQUIRED),
  lastname: z.string().min(1, REQUIRED),
  username: z.string().min(6, 'Username must be at least 6 characters'),
  email: z.string().min(1, REQUIRED).regex(emailRe, 'Enter a valid email'),
  title: z.string().min(1, REQUIRED),
  phone: z.string().min(1, REQUIRED),
  extension: optional,
  skype: optional,
  linkedin: optional,
  birthday: isoDate,
  started: isoDate,
  ended: z.union([isoDate, z.literal('')]).optional(),
  officeId: z.string().min(1, REQUIRED),
  organizationId: z.string().min(1, REQUIRED),
});

export type PersonFormValues = z.infer<typeof personFormSchema>;

/** Fields validated on each wizard step (drives per-step `trigger`). */
export const WIZARD_STEP_FIELDS: (keyof PersonFormValues)[][] = [
  ['firstname', 'lastname', 'username', 'email', 'title'], // General
  ['birthday', 'phone', 'extension', 'skype', 'linkedin'], // Personal
  ['officeId', 'organizationId', 'started', 'ended'], // Work
];

export const emptyPersonForm: PersonFormValues = {
  firstname: '',
  lastname: '',
  username: '',
  email: '',
  title: '',
  phone: '',
  extension: '',
  skype: '',
  linkedin: '',
  birthday: '',
  started: '',
  ended: '',
  officeId: '',
  organizationId: '',
};
