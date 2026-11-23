import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { isbnFor, validISBN } from './data.js';

for (let stage = 1; stage <= 5; stage++) test(`Zadanie ${stage}`, async () => {
  const password = randomBytes(20).toString('hex');
  const child = spawn(process.execPath, [`task${stage}.js`], { env: { ...process.env, PORT: '0', ADMIN_PASSWORD: password }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  child.stdout.on('data', chunk => { log += chunk; });
  child.stderr.on('data', chunk => { log += chunk; });
  try {
    const url = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Server ne zapustilsya')), 10000);
      child.stdout.on('data', () => { const match = log.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timer); resolve(match[0]); } });
      child.once('error', reject);
    });
    let token = '';
    async function request(path, status = 200, options = {}, silent = false) {
      const response = await fetch(url + path, { ...options, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
      const text = await response.text();
      if (!silent) console.log(`Zadanie ${stage} | ${options.method ?? 'GET'} ${path}\nHTTP ${response.status}\nContent-Type: ${response.headers.get('content-type')}\nContent-Encoding: ${response.headers.get('content-encoding')}\nX-Cache: ${response.headers.get('x-cache')}\nRateLimit: ${response.headers.get('ratelimit')}\n${path === '/auth/login' && response.status === 200 ? 'JWT poluchen; znachenie tokena skryto' : text}\n`);
      assert.equal(response.status, status, text);
      return { body: response.headers.get('content-type')?.includes('json') ? JSON.parse(text) : text, headers: response.headers };
    }
    const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    await request('/'); await request('/about'); await request('/contacts');
    await request('/missing', 404);
    if (stage >= 3) {
      await request('/error', 500); await request('/async-error', 500);
      const gzip = await request('/', 200, { headers: { 'Accept-Encoding': 'gzip' } });
      assert.equal(gzip.headers.get('content-encoding'), 'gzip');
      const deflate = await request('/', 200, { headers: { 'Accept-Encoding': 'deflate' } });
      assert.equal(deflate.headers.get('content-encoding'), 'deflate');
    }
    let readerToken;
    if (stage === 5) {
      await request('/api/books', 401);
      await request('/auth/register', 201, json('POST', { name: 'Ivan', email: 'ivan@example.test', password }));
      await request('/auth/register', 409, json('POST', { name: 'Ivan', email: 'ivan@example.test', password }));
      readerToken = (await request('/auth/login', 200, json('POST', { email: 'ivan@example.test', password }))).body.token;
      token = readerToken;
      await request('/api/admin', 403);
      await request('/api/books', 403, json('POST', {}));
      await request('/api/books/1', 403, { method: 'DELETE' });
      const adminToken = (await request('/auth/login', 200, json('POST', { email: 'admin@example.test', password }))).body.token;
      token = adminToken;
      await request('/api/admin');
      const all = (await request('/api/books?limit=100', 200, {}, true)).body;
      assert.equal(all.total, 100);
      assert.equal(new Set(all.books.map(book => book.isbn)).size, 100);
      assert.ok(all.books.every(book => validISBN(book.isbn)));
      console.log('Zadanie 5 | Provereno 100 knig: ISBN unikalny i korrektny');
      await request('/api/books?limit=2');
      assert.equal((await request('/api/books?limit=2')).headers.get('x-cache'), 'HIT');
      await request('/api/books/1/reviews', 201, json('POST', { rating: 5, text: 'Interesnaya kniga' }));
      assert.equal((await request('/api/books/1')).body.reviews.length, 1);
      assert.ok((await request('/api/books/available', 200, {}, true)).body.every(book => book.available));
      assert.ok((await request('/api/books/recommendations?genre=roman', 200, {}, true)).body.every(book => book.genre === 'roman'));
      const csv = await request('/api/books/export?format=csv', 200, {}, true);
      assert.match(csv.body, /title,author,year,genre,isbn,available/);
      assert.equal((await request('/api/books/export', 200, {}, true)).body.length, 100);
      console.log(`Zadanie 5 | CSV eksport: ${csv.body.split('\n').slice(0, 3).join('\n')}`);
      const form = new FormData();
      form.set('file', new Blob([`title,author,year,genre,isbn,available\nImport kniga,Ivan,2020,roman,${isbnFor(7777)},true\n`], { type: 'text/csv' }), 'books.csv');
      await request('/api/books/import', 201, { method: 'POST', body: form });
      assert.equal((await request('/api/books?limit=2')).headers.get('x-cache'), 'MISS');
      const spec = (await request('/openapi.json', 200, {}, true)).body;
      assert.ok(spec.paths['/api/books/import'].post.requestBody.content['multipart/form-data']);
      assert.ok((await request('/api-docs/', 200, {}, true)).body.includes('swagger-ui'));
      console.log(`Zadanie 5 | Swagger: ${Object.keys(spec.paths).length} marshrutov, stranica /api-docs/ HTTP 200`);
    }
    if (stage >= 2) {
      const data = { title: 'Testovaya kniga', author: 'Ivan', year: 2020, ...(stage >= 4 ? { genre: 'roman' } : {}), ...(stage === 5 ? { isbn: isbnFor(8888), available: true } : {}) };
      const book = (await request('/api/books', 201, json('POST', data))).body;
      await request(`/api/books/${book.id}`);
      await request(`/api/books/${book.id}`, 200, json('PUT', { year: 2021 }));
      await request('/api/books/search?author=Ivan');
      if (stage >= 4) {
        await request('/api/books', 409, json('POST', data));
        await request('/api/books?author=Ivan&yearFrom=2020&yearTo=2025&sort=-year&limit=2&page=1');
        await request('/api/books?search=testovaya&sort=title&limit=2');
        await request('/api/books/stats');
        await request('/api/books?yearFrom=2024&yearTo=1800', 400);
      }
      await request(`/api/books/${book.id}`, 200, { method: 'DELETE' });
      await request(`/api/books/${book.id}`, 404);
      await request('/api/books', 400, json('POST', { title: '', author: 'Ivan', year: -1 }));
      await request('/api/books', 400, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    }
    if (stage === 3) {
      let response;
      for (let n = 0; n < 101; n++) { response = await fetch(url + '/'); await response.arrayBuffer(); if (response.status === 429) break; }
      assert.equal(response.status, 429);
      console.log(`Zadanie 3 | Limit proveren: HTTP 429 | Retry-After: ${response.headers.get('retry-after')} | RateLimit: ${response.headers.get('ratelimit')}`);
    }
  } finally { child.kill(); await once(child, 'exit'); console.log(`SERVER ZADANIE ${stage}\n${log}`); }
});

