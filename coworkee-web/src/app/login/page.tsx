'use client';

import { Spin, Typography } from 'antd';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function LoginRedirect() {
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/people';

  useEffect(() => {
    // Single provider → go straight to Keycloak (no NextAuth chooser page).
    void signIn('keycloak', { callbackUrl });
  }, [callbackUrl]);

  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '100vh',
        gap: 16,
      }}
    >
      <Spin size="large" />
      <Typography.Text type="secondary">Redirecting to sign in…</Typography.Text>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginRedirect />
    </Suspense>
  );
}
