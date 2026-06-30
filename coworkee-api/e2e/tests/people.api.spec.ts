import { test, expect, APIRequestContext } from '@playwright/test';
import { getToken, auth } from '../helpers/auth';

const BANKS_ID = 'a6987240-610f-4dc6-b0a7-3d53d47591ad';
const BANKS_USERNAME = 'benjamin.banks';
const BANKS_EMAIL = 'benjamin.banks@extjsdemo.com';
const OFFICE_ID = '2725949a-a1a5-45f8-ab29-4605629f9b49';
const ORG_ID = '9f2cea7a-2147-4a3f-aebf-f0956591c6e8';

let adminToken: string;
let viewerToken: string;

test.beforeAll(async ({ playwright }) => {
  const request: APIRequestContext = await playwright.request.newContext();
  adminToken = await getToken(request, 'admin', 'admin');
  viewerToken = await getToken(request, 'viewer', 'viewer');
  await request.dispose();
});

test('unauthenticated request is rejected', async ({ request }) => {
  const res = await request.get('/api/people');
  expect(res.status()).toBe(401);
});

test('viewer can list seed people with envelope + default lastname sort', async ({ request }) => {
  const res = await request.get('/api/people?size=10', { headers: auth(viewerToken) });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.total).toBe(51);
  expect(body.data).toHaveLength(10);
  expect(body.data[0].lastname).toBe('Armstrong');
});

// BR-04
test('person resolves by id, username and email', async ({ request }) => {
  for (const key of [BANKS_ID, BANKS_USERNAME, BANKS_EMAIL]) {
    const res = await request.get(`/api/people/${encodeURIComponent(key)}`, {
      headers: auth(viewerToken),
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.id).toBe(BANKS_ID);
    expect(body.fullname).toBe('Benjamin Banks');
    expect(body.url).toBe(`person/${BANKS_ID}`);
    expect(body.picture).toContain('/api/portraits/');
  }
});

// BR-21
test('generate-username sanitizes name to underscore base', async ({ request }) => {
  const res = await request.get('/api/people/generate-username?firstname=Benjamin&lastname=Banks', {
    headers: auth(viewerToken),
  });
  expect(res.ok()).toBeTruthy();
  expect((await res.json()).username).toBe('benjamin_banks');
});

// ADR-005 — write authorization
test('viewer cannot create (403), admin can create (201)', async ({ request }) => {
  const payload = {
    email: 'e2e.person@extjsdemo.com',
    username: 'e2e_person',
    firstname: 'E2E',
    lastname: 'Person',
    title: 'Tester',
    phone: '1-555-0150',
    birthday: '1991-02-03',
    started: '2021-03-04',
    officeId: OFFICE_ID,
    organizationId: ORG_ID,
  };

  const forbidden = await request.post('/api/people', {
    headers: auth(viewerToken),
    data: payload,
  });
  expect(forbidden.status()).toBe(403);

  const created = await request.post('/api/people', {
    headers: auth(adminToken),
    data: { ...payload, email: `e2e.${Date.now()}@extjsdemo.com`, username: `e2e_${Date.now()}` },
  });
  expect(created.status()).toBe(201);
  const body = await created.json();
  expect(body.fullname).toBe('E2E Person');
});
