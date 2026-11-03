import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const APP_NAME = 'TrustGate API';
const APP_VERSION = '1.0.0';
const BUILD_SHA = process.env.BUILD_SHA || 'local';
const PUBLIC_DIRECTORY = new URL('../public/', import.meta.url);

const SECURITY_HEADERS = Object.freeze({
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self'; connect-src 'self'",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
});

const PUBLIC_ASSETS = new Map([
  ['/', { file: 'index.html', contentType: 'text/html; charset=utf-8' }],
  ['/assets/styles.css', { file: 'styles.css', contentType: 'text/css; charset=utf-8' }],
  ['/assets/app.js', { file: 'app.js', contentType: 'text/javascript; charset=utf-8' }]
]);

function sendResponse(request, response, statusCode, contentType, body, extraHeaders = {}) {
  response.writeHead(statusCode, {
    ...SECURITY_HEADERS,
    'Cache-Control': 'no-store',
    'Content-Type': contentType,
    ...extraHeaders
  });

  response.end(request.method === 'HEAD' ? undefined : body);
}

function sendJson(request, response, statusCode, payload, extraHeaders = {}) {
  sendResponse(
    request,
    response,
    statusCode,
    'application/json; charset=utf-8',
    JSON.stringify(payload, null, 2),
    extraHeaders
  );
}

async function serveRequest(request, response, startedAt) {
  const method = request.method || 'GET';

  if (method !== 'GET' && method !== 'HEAD') {
    sendJson(request, response, 405, { error: 'Method not allowed' }, { Allow: 'GET, HEAD' });
    return;
  }

  let pathname;
  try {
    pathname = new URL(request.url || '/', 'http://localhost').pathname;
  } catch {
    sendJson(request, response, 400, { error: 'Invalid request path' });
    return;
  }

  if (pathname === '/health') {
    sendJson(request, response, 200, { service: 'trustgate-api', status: 'ok' });
    return;
  }

  if (pathname === '/api/status' || pathname === '/version') {
    sendJson(request, response, 200, {
      service: APP_NAME,
      status: 'healthy',
      version: APP_VERSION,
      build: {
        commit: BUILD_SHA,
        shortCommit: BUILD_SHA === 'local' ? 'local' : BUILD_SHA.slice(0, 7)
      },
      runtime: process.version,
      startedAt: startedAt.toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    });
    return;
  }

  const asset = PUBLIC_ASSETS.get(pathname);
  if (!asset) {
    sendJson(request, response, 404, { error: 'Not found' });
    return;
  }

  try {
    const contents = await readFile(new URL(asset.file, PUBLIC_DIRECTORY));
    sendResponse(request, response, 200, asset.contentType, contents);
  } catch (error) {
    console.error('A static application file could not be read.', error);
    sendJson(request, response, 500, { error: 'Application error' });
  }
}

export function createAppServer() {
  const startedAt = new Date();

  return createServer((request, response) => {
    void serveRequest(request, response, startedAt).catch((error) => {
      console.error('A request could not be completed.', error);
      if (response.headersSent) {
        response.destroy();
        return;
      }
      sendJson(request, response, 500, { error: 'Application error' });
    });
  });
}

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectRun) {
  const port = Number(process.env.PORT || 10000);
  const server = createAppServer();

  server.listen(port, '0.0.0.0', () => {
    console.log(`${APP_NAME} is listening on port ${port}.`);
  });

  const stop = () => {
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
