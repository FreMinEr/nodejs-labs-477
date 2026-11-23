import express from 'express';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import multer from 'multer';
import swaggerUi from 'swagger-ui-express';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { appendFile } from 'node:fs/promises';
import { generateBooks, checked, bookSchema, selection, fail } from './data.js';

export function createApp(stage) {
  const app = express();
  let books = generateBooks(stage === 5 ? 100 : 8);
  if (stage < 4) books = books.map(({ id, title, author, year }) => ({ id, title, author, year }));
  let nextId = books.length + 1;
  const users = [];
  const cache = new Map();
  const secret = process.env.JWT_SECRET || randomBytes(32).toString('hex');
  let logQueue = Promise.resolve();
  function passwordHash(password, salt) { return scryptSync(password, salt, 64); }
  function addUser(email, password, name, role) {
    const salt = randomBytes(16).toString('hex');
    const user = { id: users.length + 1, email, name, role, salt, hash: passwordHash(password, salt) };
    users.push(user);
    return user;
  }
  if (stage === 5 && process.env.ADMIN_PASSWORD) addUser(process.env.ADMIN_EMAIL ?? 'admin@example.test', process.env.ADMIN_PASSWORD, 'Administrator', 'admin');
  app.use((req, res, next) => {
    const start = new Date();
    res.on('finish', () => {
      const line = `Nachalo: ${start.toISOString()} | Konec: ${new Date().toISOString()} | ${req.method} ${req.originalUrl} ${res.statusCode} | ${Date.now() - start.getTime()} ms`;
      if (stage >= 3) console.log(line);
      if (stage >= 4) logQueue = logQueue.then(() => appendFile('operations.log', `${line}\n`)).catch(() => console.error('Oshibka zapisi zhurnala'));
    });
    next();
  });
  if (stage >= 3) {
    app.use(compression({ threshold: 0 }));
    app.use(rateLimit({ windowMs: 60000, limit: 100, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Prevyshen limit zaprosov', status: 429 } }));
  }
  app.use(express.json({ limit: '1mb' }));
  const routes = [];
  function route(method, url, summary, ...handlers) {
    routes.push({ method, url, summary });
    app[method](url, ...handlers);
  }
  const page = body => `<!doctype html><html><meta charset="utf-8"><title>Lab 16</title><style>body{font:20px system-ui;max-width:850px;margin:50px auto;padding:30px;background:#eef3fa}a{color:#145aa0}</style>${body}</html>`;
  route('get', '/', 'Glavnaya stranica', (_req, res) => res.type('html').send(page(`<h1>Лабораторная работа №16</h1><p>Gruppa: 477</p><p>${new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Moscow' })}</p><p>Dobro pozhalovat!</p><nav><a href="/about">Ob avtore</a> | <a href="/contacts">Kontakty</a> | <a href="/api/books">Knigi</a> | <a href="/api-docs">API</a></nav>`)));
  route('get', '/about', 'Ob avtore', (_req, res) => res.type('html').send(page('<h1>Parfenok Ivan Nikolaevich</h1><p>Gruppa 477</p>')));
  route('get', '/contacts', 'Kontakty', (_req, res) => res.type('html').send(page('<h1>Kontakty</h1><p>GitHub: <a href="https://github.com/FreMinEr">FreMinEr</a></p>')));
  if (stage >= 3) {
    route('get', '/error', 'Sinhronnaya oshibka', () => fail(500, 'Testovaya oshibka'));
    route('get', '/async-error', 'Asinhronnaya oshibka', async () => { await Promise.resolve(); fail(500, 'Testovaya asinhronnaya oshibka'); });
  }
  function admin(req, _res, next) {
    if (stage === 5 && req.user?.role !== 'admin') fail(403, 'Trebuetsya rol administratora');
    next();
  }
  if (stage === 5) {
    const credentials = { email: Joi.string().email({ tlds: { allow: false } }).required(), password: Joi.string().min(8).max(128).required() };
    route('post', '/auth/register', 'Registraciya', (req, res) => {
      const data = checked(Joi.object({ ...credentials, name: Joi.string().trim().min(1).max(120).required() }).required(), req.body);
      const email = data.email.toLowerCase();
      if (users.some(user => user.email === email)) fail(409, 'Polzovatel uzhe sushchestvuet');
      const user = addUser(email, data.password, data.name, 'reader');
      res.status(201).json({ message: 'Registraciya uspeshna', id: user.id });
    });
    route('post', '/auth/login', 'Vhod i JWT', (req, res) => {
      const data = checked(Joi.object(credentials).required(), req.body);
      const user = users.find(user => user.email === data.email.toLowerCase());
      if (!user || !timingSafeEqual(user.hash, passwordHash(data.password, user.salt))) fail(401, 'Nevernyi email ili parol');
      res.json({ token: jwt.sign({ role: user.role }, secret, { algorithm: 'HS256', subject: String(user.id), expiresIn: '1h', issuer: 'lab16' }) });
    });
    app.use(['/api/books', '/api/admin'], (req, _res, next) => {
      const match = /^Bearer (.+)$/.exec(req.get('Authorization') ?? '');
      if (!match) fail(401, 'Trebuetsya Bearer token');
      try {
        const claims = jwt.verify(match[1], secret, { algorithms: ['HS256'], issuer: 'lab16' });
        req.user = users.find(user => String(user.id) === claims.sub);
      } catch { fail(401, 'Nevernyi ili prosrochennyi token'); }
      if (!req.user) fail(401, 'Polzovatel ne naiden');
      next();
    });
    route('get', '/api/admin', 'Panel administratora', admin, (_req, res) => res.json({ users: users.length, books: books.length }));
    app.use('/api/books', (req, res, next) => {
      const key = req.originalUrl;
      if (req.method !== 'GET') return next();
      const stored = cache.get(key);
      if (stored && stored.expires > Date.now()) return res.set('X-Cache', 'HIT').json(stored.body);
      res.set('X-Cache', 'MISS');
      const original = res.json.bind(res);
      res.json = body => {
        if (res.statusCode === 200) {
          if (cache.size >= 1000) cache.clear();
          cache.set(key, { body: structuredClone(body), expires: Date.now() + 300000 });
        }
        return original(body);
      };
      next();
    });
    route('get', '/api/books/export', 'Eksport JSON ili CSV', (req, res) => {
      if (!['json', 'csv'].includes(req.query.format ?? 'json')) fail(400, 'Format: json ili csv');
      if (req.query.format === 'csv') res.type('text/csv').attachment('books.csv').send(stringify(books, { header: true, columns: ['title', 'author', 'year', 'genre', 'isbn', 'available'] }));
      else res.attachment('books.json').json(books);
    });
    route('post', '/api/books/import', 'Import CSV', admin, multer({ limits: { fileSize: 1024 * 1024 }, storage: multer.memoryStorage() }).single('file'), (req, res) => {
      if (!req.file) fail(400, 'Trebuetsya CSV-fail v pole file');
      let rows;
      try { rows = parse(req.file.buffer, { columns: true, skip_empty_lines: true, bom: true }); }
      catch { fail(400, 'Nevernyi CSV'); }
      if (!rows.length || rows.length > 1000) fail(400, 'Trebuetsya ot 1 do 1000 strok');
      const batch = rows.map(row => checked(bookSchema(5), { ...row, year: Number(row.year), available: row.available === 'true' ? true : row.available === 'false' ? false : row.available }));
      const existing = [...books];
      for (const book of batch) { duplicate(book, existing); existing.push(book); }
      books.push(...batch.map(book => ({ id: nextId++, ...book, reviews: [] })));
      cache.clear();
      res.status(201).json({ imported: batch.length });
    });
    route('get', '/api/books/recommendations', 'Rekomendacii po zhanru', (req, res) => {
      if (!req.query.genre) fail(400, 'Ukazhite genre');
      res.json(books.filter(book => book.genre === req.query.genre).slice(0, 10));
    });
    route('get', '/api/books/available', 'Dostupnye knigi', (_req, res) => res.json(books.filter(book => book.available)));
  }
  function duplicate(book, list = books, except) {
    if (list.some(item => item.id !== except && ((item.title.toLowerCase() === book.title.toLowerCase() && item.author.toLowerCase() === book.author.toLowerCase()) || (book.isbn && item.isbn === book.isbn)))) fail(409, 'Kniga uzhe sushchestvuet');
  }
  if (stage >= 2) {
    route('get', '/api/books/search', 'Poisk po avtoru', (req, res) => res.json(books.filter(book => book.author.toLowerCase().includes(String(req.query.author ?? '').toLowerCase()))));
    if (stage >= 4) route('get', '/api/books/stats', 'Statistika biblioteki', (_req, res) => {
      const byAuthor = {}, byGenre = {};
      for (const book of books) { byAuthor[book.author] = (byAuthor[book.author] ?? 0) + 1; byGenre[book.genre] = (byGenre[book.genre] ?? 0) + 1; }
      res.json({ total: books.length, byAuthor, byGenre, oldest: books.length ? Math.min(...books.map(book => book.year)) : null, newest: books.length ? Math.max(...books.map(book => book.year)) : null });
    });
    route('get', '/api/books', 'Spisok knig', (req, res) => res.json(stage >= 4 ? selection(books, req.query) : books));
    function find(req, _res, next) {
      if (!/^[1-9]\d*$/.test(req.params.id)) fail(400, 'Nevernyi ID');
      req.book = books.find(book => book.id === Number(req.params.id));
      if (!req.book) fail(404, 'Kniga ne naidena');
      next();
    }
    route('get', '/api/books/:id', 'Kniga s otzyvami', find, (req, res) => res.json(req.book));
    route('post', '/api/books', 'Dobavlenie knigi', admin, (req, res) => {
      const data = checked(bookSchema(stage), req.body);
      if (stage >= 4) duplicate(data);
      const book = { id: nextId++, ...data, ...(stage === 5 ? { reviews: [] } : {}) };
      books.push(book); cache.clear();
      res.status(201).location(`/api/books/${book.id}`).json(book);
    });
    route('put', '/api/books/:id', 'Obnovlenie knigi', find, (req, res) => {
      const data = checked(bookSchema(stage, true), req.body);
      if (stage >= 4) duplicate({ ...req.book, ...data }, books, req.book.id);
      Object.assign(req.book, data); cache.clear(); res.json(req.book);
    });
    route('delete', '/api/books/:id', 'Udalenie knigi', admin, find, (req, res) => {
      books = books.filter(book => book.id !== req.book.id); cache.clear();
      res.json({ message: 'Kniga udalena', id: req.book.id });
    });
    if (stage === 5) route('post', '/api/books/:id/reviews', 'Dobavlenie otzyva', find, (req, res) => {
      const data = checked(Joi.object({ rating: Joi.number().integer().min(1).max(5).required(), text: Joi.string().trim().min(1).max(2000).required() }).required(), req.body);
      const review = { ...data, userId: req.user.id, date: new Date().toISOString() };
      req.book.reviews.push(review); cache.clear(); res.status(201).json(review);
    });
  }
  if (stage === 5) {
    const paths = {};
    for (const item of routes) {
      const url = item.url.replace(':id', '{id}');
      paths[url] ??= {};
      const operation = { summary: item.summary, responses: { 200: { description: 'Uspeshnyi otvet' }, 201: { description: 'Zapis sozdana' }, 400: { description: 'Oshibka validacii' }, 401: { description: 'Trebuetsya vhod' }, 403: { description: 'Net prav' }, 404: { description: 'Ne naideno' }, 409: { description: 'Dublikat' }, 429: { description: 'Limit' } }, parameters: [] };
      if (url.startsWith('/api/')) operation.security = [{ bearerAuth: [] }];
      if (url.includes('{id}')) operation.parameters.push({ in: 'path', name: 'id', required: true, schema: { type: 'integer', minimum: 1 } });
      if (item.method === 'get' && url.startsWith('/api/books')) for (const name of ['author', 'year', 'yearFrom', 'yearTo', 'limit', 'page', 'sort', 'search', 'genre', 'format']) operation.parameters.push({ in: 'query', name, schema: { type: 'string' } });
      if (['post', 'put'].includes(item.method)) {
        let properties = { title: { type: 'string' }, author: { type: 'string' }, year: { type: 'integer' }, genre: { type: 'string' }, isbn: { type: 'string' }, available: { type: 'boolean' } };
        if (url.startsWith('/auth/')) properties = { email: { type: 'string' }, password: { type: 'string', format: 'password' }, ...(url.endsWith('register') ? { name: { type: 'string' } } : {}) };
        if (url.endsWith('/reviews')) properties = { rating: { type: 'integer', minimum: 1, maximum: 5 }, text: { type: 'string' } };
        operation.requestBody = { required: true, content: url.endsWith('/import') ? { 'multipart/form-data': { schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } } } } : { 'application/json': { schema: { type: 'object', properties } } } };
      }
      paths[url][item.method] = operation;
    }
    const specification = { openapi: '3.0.3', info: { title: 'Biblioteka gruppy 477', version: '1.0.0' }, components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } }, paths };
    app.get('/openapi.json', (_req, res) => res.json(specification));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specification));
  }
  app.use((_req, _res, next) => next(Object.assign(new Error('Marshrut ne naiden'), { status: 404 })));
  app.use((error, _req, res, _next) => {
    const status = error instanceof multer.MulterError ? 400 : error.status ?? 500;
    res.status(status).json({ error: status >= 500 ? 'Vnutrennyaya oshibka servera' : error.type === 'entity.parse.failed' ? 'Nevernyi JSON' : error.message, status });
  });
  return app;
}
export function start(stage) {
  const server = createApp(stage).listen(Number(process.env.PORT ?? 3000), process.env.HOST ?? '127.0.0.1', () => console.log(`Server zapushchen: http://127.0.0.1:${server.address().port} | Zadanie ${stage}`));
  server.on('error', error => { console.error(`Oshibka zapuska: ${error.code}`); process.exitCode = 1; });
  process.once('SIGINT', () => server.close());
  process.once('SIGTERM', () => server.close());
}

