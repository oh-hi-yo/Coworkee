'use client';

import { getPerson } from '@/api/people';
import { listActions } from '@/api/actions';
import { listPeople } from '@/api/people';
import type { Person } from '@/api/schemas';
import { dateDiff } from '@/domain/format/dateDiff';
import { formatLongDate, parseLocalDate } from '@/domain/format/date';
import { telUri, skypeUri, mailtoUri, linkedinUrl } from '@/domain/person/contact';
import { useAccessToken, useHasRole } from '@/lib/useAccessToken';
import { useQuery } from '@tanstack/react-query';
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Layout,
  List,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const now = () => new Date();

export default function PersonDetailPage() {
  const params = useParams<{ key: string }>();
  const key = params.key;
  const token = useAccessToken();
  const isAdmin = useHasRole('coworkee-admin');
  const router = useRouter();

  const { data: person, isLoading } = useQuery({
    queryKey: ['person', key],
    queryFn: ({ signal }) => getPerson(key, { token, signal }),
    enabled: !!token,
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['actions', person?.id],
    queryFn: ({ signal }) => listActions(person!.id, { token, signal }),
    enabled: !!token && !!person?.id,
  });

  // BR-14: coworkers = same organization, excluding self.
  const { data: coworkersEnvelope } = useQuery({
    queryKey: ['coworkers', person?.organization?.id],
    queryFn: ({ signal }) =>
      listPeople({ token, organizationId: person!.organization!.id, size: 100, signal }),
    enabled: !!token && !!person?.organization?.id,
  });
  const coworkers = (coworkersEnvelope?.data ?? []).filter((c) => c.id !== person?.id);

  if (isLoading || !person) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header
        style={{
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link href="/people">← Directory</Link>
        {isAdmin && (
          <Button type="primary" onClick={() => router.push(`/people/${person.id}/edit`)}>
            Edit
          </Button>
        )}
      </Layout.Header>

      <Layout.Content style={{ padding: 24, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <Card style={{ marginBottom: 16 }}>
          <Space align="start" size={24}>
            <Avatar src={person.picture ?? undefined} size={96}>
              {person.firstname[0]}
            </Avatar>
            <div>
              <Typography.Title level={3} style={{ margin: 0 }}>
                {person.fullname}
              </Typography.Title>
              <Typography.Text type="secondary">{person.title}</Typography.Text>
              <div style={{ marginTop: 12 }}>
                <ContactButtons person={person} />
              </div>
            </div>
          </Space>
        </Card>

        <Card title="Details" style={{ marginBottom: 16 }}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Username">{person.username}</Descriptions.Item>
            <Descriptions.Item label="Email">{person.email}</Descriptions.Item>
            {/* BR-17: conditional fields */}
            {person.phone && <Descriptions.Item label="Phone">{person.phone}</Descriptions.Item>}
            {person.extension && (
              <Descriptions.Item label="Extension">{person.extension}</Descriptions.Item>
            )}
            {person.skype && <Descriptions.Item label="Skype">{person.skype}</Descriptions.Item>}
            {person.linkedin && (
              <Descriptions.Item label="LinkedIn">{person.linkedin}</Descriptions.Item>
            )}
            <Descriptions.Item label="Office">{person.office?.name ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Organization">
              {person.organization?.name ?? '—'}
            </Descriptions.Item>

            {/* BR-15/17: birthday + age */}
            <Descriptions.Item label="Birthday">
              {formatLongDate(person.birthday)}
              <Typography.Text type="secondary">
                {' '}
                ({dateDiff(parseLocalDate(person.birthday), now())})
              </Typography.Text>
            </Descriptions.Item>

            {/* Entry date + tenure (if still employed) */}
            {person.started && (
              <Descriptions.Item label="Entry Date">
                {formatLongDate(person.started)}
                {!person.ended && (
                  <Typography.Text type="secondary">
                    {' '}
                    ({dateDiff(parseLocalDate(person.started), now())})
                  </Typography.Text>
                )}
              </Descriptions.Item>
            )}

            {/* Exit date + tenure (if left) */}
            {person.ended && person.started && (
              <Descriptions.Item label="Exit Date">
                {formatLongDate(person.ended)}
                <Typography.Text type="secondary">
                  {' '}
                  ({dateDiff(parseLocalDate(person.started), parseLocalDate(person.ended))})
                </Typography.Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Space align="start" size={16} style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Card title={`History (${actions.length})`} style={{ flex: '1 1 380px' }}>
            <List
              size="small"
              dataSource={actions}
              locale={{ emptyText: 'No activity' }}
              renderItem={(a) => (
                <List.Item>
                  <Space>
                    <Tag>{a.type}</Tag>
                    <span>{a.subject}</span>
                    <Typography.Text type="secondary">{a.created.slice(0, 10)}</Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>

          <Card title={`Coworkers (${coworkers.length})`} style={{ flex: '1 1 380px' }}>
            <List
              size="small"
              dataSource={coworkers}
              locale={{ emptyText: 'No coworkers' }}
              renderItem={(c) => (
                <List.Item>
                  <Space>
                    <Avatar src={c.picture ?? undefined} size="small">
                      {c.firstname[0]}
                    </Avatar>
                    <Link href={`/people/${c.id}`}>{c.fullname}</Link>
                    <Typography.Text type="secondary">{c.title}</Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Space>
      </Layout.Content>
    </Layout>
  );
}

/** BR-05~08 contact actions, shown only when the source field is present. */
function ContactButtons({ person }: { person: Person }) {
  const tel = telUri(person.phone, person.extension);
  const skype = skypeUri(person.skype);
  const mail = mailtoUri(person.email);
  const linkedin = linkedinUrl(person.linkedin);
  return (
    <Space wrap>
      {mail && (
        <Button href={mail} size="small">
          Email
        </Button>
      )}
      {tel && (
        <Button href={tel} size="small">
          Call
        </Button>
      )}
      {skype && (
        <Button href={skype} size="small">
          Skype
        </Button>
      )}
      {linkedin && (
        <Button href={linkedin} target="_blank" size="small">
          LinkedIn
        </Button>
      )}
    </Space>
  );
}
