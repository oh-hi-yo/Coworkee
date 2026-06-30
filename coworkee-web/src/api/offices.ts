import { apiFetch } from './http';
import { OfficeSchema, envelope, type Office } from './schemas';

const OfficesEnvelope = envelope(OfficeSchema);

export async function listOffices(opts: { token?: string; signal?: AbortSignal } = {}): Promise<Office[]> {
  const r = await apiFetch('/offices', { token: opts.token, schema: OfficesEnvelope, signal: opts.signal });
  return r.data;
}
