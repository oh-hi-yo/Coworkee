'use client';

import { listPeople, listPeopleFilters } from '@/api/people';
import type { Person } from '@/api/schemas';
import { groupByLastInitial } from '@/domain/person/grouping';
import { useAccessToken, useHasRole } from '@/lib/useAccessToken';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Button, Input, Layout, Select, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

type GroupRow = { kind: 'group'; rowKey: string; letter: string };
type PersonRow = Person & { kind: 'person'; rowKey: string };
type Row = GroupRow | PersonRow;

const COLS = 6;
const hideOnGroup = (row: Row) => (row.kind === 'group' ? { colSpan: 0 } : {});

function PeopleList() {
  const token = useAccessToken();
  const isAdmin = useHasRole('coworkee-admin');
  const { data: session } = useSession();
  const router = useRouter();
  const sp = useSearchParams();

  const [search, setSearch] = useState(sp.get('search') ?? '');
  const [committedSearch, setCommittedSearch] = useState(sp.get('search') ?? '');
  const [officeId, setOfficeId] = useState<string | undefined>(sp.get('office_id') ?? undefined);
  const [organizationId, setOrganizationId] = useState<string | undefined>(
    sp.get('organization_id') ?? undefined,
  );

  // BR-13: debounce the search input 500ms before it drives the query.
  useEffect(() => {
    const t = setTimeout(() => setCommittedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  // BR-12: keep filters in the URL (shareable).
  useEffect(() => {
    const params = new URLSearchParams();
    if (committedSearch) params.set('search', committedSearch);
    if (officeId) params.set('office_id', officeId);
    if (organizationId) params.set('organization_id', organizationId);
    const qs = params.toString();
    router.replace(qs ? `/people?${qs}` : '/people');
  }, [committedSearch, officeId, organizationId, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['people', { committedSearch, officeId, organizationId }],
    queryFn: ({ signal }) =>
      listPeople({ token, search: committedSearch, officeId, organizationId, size: 500, signal }),
    enabled: !!token,
  });

  const { data: officeOptions = [] } = useQuery({
    queryKey: ['filters', 'office_id'],
    queryFn: () => listPeopleFilters('office_id', { token }),
    enabled: !!token,
  });
  const { data: orgOptions = [] } = useQuery({
    queryKey: ['filters', 'organization_id'],
    queryFn: () => listPeopleFilters('organization_id', { token }),
    enabled: !!token,
  });

  // BR-10: build grouped rows (group header + person rows).
  const rows = useMemo<Row[]>(() => {
    const people = data?.data ?? [];
    return groupByLastInitial(people).flatMap((g) => [
      { kind: 'group', rowKey: `__g_${g.letter}`, letter: g.letter } as GroupRow,
      ...g.items.map((p) => ({ ...p, kind: 'person', rowKey: p.id }) as PersonRow),
    ]);
  }, [data]);

  const columns: ColumnsType<Row> = [
    {
      title: '',
      width: 56,
      onCell: (row) => (row.kind === 'group' ? { colSpan: COLS } : {}),
      render: (_: unknown, row) =>
        row.kind === 'group' ? (
          <Typography.Text strong>{row.letter}</Typography.Text>
        ) : (
          <Avatar src={row.picture ?? undefined}>{row.firstname[0]}</Avatar>
        ),
    },
    {
      title: 'Name',
      onCell: hideOnGroup,
      render: (_: unknown, row) =>
        row.kind === 'person' ? <Link href={`/people/${row.id}`}>{row.fullname}</Link> : null,
    },
    {
      title: 'Title',
      onCell: hideOnGroup,
      render: (_: unknown, row) => (row.kind === 'person' ? row.title : null),
    },
    {
      title: 'Office',
      onCell: hideOnGroup,
      render: (_: unknown, row) => (row.kind === 'person' ? (row.office?.name ?? null) : null),
    },
    {
      title: 'Organization',
      onCell: hideOnGroup,
      render: (_: unknown, row) =>
        row.kind === 'person' ? (row.organization?.name ?? null) : null,
    },
    {
      title: 'Phone',
      onCell: hideOnGroup,
      render: (_: unknown, row) => (row.kind === 'person' ? row.phone : null),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Coworkee
        </Typography.Title>
        <Space>
          {session?.user?.name && <Typography.Text>{session.user.name}</Typography.Text>}
          <Button size="small" onClick={() => signOut({ callbackUrl: '/login' })}>
            Sign out
          </Button>
        </Space>
      </Layout.Header>
      <Layout.Content style={{ padding: 24 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input.Search
            allowClear
            placeholder="Search name, email, title…"
            style={{ width: 280 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            allowClear
            placeholder="Office"
            style={{ width: 200 }}
            value={officeId}
            onChange={(v) => setOfficeId(v)}
            options={officeOptions.map((o) => ({ value: o.value, label: `${o.label} (${o.count})` }))}
          />
          <Select
            allowClear
            placeholder="Organization"
            style={{ width: 220 }}
            value={organizationId}
            onChange={(v) => setOrganizationId(v)}
            options={orgOptions.map((o) => ({ value: o.value, label: `${o.label} (${o.count})` }))}
          />
          {isAdmin && (
            <Button type="primary" onClick={() => router.push('/people/new')}>
              Add employee
            </Button>
          )}
        </Space>
        <Table<Row>
          rowKey="rowKey"
          columns={columns}
          dataSource={rows}
          loading={isLoading}
          pagination={false}
          size="middle"
        />
      </Layout.Content>
    </Layout>
  );
}

export default function PeoplePage() {
  return (
    <Suspense fallback={null}>
      <PeopleList />
    </Suspense>
  );
}
