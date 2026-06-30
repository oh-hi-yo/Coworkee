import { auth } from '@/auth';

/**
 * Route protection (Next 16 Proxy, formerly Middleware). Unauthenticated users hitting
 * a protected route are sent to /login, which immediately initiates the Keycloak OIDC
 * flow (BR — "未登入導向 Keycloak 登入頁").
 */
export default auth((req) => {
  const { pathname, search, origin } = req.nextUrl;
  const isPublic = pathname.startsWith('/login');
  if (!req.auth && !isPublic) {
    const url = new URL('/login', origin);
    url.searchParams.set('callbackUrl', pathname + search);
    return Response.redirect(url);
  }
});

export const config = {
  // everything except auth endpoints, Next internals and static assets
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
