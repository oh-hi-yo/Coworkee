'use client';

import { listPeople } from '@/api/people';
import type { Person } from '@/api/schemas';
import { useAccessToken } from '@/lib/useAccessToken';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Layout, Table, Typography, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

const PAGE_SIZE = 25;

const columns: ColumnsType<Person> = [
  {
    title: '',
    dataIndex: 'picture',
    width: 56,
    render: (picture: string | null, p) => <Avatar src={picture ?? undefined}>{p.firstname[0]}</Avatar>,
  },
  {
    title: 'Name',
    dataIndex: 'fullname',
    render: (fullname: string, p) => <Link href={`/people/${p.id}`}>{fullname}</Link>,
  },
  { title: 'Title', dataIndex: 'title' },
  { title: 'Office', dataIndex: ['office', 'name'] },
  { title: 'Organization', dataIndex: ['organization', 'name'] },
  { title: 'Phone', dataIndex: 'phone' },
];

export default function PeoplePage() {
  const token = useAccessToken();
  const { data: session } = useSession();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['people', { page }],
    queryFn: ({ signal }) => listPeople({ token, page: page - 1, size: PAGE_SIZE, signal }),
    enabled: !!token,
  });

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
        <Table<Person>
          rowKey="id"
          columns={columns}
          dataSource={data?.data ?? []}
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total: data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Layout.Content>
    </Layout>
  );
}
