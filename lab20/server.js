import http from 'node:http';
import https from 'node:https';
import { createReadStream, readFileSync, appendFileSync } from 'node:fs';
import { stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const escape = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', chunk => { size += chunk.length; if (size > 1048576) { chunks.length = 0; reject(Object.assign(new Error('Telo bolshe 1 MiB'), { status: 413 })); } else chunks.push(chunk); });
    req.on('end', () => { console.log(`Razmer tela: ${size} bait`); resolve(Buffer.concat(chunks)); });
    req.on('error', reject);
    req.on('aborted', () => reject(Object.assign(new Error('Zapros prervan'), { status: 400 })));
  });
}
export function start(stage) {
  let students = [{ id: 1, name: 'Иван', group: '477' }, { id: 2, name: 'Мария', group: '478' }];
  let nextId = 3;
  const cache = new Map();
  const metrics = { group: '477', total: 0, byMethod: {}, byStatus: {} };
  const send = (res, status, data, type = 'application/json; charset=utf-8') => { res.statusCode = status; res.setHeader('Content-Type', type); res.end(type.startsWith('application/json') ? JSON.stringify(data, null, 2) : data); };
  const jsonBody = async req => { try { return JSON.parse((await readBody(req)).toString()); } catch (error) { if (error.status) throw error; throw Object.assign(new Error('Nevernyi JSON'), { status: 400 }); } };
  const routes = [];
  const route = (method, pattern, handler) => routes.push({ method, pattern, handler });
  route('GET', /^\/$/, (req, res) => send(res, 200, `<h1>Laboratornaya rabota 20</h1><p>Gruppa: 477</p><p>Metod: ${req.method}, URL: /, ${req.socket.encrypted ? 'HTTPS' : 'HTTP'}</p>`, 'text/html; charset=utf-8'));
  route('GET', /^\/about$/, (req, res) => send(res, 200, '<h1>O studente</h1><p>Парфёнок Иван Николаевич, группа 477</p>', 'text/html; charset=utf-8'));
  if (stage >= 2) {
    route('GET', /^\/headers$/, (req, res) => send(res, 200, { headers: req.headers, method: req.method, url: req.url, httpVersion: req.httpVersion }));
    route('GET', /^\/headers\/set$/, (req, res) => { res.setHeader('X-Custom', '477'); res.setHeader('X-Temporary', 'remove'); res.removeHeader('X-Temporary'); send(res, 200, '<h1>Zagolovki ustanovleny</h1>', 'text/html; charset=utf-8'); });
    route('GET', /^\/headers\/check$/, (req, res) => { res.setHeader('Content-Type', 'application/json'); send(res, 200, { hasContentType: res.hasHeader('Content-Type'), hasXGroup: res.hasHeader('X-Group'), hasUnknown: res.hasHeader('X-Unknown'), group: res.getHeader('X-Group') }); });
  }
  if (stage >= 3) {
    route('POST', /^\/echo$/, async (req, res) => {
      const body = await readBody(req); const type = (req.headers['content-type'] ?? 'application/octet-stream').split(';')[0];
      if (type === 'application/json') { let value; try { value = JSON.parse(body.toString()); } catch { throw Object.assign(new Error('Nevernyi JSON'), { status: 400 }); } send(res, 200, value && typeof value === 'object' && !Array.isArray(value) ? { ...value, group: '477' } : { data: value, group: '477' }); }
      else if (type === 'application/x-www-form-urlencoded') send(res, 200, Object.fromEntries(new URLSearchParams(body.toString())));
      else send(res, 200, body, type);
    });
    route('POST', /^\/form$/, async (req, res) => send(res, 200, Object.fromEntries(new URLSearchParams((await readBody(req)).toString()))));
  }
  if (stage >= 4) {
    route('GET', /^\/users\/([^/]+)\/posts\/([^/]+)$/, (req, res, match) => send(res, 200, { userId: decodeURIComponent(match[1]), postId: decodeURIComponent(match[2]) }));
    route('GET', /^\/users\/([^/]+)$/, (req, res, match) => send(res, 200, { id: decodeURIComponent(match[1]) }));
    route('GET', /^\/search$/, (req, res) => send(res, 200, { q: req.parsed.searchParams.get('q') ?? '', limit: req.parsed.searchParams.get('limit') ?? '10' }));
    route('GET', /^\/api\/students$/, (req, res) => send(res, 200, students.filter(s => !req.parsed.searchParams.has('group') || s.group === req.parsed.searchParams.get('group'))));
    route('POST', /^\/api\/students$/, async (req, res) => { const value = await jsonBody(req); if (!value || typeof value.name !== 'string' || !value.name.trim() || typeof value.group !== 'string' || !value.group.trim()) return send(res, 400, { error: 'Nuzhny name i group' }); const student = { id: nextId++, name: value.name.trim(), group: value.group.trim() }; students.push(student); cache.clear(); send(res, 201, student); });
    for (const method of ['GET', 'PUT', 'DELETE']) route(method, /^\/api\/students\/(\d+)$/, async (req, res, match) => {
      const student = students.find(s => s.id === Number(match[1])); if (!student) return send(res, 404, { error: 'Student ne naiden' });
      if (method === 'GET') return send(res, 200, student);
      if (method === 'DELETE') { students = students.filter(s => s !== student); cache.clear(); return send(res, 200, { deleted: true, id: student.id }); }
      const value = await jsonBody(req); if (!value || typeof value !== 'object' || Array.isArray(value) || !Object.keys(value).length || Object.keys(value).some(k => !['name', 'group'].includes(k) || typeof value[k] !== 'string' || !value[k].trim())) return send(res, 400, { error: 'Nevernye polya' });
      Object.assign(student, value); cache.clear(); send(res, 200, student);
    });
  }
  async function file(req, res, filename, streaming = false) {
    const base = await realpath(path.join(root, 'public'));
    let actual;
    try { actual = await realpath(filename); } catch { return send(res, 404, { error: 'Fail ne naiden' }); }
    if (!actual.startsWith(base + path.sep)) return send(res, 403, { error: 'Dostup zapreshchen' });
    const info = await stat(actual); if (!info.isFile()) return send(res, 404, { error: 'Fail ne naiden' });
    const etag = `"${info.size}-${info.mtimeMs}"`;
    res.setHeader('ETag', etag); res.setHeader('Last-Modified', info.mtime.toUTCString()); res.setHeader('Cache-Control', 'max-age=60');
    if (req.headers['if-none-match'] === etag || (!req.headers['if-none-match'] && Date.parse(req.headers['if-modified-since']) >= Math.floor(info.mtimeMs / 1000) * 1000)) { res.statusCode = 304; return res.end(); }
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' })[path.extname(actual)] ?? 'application/octet-stream');
    res.setHeader('Content-Length', info.size);
    if (req.method === 'HEAD') return res.end();
    const stream = createReadStream(actual); let bytes = 0; let last = 0;
    if (streaming) stream.on('data', chunk => { bytes += chunk.length; const percent = Math.floor(bytes / info.size * 100); if (percent >= last + 25 || percent === 100) { last = percent; console.log(`Streaming: ${percent}%, ${bytes} bait`); } });
    stream.on('error', error => res.destroy(error)); res.on('close', () => stream.destroy()); stream.pipe(res);
  }
  if (stage === 5) {
    route('GET', /^\/static\/(.+)$/, (req, res, match) => file(req, res, path.join(root, 'public', decodeURIComponent(match[1]))));
    route('GET', /^\/stream$/, (req, res) => file(req, res, path.join(root, 'public', 'big.bin'), true));
    route('GET', /^\/metrics$/, (req, res) => send(res, 200, { ...metrics, uptime: process.uptime() }));
    route('GET', /^\/middleware-error$/, () => { throw new Error('Testovaya oshibka middleware'); });
  }
  const middleware = [
    (req, res, next) => {
      res.setHeader('X-Group', '477'); res.setHeader('X-Powered-By', 'Node.js'); res.setHeader('Cache-Control', 'no-cache');
      metrics.total++; metrics.byMethod[req.method] = (metrics.byMethod[req.method] ?? 0) + 1;
      res.on('finish', () => { metrics.byStatus[res.statusCode] = (metrics.byStatus[res.statusCode] ?? 0) + 1; const line = `[${new Date().toISOString()}] [477] ${req.method} ${req.url} ${res.statusCode}`; console.log(line); if (stage === 5) appendFileSync(path.join(root, 'access.log'), line + '\n'); });
      return next();
    },
    (req, res, next) => {
      const raw = decodeURIComponent(req.url.split('?')[0]);
      if (raw.split(/[\\/]/).includes('..') || raw.includes('\0')) return send(res, 403, { error: 'Dostup zapreshchen' });
      req.parsed = new URL(req.url, 'http://localhost'); if (stage === 5) { res.setHeader('X-Middleware', 'headers,routing,cache'); console.log('Middleware: headers -> routing -> cache'); } return next();
    },
    async (req, res) => {
      const matches = routes.map(route => ({ ...route, match: req.parsed.pathname.match(route.pattern) })).filter(route => route.match);
      const selected = matches.find(route => route.method === req.method || (req.method === 'HEAD' && route.method === 'GET'));
      if (!selected) { if (matches.length) { res.setHeader('Allow', [...new Set(matches.map(r => r.method).concat(matches.some(r => r.method === 'GET') ? ['HEAD'] : []))].join(', ')); return send(res, 405, { error: 'Metod ne podderzhivaetsya' }); } return send(res, 404, `<h1>404 Not Found</h1><p>Put ${escape(req.parsed.pathname)} ne naiden</p>`, 'text/html; charset=utf-8'); }
      const cacheable = stage === 5 && req.method === 'GET' && req.parsed.pathname.startsWith('/api/students');
      if (cacheable) {
        const hit = cache.get(req.url); res.setHeader('Cache-Control', 'max-age=60');
        if (hit && hit.expires > Date.now()) { res.setHeader('X-Cache', 'HIT'); res.setHeader('Content-Type', hit.type); return res.end(hit.body); }
        res.setHeader('X-Cache', 'MISS'); const end = res.end.bind(res);
        res.end = (body, ...args) => { if (res.statusCode === 200) cache.set(req.url, { expires: Date.now() + 60000, body, type: res.getHeader('Content-Type') }); return end(body, ...args); };
      }
      await selected.handler(req, res, selected.match);
    }
  ];
  const handler = async (req, res) => { let index = 0; const next = () => middleware[index++]?.(req, res, next); try { await next(); } catch (error) { console.error(`Oshibka: ${error.message}`); if (!res.headersSent && !res.destroyed) send(res, error.status ?? (error instanceof URIError ? 400 : 500), { error: error.status ? error.message : 'Oshibka obrabotki' }); else res.destroy(); } };
  const servers = [http.createServer(handler)];
  if (stage === 5) servers.push(https.createServer({ key: readFileSync(path.join(root, 'certs/key.pem')), cert: readFileSync(path.join(root, 'certs/cert.pem')) }, handler));
  servers.forEach((server, i) => {
    server.on('error', error => { console.error(`Oshibka servera: ${error.code}`); process.exitCode = 1; servers.forEach(s => s.close()); });
    server.on('clientError', (error, socket) => { console.log(`Nevernyi zapros: ${error.code}`); socket.end('HTTP/1.1 400 Bad Request\r\nX-Group: 477\r\nConnection: close\r\nContent-Length: 0\r\n\r\n'); });
    server.listen(Number(i ? process.env.HTTPS_PORT ?? 3443 : process.env.PORT ?? 3000), '127.0.0.1', () => console.log(`${i ? 'HTTPS' : 'HTTP'} server: ${server.address().port}`));
  });
  function stop() { for (const server of servers) server.close(() => console.log('Server ostanovlen')); }
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
  return servers;
}

