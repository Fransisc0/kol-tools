import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import { createEmptyResponse } from './responseFactory';

const PUBLIC_ORIGIN = 'https://fransisc0.github.io';

function testData() {
  return createEmptyResponse('Seal_Clubber', 'Mongoose');
}

describe('public API', () => {
  it('serves health without caching or rate limiting', async () => {
    const app = await createApp({ isProduction: true, dataLoader: vi.fn() });
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('permits the GitHub Pages origin and emits security headers', async () => {
    const app = await createApp({ isProduction: true, dataLoader: async () => testData() });
    const response = await request(app)
      .get('/api/tcrs?class=Seal_Clubber&sign=Mongoose')
      .set('Origin', PUBLIC_ORIGIN);

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(PUBLIC_ORIGIN);
    expect(response.headers['content-security-policy']).toContain("default-src 'none'");
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['cache-control']).toContain('max-age=600');
    expect(response.headers.etag).toBeTruthy();
  });

  it('rejects unapproved origins and write methods', async () => {
    const app = await createApp({ isProduction: true, dataLoader: async () => testData() });
    const rejectedOrigin = await request(app).get('/api/health').set('Origin', 'https://example.invalid');
    const rejectedMethod = await request(app).post('/api/health').set('Origin', PUBLIC_ORIGIN);

    expect(rejectedOrigin.status).toBe(403);
    expect(rejectedMethod.status).toBe(405);
    expect(rejectedMethod.headers.allow).toContain('GET');
  });

  it('validates class and sign parameters', async () => {
    const app = await createApp({ isProduction: true, dataLoader: async () => testData() });
    const response = await request(app).get('/api/tcrs?class=Not_A_Class&sign=Mongoose');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid class or moon sign specified.');
  });

  it('returns not-modified for a matching ETag', async () => {
    const app = await createApp({ isProduction: true, dataLoader: async () => testData() });
    const first = await request(app).get('/api/tcrs');
    const second = await request(app).get('/api/tcrs').set('If-None-Match', first.headers.etag);
    expect(second.status).toBe(304);
  });

  it('applies a bounded per-IP rate limit to TCRS requests', async () => {
    const app = await createApp({
      isProduction: true,
      rateLimitMax: 2,
      dataLoader: async () => testData(),
    });
    expect((await request(app).get('/api/tcrs')).status).toBe(200);
    expect((await request(app).get('/api/tcrs')).status).toBe(200);
    expect((await request(app).get('/api/tcrs')).status).toBe(429);
  });

  it('returns a generic error when data loading fails', async () => {
    const app = await createApp({
      isProduction: true,
      dataLoader: async () => {
        throw new Error('sensitive internal path');
      },
    });
    const response = await request(app).get('/api/tcrs');
    expect(response.status).toBe(500);
    expect(response.text).not.toContain('sensitive internal path');
  });
});
