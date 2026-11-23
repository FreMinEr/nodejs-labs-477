const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const helmet = require('koa-helmet');
const cors = require('@koa/cors');
const ratelimit = require('koa-ratelimit');
const pino = require('pino');
const { Registry, Counter } = require('prom-client');
const { createReadStream } = require('node:fs');
const { stat } = require('node:fs/promises');
const path = require('node:path');
const swagger = require('swagger-ui-express');
const swaggerDist = require('swagger-ui-dist');
const User = require('./models/user');
const { makeService } = require('./services/userService');
const { notifications } = require('./notifications');
const { auth } = require('./auth');
const middleware = require('./middleware');
const { routes } = require('./routes/users');
const { documentation } = require('./docs');
function createApp({ db, stage = 5, config = {}, publish = () => {}, log = pino({ level: process.env.LOG_LEVEL || 'info' }) }) {
  const accessSecret = config.accessSecret || process.env.JWT_SECRET, refreshSecret = config.refreshSecret || process.env.JWT_REFRESH_SECRET;
  if (stage >= 4 && (!accessSecret || accessSecret.length < 32 || !refreshSecret || refreshSecret.length < 32)) throw new Error('JWT secrety dolzhny byt ne koroche 32 simvolov');
  const app = new Koa(), registry = new Registry(), counter = new Counter({ name: 'http_requests_total', help: 'Kolichestvo HTTP zaprosov', labelNames: ['method', 'path', 'status'], registers: [registry] });
  const uploads = config.uploads || path.resolve('uploads'), outbox = config.outbox || path.resolve('outbox');
  const info = (...args) => log.info(...args);
  User.bind(db); const authentication = auth(db, { accessSecret, refreshSecret }, info);
  const service = makeService({ notify: notifications(outbox, info), log: info });
  app.use(middleware.logger(info, counter)).use(middleware.errors);
  if (stage >= 4) {
    app.use(helmet({ contentSecurityPolicy: false }));
    const allowed = (config.origins || process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
    app.use(async (ctx, next) => { if (ctx.get('Origin') && !allowed.includes(ctx.get('Origin'))) ctx.throw(403, 'Origin ne razreshen'); await next(); });
    app.use(cors({ origin: ctx => ctx.get('Origin') || allowed[0] }));
    app.use(ratelimit({ driver: 'memory', db: new Map(), duration: 60000, max: config.rateLimit || 100, id: ctx => ctx.ip, errorMessage: { data: null, error: 'Slishkom mnogo zaprosov', status: 429 }, disableHeader: false }));
  }
  app.use(bodyParser({ jsonLimit: '1mb', onerror: (_error, ctx) => ctx.throw(400, 'Nevernoe telo zaprosa') })).use(middleware.database(db));
  const { router, descriptions } = routes({ service, authentication, publish, stage, uploads });
  const spec = documentation(descriptions);
  if (stage >= 5) app.use(async (ctx, next) => {
    if (ctx.path === '/health' || ctx.path === '/ready') { try { await ctx.db.command({ ping: 1 }); ctx.body = { status: 'ok', db: 'connected', uptime: process.uptime() }; } catch { ctx.status = 503; ctx.body = { status: 'unavailable', db: 'disconnected' }; } return; }
    if (ctx.path === '/metrics') { ctx.type = registry.contentType; ctx.body = await registry.metrics(); return; }
    if (ctx.path === '/openapi.json') { ctx.body = spec; return; }
    if (ctx.path === '/api-docs/swagger-ui-init.js') { ctx.type = 'application/javascript'; ctx.body = `window.onload=function(){window.ui=SwaggerUIBundle({url:'/openapi.json',dom_id:'#swagger-ui',presets:[SwaggerUIBundle.presets.apis,SwaggerUIStandalonePreset],layout:'StandaloneLayout'});};`; return; }
    if (ctx.path === '/api-docs' || ctx.path === '/api-docs/') { ctx.type = 'html'; ctx.body = swagger.generateHTML(spec, { swaggerOptions: { persistAuthorization: false } }).replaceAll('./swagger-', '/api-docs/swagger-'); return; }
    if (ctx.path.startsWith('/api-docs/')) { const filename = ctx.path.slice('/api-docs/'.length); if (!['swagger-ui.css', 'swagger-ui-bundle.js', 'swagger-ui-standalone-preset.js', 'favicon-32x32.png', 'favicon-16x16.png'].includes(filename)) return next(); ctx.type = path.extname(filename); ctx.body = createReadStream(path.join(swaggerDist.getAbsoluteFSPath(), filename)); return; }
    if (/^\/avatars\/[a-f\d-]+\.(png|jpg)$/.test(ctx.path)) { const filename = path.join(uploads, path.basename(ctx.path)); try { await stat(filename); ctx.type = path.extname(filename); ctx.body = createReadStream(filename); } catch { ctx.throw(404, 'Avatar ne naiden'); } return; }
    await next();
  });
  app.use(router.routes()).use(router.allowedMethods());
  app.on('error', error => log.error({ error: error.message }, 'Oshibka servera'));
  return { app, authentication, spec, registry };
}
module.exports = { createApp };
