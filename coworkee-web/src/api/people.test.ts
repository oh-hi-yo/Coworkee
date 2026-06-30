import { describe, it, expect, vi, afterEach } from 'vitest';
import { listPeople, generateUsername } from './people';
import { ApiError } from './http';

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'mock',
    json: async () => body,
  } as Response);
}

const samplePerson = {
  id: 'a6987240-610f-4dc6-b0a7-3d53d47591ad',
  email: 'benjamin.banks@extjsdemo.com',
  username: 'benjamin.banks',
  firstname: 'Benjamin',
  lastname: 'Banks',
  fullname: 'Benjamin Banks',
  title: 'Account Executive',
  phone: '1-261-555-0107',
  extension: null,
  skype: 'bbanks0',
  linkedin: 'benjamin.banks',
  picture: 'http://localhost:8080/api/portraits/men/0.jpg',
  birthday: '1984-12-12',
  started: '2009-11-06',
  ended: null,
  office: { id: 'o1', name: 'Fairfield', city: 'Energodar', country: 'Ukraine' },
  organization: { id: 'g1', name: 'Services' },
  url: 'person/a6987240-610f-4dc6-b0a7-3d53d47591ad',
};

afterEach(() => vi.unstubAllGlobals());

describe('anti-corruption layer (P4)', () => {
  it('unwraps the { data, total } envelope and Zod-parses (BR-09)', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { data: [samplePerson], total: 51 }));
    const res = await listPeople({ token: 't', size: 10 });
    expect(res.total).toBe(51);
    expect(res.data).toHaveLength(1);
    expect(res.data[0].fullname).toBe('Benjamin Banks');
  });

  it('rejects malformed payloads via Zod', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { data: [{ id: 1 }], total: 'nope' }));
    await expect(listPeople({ token: 't' })).rejects.toBeTruthy();
  });

  it('surfaces backend { message } as ApiError', async () => {
    vi.stubGlobal('fetch', mockFetch(404, { message: 'Unknown person' }));
    await expect(listPeople({ token: 't' })).rejects.toBeInstanceOf(ApiError);
  });

  it('generateUsername returns the username string (BR-21)', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { username: 'benjamin_banks' }));
    expect(await generateUsername('Benjamin', 'Banks', { token: 't' })).toBe('benjamin_banks');
  });
});
