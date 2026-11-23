import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

for (let stage = 1; stage <= 5; stage++) {
  test(`Zadanie ${stage}: HTTP i validaciya`, async () => {
    const child = spawn(process.execPath, [`task${stage}.js`], { env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let serverLog = '';
    child.stdout.on('data', chunk => { serverLog += chunk; });
    child.stderr.on('data', chunk => { serverLog += chunk; });
    try {
      const url = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Server ne zapustilsya')), 10000);
        child.stdout.on('data', () => {
          const match = serverLog.match(/http:\/\/127\.0\.0\.1:\d+/);
          if (match) { clearTimeout(timeout); resolve(match[0]); }
        });
        child.once('error', reject);
      });
      async function request(path, status = 200, options = {}) {
        const response = await fetch(url + path, options);
        const text = await response.text();
        console.log(`${options.method ?? 'GET'} ${path}\nHTTP ${response.status}\nContent-Type: ${response.headers.get('content-type')}\n${text}\n`);
        assert.equal(response.status, status);
        return response.headers.get('content-type')?.includes('json') ? JSON.parse(text) : text;
      }
      const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      assert.match(await request('/'), /Лабораторная работа №15/);
      await request('/missing', 404);
      if (stage >= 2) {
        assert.equal((await request('/api/users')).length, 1);
        const user = await request('/api/users', 201, json('POST', { name: 'Ivan Petrov', group: '477' }));
        await request(`/api/users/${user.id}`);
        assert.equal((await request(`/api/users/${user.id}`, 200, json('PUT', { name: 'Pavel Petrov' }))).name, 'Pavel Petrov');
        await request(`/api/users/${user.id}`, 200, { method: 'DELETE' });
        await request(`/api/users/${user.id}`, 404);
        await request('/api/users/999', 404, json('PUT', { name: 'Ivan' }));
        await request('/api/users/999', 404, { method: 'DELETE' });
        await request('/api/users', 400, json('POST', { name: '' }));
        await request('/api/users', 400, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
      }
      if (stage >= 3) {
        await request('/protected', 401);
        await request('/protected', 200, { headers: { Authorization: 'Bearer uchebnyi-primer' } });
        await request('/error', 500);
      }
      if (stage >= 4) {
        const listing = await request('/students');
        if (stage === 5) { assert.equal(listing.total, 50); assert.equal(listing.students.length, 10); }
        const filtered = await request('/students?group=477');
        assert.ok((stage === 5 ? filtered.students : filtered).every(item => item.group === '477'));
        const empty = await request('/students?group=unknown');
        assert.equal(stage === 5 ? empty.total : empty.length, 0);
        const student = await request('/students', 201, json('POST', { name: 'Anna Petrova', group: '477', course: 2 }));
        await request(`/students/${student.id}`);
        assert.equal((await request(`/students/${student.id}`, 200, json('PUT', { course: 4 }))).course, 4);
        await request('/students', 400, json('POST', { name: 'Anna', group: '477', course: 8 }));
        await request(`/students/${student.id}`, 200, { method: 'DELETE' });
        await request(`/students/${student.id}`, 404);
      }
      if (stage === 5) {
        const page = await request('/students?limit=5&offset=10&sort=name');
        assert.equal(page.students.length, 5);
        const full = await request('/students?limit=100&sort=name');
        assert.deepEqual(page.students, full.students.slice(10, 15));
        const search = await request('/students?search=AN&sort=-name&limit=100');
        assert.ok(search.students.length > 0 && search.students.every(item => item.name.toLowerCase().includes('an')));
        const courses = (await request('/students?sort=course&limit=100')).students.map(item => item.course);
        assert.deepEqual(courses, [...courses].sort((a, b) => a - b));
        await request('/students?limit=-1', 400);
        await request('/students?offset=oops', 400);
        await request('/students?sort=unknown', 400);
      }
    } finally {
      child.kill();
      await once(child, 'exit');
      console.log(`SERVER ZADANIE ${stage}\n${serverLog}`);
    }
  });
}
