import Koa from 'koa';
import Router from '@koa/router';
import { bodyParser } from '@koa/bodyparser';

const group = process.env.STUDENT_GROUP ?? '477';
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function generateStudents() {
  const names = ['Ivan', 'Anna', 'Aleksei', 'Maria', 'Pavel', 'Elena', 'Nikita', 'Olga', 'Denis', 'Irina'];
  const surnames = ['Parfenok', 'Ivanov', 'Petrov', 'Sidorov', 'Smirnov'];
  const seed = [...group].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `${names[(i + seed) % 10]} ${surnames[Math.floor(i / 10)]}`, group: String(Number(group) + i % 3), course: (i + seed) % 4 + 1 }));
}

function validate(ctx, body, student, partial = false) {
  ctx.assert(body && typeof body === 'object' && !Array.isArray(body), 400, 'Trebuetsya JSON-obekt');
  const fields = student ? ['name', 'group', 'course'] : ['name', 'group'];
  ctx.assert(Object.keys(body).length > 0 && Object.keys(body).every(key => fields.includes(key)), 400, 'Nedopustimye polya');
  const result = {};
  for (const key of fields) {
    if (partial && !Object.hasOwn(body, key)) continue;
    if (key === 'course') ctx.assert(Number.isInteger(body[key]) && body[key] >= 1 && body[key] <= 4, 400, 'Kurs dolzhen byt ot 1 do 4');
    else ctx.assert(typeof body[key] === 'string' && body[key].trim().length > 0 && body[key].length <= 120, 400, `Nevernoe pole: ${key}`);
    result[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
  }
  return result;
}

export function createApp(stage) {
  const app = new Koa();
  const router = new Router();
  app.use(async (ctx, next) => {
    const started = new Date();
    const time = performance.now();
    try { await next(); }
    finally {
      if (stage >= 3) console.log(`Nachalo: ${started.toISOString()} | Konec: ${new Date().toISOString()} | ${ctx.method} ${ctx.url} | ${ctx.status} | ${(performance.now() - time).toFixed(2)} ms`);
    }
  });
  app.use(async (ctx, next) => {
    try {
      await next();
      if (ctx.status === 404 && !ctx.body) ctx.throw(404, 'Marshrut ne naiden');
    } catch (error) {
      ctx.status = error.status ?? 500;
      const message = ctx.status >= 500 ? 'Vnutrennyaya oshibka servera' : error.type === 'entity.parse.failed' || error instanceof SyntaxError ? 'Nevernyi JSON' : error.message;
      ctx.body = { error: message, status: ctx.status };
    }
  });
  app.use(bodyParser({ enableTypes: ['json'], jsonLimit: '64kb', onError: (_error, ctx) => ctx.throw(400, 'Nevernyi JSON') }));
  router.get('/', ctx => {
    ctx.type = 'html';
    ctx.body = `<!doctype html><html lang="ru"><meta charset="utf-8"><title>Laboratornaya rabota 15</title><style>body{font:20px system-ui;max-width:800px;margin:70px auto;background:#f2f5fa;color:#17283b}main{background:white;padding:40px;border-radius:18px}h1{color:#155ba3}</style><main><h1>Лабораторная работа №15</h1><p>Gruppa: ${escape(group)}</p><p>Student: Parfenok Ivan Nikolaevich</p><p>Data: ${new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Moscow' })}</p><p>Dobro pozhalovat na server Koa.js!</p><p>Zadanie ${stage}</p></main></html>`;
  });
  if (stage >= 3) {
    router.get('/protected', async (ctx, next) => {
      ctx.assert(ctx.get('Authorization').trim(), 401, 'Trebuetsya zagolovok Authorization');
      await next();
    }, ctx => { ctx.body = { message: 'Dostup razreshen' }; });
    router.get('/error', () => { throw new Error('Testovaya oshibka'); });
  }
  function resource(prefix, student, initial, advanced = false) {
    let records = initial;
    let nextId = Math.max(0, ...records.map(item => item.id)) + 1;
    router.get(prefix, ctx => {
      let result = [...records];
      if (student && ctx.query.group !== undefined) result = result.filter(item => item.group === ctx.query.group);
      if (advanced) {
        if (ctx.query.search !== undefined) result = result.filter(item => item.name.toLowerCase().includes(String(ctx.query.search).toLowerCase()));
        const sort = ctx.query.sort ?? 'id';
        ctx.assert(['id', 'name', '-name', 'course', '-course'].includes(sort), 400, 'Nevernoe pole sortirovki');
        const field = sort.replace(/^-/, '');
        result.sort((a, b) => (typeof a[field] === 'string' ? a[field].localeCompare(b[field], 'en') : a[field] - b[field]) * (sort.startsWith('-') ? -1 : 1));
        const limit = Number(ctx.query.limit ?? 10);
        const offset = Number(ctx.query.offset ?? 0);
        ctx.assert(Number.isInteger(limit) && limit >= 1 && limit <= 100 && Number.isInteger(offset) && offset >= 0, 400, 'Nevernye parametry paginacii');
        ctx.body = { total: result.length, limit, offset, students: result.slice(offset, offset + limit) };
      } else ctx.body = result;
    });
    async function find(ctx, next) {
      const id = Number(ctx.params.id);
      ctx.assert(Number.isSafeInteger(id) && id > 0, 400, 'Nevernyi ID');
      ctx.state.record = records.find(item => item.id === id);
      ctx.assert(ctx.state.record, 404, 'Zapis ne naidena');
      await next();
    }
    router.get(`${prefix}/:id`, find, ctx => { ctx.body = ctx.state.record; });
    router.post(prefix, ctx => {
      const data = validate(ctx, ctx.request.body, student);
      const record = { id: nextId++, ...data };
      records.push(record);
      ctx.status = 201;
      ctx.set('Location', `${prefix}/${record.id}`);
      ctx.body = record;
    });
    router.put(`${prefix}/:id`, find, ctx => {
      const data = validate(ctx, ctx.request.body, student, true);
      Object.assign(ctx.state.record, data);
      ctx.body = ctx.state.record;
    });
    router.delete(`${prefix}/:id`, find, ctx => {
      records = records.filter(item => item.id !== ctx.state.record.id);
      ctx.body = { message: 'Zapis udalena', id: ctx.state.record.id };
    });
  }
  if (stage >= 2) resource('/api/users', false, [{ id: 1, name: 'Parfenok Ivan Nikolaevich', group }]);
  if (stage >= 4) resource('/students', true, stage === 5 ? generateStudents() : [{ id: 1, name: 'Parfenok Ivan Nikolaevich', group, course: 2 }, { id: 2, name: 'Anna Petrova', group: '478', course: 1 }], stage === 5);
  app.use(router.routes());
  app.use(router.allowedMethods());
  return app;
}

export function start(stage) {
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '127.0.0.1';
  const server = createApp(stage).listen(port, host, () => console.log(`Server zapushchen: http://${host}:${server.address().port} | Zadanie ${stage}`));
  server.on('error', error => { console.error(`Oshibka zapuska: ${error.code}`); process.exitCode = 1; });
  process.once('SIGINT', () => server.close());
  process.once('SIGTERM', () => server.close());
}
