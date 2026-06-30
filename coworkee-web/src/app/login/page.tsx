'use client';

import { Spin } from 'antd';
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
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <Spin size="large" tip="Redirecting to sign in…">
        <div style={{ padding: 24 }} />
      </Spin>
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
