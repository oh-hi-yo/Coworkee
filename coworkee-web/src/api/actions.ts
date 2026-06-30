import { apiFetch, queryString } from './http';
import { ActionSchema, envelope, type Action } from './schemas';

const ActionsEnvelope = envelope(ActionSchema);

/** BR-14: a person's activity history (actions where they are the recipient). */
export async function listActions(
  recipientId: string,
  opts: { token?: string; signal?: AbortSignal } = {},
): Promise<Action[]> {
  const qs = queryString({ recipient_id: recipientId });
  const r = await apiFetch(`/actions${qs}`, {
    token: opts.token,
    schema: ActionsEnvelope,
    signal: opts.signal,
  });
  return r.data;
}
