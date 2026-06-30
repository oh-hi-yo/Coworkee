'use client';

import { PersonWizard } from '@/components/PersonWizard';
import { useHasRole } from '@/lib/useAccessToken';
import { Layout, Result } from 'antd';
import Link from 'next/link';

export default function NewPersonPage() {
  const isAdmin = useHasRole('coworkee-admin');
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Link href="/people">← Directory</Link>
      </Layout.Header>
      <Layout.Content>
        {isAdmin ? (
          <PersonWizard mode="create" />
        ) : (
          <Result status="403" title="403" subTitle="You don't have permission to add employees." />
        )}
      </Layout.Content>
    </Layout>
  );
}
