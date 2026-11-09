const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const createApp = require('../app');

test('app factory serves health checks without connecting to MongoDB', async (t) => {
  const server = createApp().listen(0);
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'OK');
});
