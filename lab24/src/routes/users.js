const Router = require('@koa/router');
const multer = require('@koa/multer');
const { stringify } = require('csv-stringify/sync');
const { parse } = require('csv-parse/sync');
const { randomUUID } = require('node:crypto');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const schemas = require('../validation');
const User = require('../models/user');
const { validation } = require('../middleware');
const { controllers } = require('../controllers/users');
const { requireRole, owner } = require('../auth');
function routes({ service, authentication, publish, stage, uploads }) {
  const router = new Router(), descriptions = [], c = controllers(service, publish, stage);
  const add = (method, pathname, protectedRoute, ...handlers) => { router[method](pathname, ...handlers); descriptions.push({ method, path: pathname, protected: protectedRoute }); };
  const authenticated = authentication.middleware.bind(authentication);
  const secure = stage >= 4 ? [authenticated] : [];
  const own = stage >= 4 ? [authenticated, owner] : [];
  add('get', '/api/users', false, validation(schemas.query, 'query'), c.list);
  if (stage >= 3) {
    add('get', '/api/users/search', false, validation(schemas.query, 'query'), c.search);
    add('get', '/api/users/stats', false, c.stats);
    add('get', '/api/users/export', false, validation(schemas.query, 'query'), async ctx => { const data = await User.export(ctx.state.query); if (ctx.state.query.format === 'json') { ctx.body = { data, error: null }; return; } ctx.type = 'text/csv'; ctx.attachment('users.csv'); ctx.body = stringify(data, { header: true, columns: ['name', 'email', 'group_name', 'age', 'course'], escape_formulas: true }); });
  }
  if (stage >= 4) {
    add('post', '/api/auth/register', false, validation(schemas.register), async ctx => { const data = await service.create(ctx.request.body); ctx.body = { data, error: null, ...await authentication.issue(data) }; ctx.status = 201; publish('insert', data); });
    add('post', '/api/auth/login', false, validation(schemas.login), async ctx => { ctx.body = { ...await authentication.login(ctx.request.body), error: null }; });
    add('post', '/api/auth/refresh', false, validation(schemas.token), async ctx => { ctx.body = { ...await authentication.refresh(ctx.request.body.refreshToken), error: null }; });
    add('post', '/api/auth/logout', false, validation(schemas.token), async ctx => { ctx.body = { data: await authentication.logout(ctx.request.body.refreshToken), error: null }; });
    add('get', '/api/admin/users', true, authenticated, requireRole('admin'), validation(schemas.query, 'query'), c.list);
    add('get', '/api/moderator/stats', true, authenticated, requireRole('admin', 'moderator'), c.stats);
  }
  if (stage >= 5) {
    const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024, files: 1 } });
    add('post', '/api/users/import', true, authenticated, requireRole('admin'), upload.single('file'), async ctx => {
      let records = ctx.request.body;
      if (ctx.file) { try { records = ctx.file.originalname.endsWith('.csv') ? parse(ctx.file.buffer, { columns: true, skip_empty_lines: true }).map(row => ({ ...row, ...(row.age ? { age: Number(row.age) } : {}), ...(row.course ? { course: Number(row.course) } : {}) })) : JSON.parse(ctx.file.buffer.toString()); } catch { ctx.throw(400, 'Nevernyi fail importa'); } }
      if (!Array.isArray(records) || !records.length || records.length > 1000) ctx.throw(400, 'Nuzhen massiv ot 1 do 1000 zapisei');
      records = records.map(record => schemas.check(schemas.create, record));
      const results = []; for (const record of records) { try { const data = await service.create(record); publish('insert', data); results.push({ id: data._id, created: true }); } catch (error) { if (error.status !== 409 && error.code !== 11000) throw error; results.push({ email: record.email, created: false, error: 'Email uzhe sushchestvuet' }); } }
      ctx.body = { data: results, error: null }; ctx.status = 201;
    });
    add('post', '/api/users/:id/avatar', true, authenticated, owner, upload.single('avatar'), async ctx => {
      if (!ctx.file) ctx.throw(400, 'Nuzhen fail avatar');
      const bytes = ctx.file.buffer, png = bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')), jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      if (!png && !jpg) ctx.throw(400, 'Razresheny tolko PNG i JPEG');
      if (!(await User.findById(ctx.params.id))) ctx.throw(404, 'Polzovatel ne naiden');
      const filename = randomUUID() + (png ? '.png' : '.jpg'); await mkdir(uploads, { recursive: true }); await writeFile(path.join(uploads, filename), bytes);
      await User.collection.updateOne({ _id: User.id(ctx.params.id) }, { $set: { avatar: `/avatars/${filename}` } }); ctx.body = { data: { avatar: `/avatars/${filename}` }, error: null };
    });
  }
  add('get', '/api/users/:id', false, c.get);
  add('post', '/api/users', stage >= 4, ...secure, validation(schemas.create), c.create);
  add('put', '/api/users/:id', stage >= 4, ...own, validation(schemas.update), c.update);
  add('delete', '/api/users/:id', stage >= 4, ...own, c.remove);
  return { router, descriptions };
}
module.exports = { routes };
