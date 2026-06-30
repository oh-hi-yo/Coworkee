import { APIRequestContext } from '@playwright/test';

const KEYCLOAK_BASE = process.env.KEYCLOAK_BASE ?? 'http://localhost:8081';
const TOKEN_URL = `${KEYCLOAK_BASE}/realms/coworkee/protocol/openid-connect/token`;
const CLIENT_ID = 'coworkee-web';
const CLIENT_SECRET = 'coworkee-web-secret';

/** Direct-access-grant token for a seed Keycloak user (BR / Phase 5 realm). */
export async function getToken(
  request: APIRequestContext,
  username: string,
  password: string,
): Promise<string> {
  const res = await request.post(TOKEN_URL, {
    form: {
      grant_type: 'password',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      username,
      password,
    },
  });
  if (!res.ok()) {
    throw new Error(`Token request failed (${res.status()}): ${await res.text()}`);
  }
  const body = await res.json();
  return body.access_token as string;
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
