import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { pool } from './config/db.js';
import { migrate } from './migrate.js';
import { errors, database, cache } from './middleware/common.js';
import { router } from './routes/api.js';
const db = pool();
try {
  await migrate(db); const app = new Koa(); app.use(errors()).use(bodyParser({ jsonLimit: '1mb' })).use(database(db)).use(async (ctx, next) => { await next(); console.log(`[HTTP] [477] ${ctx.method} ${ctx.url} ${ctx.status}`); }).use(cache()).use(router.routes()).use(router.allowedMethods());
  const server = app.listen(Number(process.env.PORT ?? 3000), '127.0.0.1', () => console.log(`Koa server: ${server.address().port}`));
  server.on('error', async error => { console.error(`Oshibka servera: ${error.code}`); await db.end(); process.exitCode = 1; });
  const stop = () => server.close(async () => { await db.end(); console.log('Server i pul zakryty'); }); process.once('SIGINT', stop); process.once('SIGTERM', stop);
} catch (error) { console.error(`Oshibka zapuska: ${error.code ?? error.message}`); await db.end(); process.exitCode = 1; }
