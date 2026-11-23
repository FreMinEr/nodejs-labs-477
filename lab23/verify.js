import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import WebSocket from 'ws';
import { connect } from './config/db.js';
const child = spawn(process.execPath, ['--env-file-if-exists=.env', 'task5.js'], { env: { ...process.env, PORT: '0', WS_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
let log = ''; child.stdout.on('data', data => { log += data; }); child.stderr.on('data', data => { log += data; });
const deadline = Date.now() + 10000;
while (!/Koa server: \d+/.test(log) || !/WebSocket server: \d+/.test(log)) { assert.ok(Date.now() < deadline, log); await new Promise(resolve => setTimeout(resolve, 50)); }
console.log('START\n' + log);
const base = 'http://127.0.0.1:' + log.match(/Koa server: (\d+)/)[1];
const socket = new WebSocket('ws://127.0.0.1:' + log.match(/WebSocket server: (\d+)/)[1]); const events = [];
socket.on('message', message => events.push(JSON.parse(message))); await once(socket, 'open');
const request = async (method, url, body, status = 200) => { const response = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }); const data = await response.json(); assert.equal(response.status, status, JSON.stringify(data)); console.log(`HTTP ${method} ${url} status=${response.status} X-Cache=${response.headers.get('x-cache')}\n${JSON.stringify(data)}`); return { data, response }; };
try {
  const batch = await request('POST', '/api/students/batch', [{ name: 'Иван API', group_name: '477', course: 2, grade: 4.5 }, { name: 'Мария API', group_name: '477', course: 2, grade: 4 }], 201);
  const id = batch.data.data[0]._id;
  await request('GET', '/api/students?limit=3'); const cached = await request('GET', '/api/students?limit=3'); assert.equal(cached.response.headers.get('x-cache'), 'HIT');
  await request('GET', '/api/students/stats'); await request('GET', '/api/students/search?q=' + encodeURIComponent('Иван'));
  await request('PUT', `/api/students/${id}`, { grade: 5 }); assert.equal((await request('GET', `/api/students/${id}`)).data.grade, 5);
  const before = (await request('GET', '/api/students/stats')).data.total;
  await request('POST', '/api/students/batch', [{ name: 'Rollback', group_name: '477', course: 2 }, { name: 'X', group_name: '477', course: 2 }], 400);
  assert.equal((await request('GET', '/api/students/stats')).data.total, before);
  await request('DELETE', `/api/students/${id}`); await request('GET', `/api/students/${id}`, undefined, 404);
  await request('GET', '/api/students/bad-id', undefined, 400); await request('GET', '/api/students?limit=-1', undefined, 400);
  const { client, db } = await connect(); try { await assert.rejects(db.collection('students').insertOne({ name: 'X', course: 0 }), error => error.code === 121); console.log('DB SCHEMA: invalid record rejected code=121'); } finally { await client.close(); }
  await new Promise(resolve => setTimeout(resolve, 300)); assert.ok(events.some(e => e.type === 'insert')); assert.ok(events.some(e => e.type === 'update')); assert.ok(events.some(e => e.type === 'delete'));
  console.log('WEBSOCKET\n' + events.map(e => JSON.stringify(e)).join('\n'));
  await request('GET', '/api/metrics'); console.log('SERVER LOG\n' + log); console.log('PASS API, transaction rollback, cache, WS, schema');
} finally { socket.terminate(); child.kill(); await once(child, 'exit'); }
