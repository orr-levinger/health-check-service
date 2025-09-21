import nock from 'nock';
import { CheckEndpoint } from '../src/lib/check-endpoint';

describe('CheckEndpoint', () => {
  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  it('returns healthy for a 200 response', async () => {
    nock('http://success.test').get('/').reply(200, { ok: true });

    const result = await CheckEndpoint('http://success.test/', 500);

    expect(result.status).toBe('healthy');
    expect(result.statusCode).toBe(200);
    expect(result.errorMessage).toBeUndefined();
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('returns unhealthy for non-2xx responses', async () => {
    nock('http://failure.test').get('/').reply(503);

    const result = await CheckEndpoint('http://failure.test', 500);

    expect(result.status).toBe('unhealthy');
    expect(result.statusCode).toBe(503);
    expect(result.errorMessage).toContain('Non-2xx status code');
  });

  it('handles timeouts gracefully', async () => {
    nock('http://timeout.test').get('/').delay(200).reply(200, {});

    const result = await CheckEndpoint('http://timeout.test', 50);

    expect(result.status).toBe('unhealthy');
    expect(result.statusCode).toBeUndefined();
    expect(result.errorMessage).toContain('Request timed out');
  });

  it('handles network errors gracefully', async () => {
    nock('http://network-error.test').get('/').replyWithError('socket hang up');

    const result = await CheckEndpoint('http://network-error.test', 1000);

    expect(result.status).toBe('unhealthy');
    expect(result.statusCode).toBeUndefined();
    expect(result.errorMessage).toContain('socket hang up');
  });

  it('handles invalid URLs gracefully', async () => {
    const result = await CheckEndpoint('notaurl', 1000);

    expect(result.status).toBe('unhealthy');
    expect(result.statusCode).toBeUndefined();
    expect(result.errorMessage).toBeDefined();
  });
});
