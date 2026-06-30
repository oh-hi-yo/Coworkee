import NextAuth from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';

/** Decode the Keycloak realm roles from an access token's `realm_access.roles`. */
function rolesFromAccessToken(accessToken?: string): string[] {
  if (!accessToken) {
    return [];
  }
  try {
    const payload = accessToken.split('.')[1];
    const json = Buffer.from(payload, 'base64').toString('utf8');
    const claims = JSON.parse(json);
    return claims?.realm_access?.roles ?? [];
  } catch {
    return [];
  }
}

/**
 * NextAuth (Auth.js v5) wired to Keycloak (OIDC). Reads AUTH_KEYCLOAK_ID/SECRET/ISSUER.
 * The access token + realm roles are threaded into the session so the API layer can
 * authorize and the UI can show/hide writes by role.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Keycloak],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.roles = rolesFromAccessToken(account.access_token);
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.roles = (token.roles as string[] | undefined) ?? [];
      return session;
    },
  },
});
