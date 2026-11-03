import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createAppServer } from '../src/server.js';

const server = createAppServer();
let baseUrl;

before(async () => {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe('TrustGate API', () => {
  it('returns a healthy response from the health endpoint', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, { service: 'trustgate-api', status: 'ok' });
  });

  it('returns release metadata without exposing environment variables', async () => {
    const response = await fetch(`${baseUrl}/api/status`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.service, 'TrustGate API');
    assert.equal(body.status, 'healthy');
    assert.equal(body.version, '1.0.0');
    assert.equal(typeof body.build.commit, 'string');
    assert.equal(JSON.stringify(body).includes('RENDER_API_KEY'), false);
  });

  it('serves the dashboard and its local assets', async () => {
    const page = await fetch(`${baseUrl}/`);
    const css = await fetch(`${baseUrl}/assets/styles.css`);
    const script = await fetch(`${baseUrl}/assets/app.js`);

    assert.equal(page.status, 200);
    assert.match(await page.text(), /Secure CI\/CD for a cloud-native app/);
    assert.equal(css.status, 200);
    assert.match(css.headers.get('content-type'), /text\/css/);
    assert.equal(script.status, 200);
    assert.match(script.headers.get('content-type'), /javascript/);
  });

  it('adds browser security headers to responses', async () => {
    const response = await fetch(`${baseUrl}/health`);

    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.match(response.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  });

  it('rejects unsupported HTTP methods', async () => {
    const response = await fetch(`${baseUrl}/health`, { method: 'POST' });
    const body = await response.json();

    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'GET, HEAD');
    assert.deepEqual(body, { error: 'Method not allowed' });
  });

  it('returns a safe not-found response for unknown routes', async () => {
    const response = await fetch(`${baseUrl}/private/config`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.deepEqual(body, { error: 'Not found' });
  });
});
