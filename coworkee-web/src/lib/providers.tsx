'use client';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App, ConfigProvider } from 'antd';
import { SessionProvider } from 'next-auth/react';
import { useState, type ReactNode } from 'react';

/** Client providers: AntD (SSR registry + App context) + TanStack Query + NextAuth session. */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <AntdRegistry>
      <ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
        <App>
          <SessionProvider>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
          </SessionProvider>
        </App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
