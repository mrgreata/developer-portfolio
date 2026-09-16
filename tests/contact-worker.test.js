const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync(require('node:path').join(__dirname, '../cloudflare/worker.js'), 'utf8');
function setup(fetchImpl = async () => { throw new Error('Unexpected outgoing request'); }) {
  const context = { Request, Response, URL, crypto: webcrypto, fetch: fetchImpl, console: { error() {}, warn() {} } };
  vm.runInNewContext(source.replace('export default {', 'globalThis.worker = {'), context);
  return context.worker;
}
const valid = { name: 'Test Person', email: 'test@example.com', projectType: 'Website', message: 'A test message with <script>markup</script>\nSecond line' };
function request(body = valid, method = 'POST') {
  return new Request('https://example.com/contact', { method, headers: { Origin: 'http://localhost:4174', 'Content-Type': 'application/json' }, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) });
}
test('contact preflight permits the local form origin', async () => {
  const response = await setup().fetch(request(null, 'OPTIONS'), {});
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'http://localhost:4174');
});
for (const [field, value] of [['name', ''], ['email', 'invalid'], ['projectType', ''], ['message', 'short']]) {
  test('worker rejects invalid ' + field + ' before sending email', async () => {
    const response = await setup().fetch(request({ ...valid, [field]: value }), {});
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, 'validation_failed');
  });
}
test('honeypot silently discards bots without email', async () => {
  const response = await setup().fetch(request({ ...valid, website: 'spam' }), {});
  assert.equal(response.status, 200);
});
test('missing email configuration is not reported as success', async () => {
  const response = await setup().fetch(request(), {});
  assert.equal(response.status, 500);
  assert.equal((await response.json()).ok, false);
});
test('required Turnstile rejects a missing token', async () => {
  const response = await setup().fetch(request(), { TURNSTILE_SECRET_KEY: 'test' });
  assert.equal(response.status, 403);
});
test('email payload uses configured recipient, reply address and escaped HTML', async () => {
  let payload;
  const worker = setup(async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    payload = JSON.parse(options.body);
    return new Response(JSON.stringify({ id: 'test-id' }), { status: 200 });
  });
  const response = await worker.fetch(request(), { RESEND_API_KEY: 'test-only', CONTACT_TO_EMAIL: 'studio@example.com' });
  assert.equal((await response.json()).ok, true);
  assert.deepEqual(payload.to, ['studio@example.com']);
  assert.equal(payload.reply_to, valid.email);
  assert.ok(payload.text.includes(valid.message));
  assert.ok(payload.html.includes('&lt;script&gt;'));
  assert.ok(!payload.html.includes('<script>'));
});
test('email provider rejection is returned as failure', async () => {
  const response = await setup(async () => new Response('rejected', { status: 403 })).fetch(request(), { RESEND_API_KEY: 'test-only' });
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error, 'email_failed');
});
