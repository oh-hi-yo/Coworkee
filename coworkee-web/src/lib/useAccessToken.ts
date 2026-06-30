'use client';

import { useSession } from 'next-auth/react';

/** Current Keycloak access token (for the API anti-corruption layer). */
export function useAccessToken(): string | undefined {
  const { data } = useSession();
  return data?.accessToken;
}

/** Whether the signed-in user holds a given realm role (e.g. `coworkee-admin`). */
export function useHasRole(role: string): boolean {
  const { data } = useSession();
  return data?.roles?.includes(role) ?? false;
}
