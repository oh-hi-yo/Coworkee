'use client';

import { getPerson } from '@/api/people';
import type { Person } from '@/api/schemas';
import { PersonWizard } from '@/components/PersonWizard';
import { type PersonFormValues } from '@/domain/person/personForm';
import { useAccessToken, useHasRole } from '@/lib/useAccessToken';
import { useQuery } from '@tanstack/react-query';
import { Layout, Result, Spin } from 'antd';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function toForm(p: Person): PersonFormValues {
  return {
    firstname: p.firstname,
    lastname: p.lastname,
    username: p.username,
    email: p.email,
    title: p.title ?? '',
    phone: p.phone ?? '',
    extension: p.extension ?? '',
    skype: p.skype ?? '',
    linkedin: p.linkedin ?? '',
    birthday: p.birthday,
    started: p.started ?? '',
    ended: p.ended ?? '',
    officeId: p.office?.id ?? '',
    organizationId: p.organization?.id ?? '',
  };
}

export default function EditPersonPage() {
  const params = useParams<{ key: string }>();
  const token = useAccessToken();
  const isAdmin = useHasRole('coworkee-admin');

  const { data: person } = useQuery({
    queryKey: ['person', params.key],
    queryFn: ({ signal }) => getPerson(params.key, { token, signal }),
    enabled: !!token,
  });

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Link href="/people">← Directory</Link>
      </Layout.Header>
      <Layout.Content>
        {!isAdmin ? (
          <Result status="403" title="403" subTitle="You don't have permission to edit employees." />
        ) : !person ? (
          <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
            <Spin size="large" />
          </div>
        ) : (
          <PersonWizard mode="edit" personId={person.id} initialValues={toForm(person)} />
        )}
      </Layout.Content>
    </Layout>
  );
}
