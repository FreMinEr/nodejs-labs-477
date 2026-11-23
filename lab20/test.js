import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { start } from './server.js';
test('CRUD, kesh i validaciya HTTP', async () => {
  process.env.PORT = '0'; process.env.HTTPS_PORT = '0';
  const servers = start(5);
  await Promise.all(servers.map(server => once(server, 'listening')));
  const base = `http://127.0.0.1:${servers[0].address().port}`;
  try {
    let res = await fetch(base + '/api/students'); const before = await res.json(); assert.equal(res.headers.get('x-cache'), 'MISS');
    res = await fetch(base + '/api/students'); assert.deepEqual(await res.json(), before); assert.equal(res.headers.get('x-cache'), 'HIT');
    res = await fetch(base + '/api/students', { method: 'POST', body: JSON.stringify({ name: 'Petr', group: '477' }) }); assert.equal(res.status, 201); const created = await res.json();
    res = await fetch(base + '/api/students'); assert.equal(res.headers.get('x-cache'), 'MISS'); assert.equal((await res.json()).length, before.length + 1);
    res = await fetch(base + `/api/students/${created.id}`, { method: 'PUT', body: '{"name":"Pavel"}' }); assert.equal((await res.json()).name, 'Pavel');
    assert.equal((await fetch(base + `/api/students/${created.id}`, { method: 'DELETE' })).status, 200);
    assert.equal((await fetch(base + '/api/students/1', { method: 'PATCH' })).status, 405);
    assert.equal((await fetch(base + '/echo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
    assert.equal((await fetch(base + '/echo', { method: 'POST', body: 'x'.repeat(1048577) })).status, 413);
    res = await fetch(base + '/static/style.css'); const etag = res.headers.get('etag'); await res.text();
    assert.equal((await fetch(base + '/static/style.css', { headers: { 'If-None-Match': etag } })).status, 304);
    assert.equal((await fetch(base + '/static/%2e%2e%2f.env.example')).status, 403);
    assert.equal((await fetch(base + '/middleware-error')).status, 500);
  } finally { await Promise.all(servers.map(server => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }))); }
});
