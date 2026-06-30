import { apiFetch } from './http';
import { OrganizationSchema, envelope, type Organization } from './schemas';

const OrganizationsEnvelope = envelope(OrganizationSchema);

export async function listOrganizations(
  opts: { token?: string; signal?: AbortSignal } = {},
): Promise<Organization[]> {
  const r = await apiFetch('/organizations', {
    token: opts.token,
    schema: OrganizationsEnvelope,
    signal: opts.signal,
  });
  return r.data;
}
