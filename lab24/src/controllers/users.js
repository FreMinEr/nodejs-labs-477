const User = require('../models/user');
function controllers(service, publish, stage) {
  return {
    list: async ctx => { const result = await User.findAll(ctx.state.query); ctx.body = { ...result, error: null }; },
    get: async ctx => { const data = await User.findById(ctx.params.id); if (!data) ctx.throw(404, 'Polzovatel ne naiden'); ctx.body = { data, error: null }; },
    create: async ctx => { const data = await service.create(ctx.request.body); ctx.status = 201; ctx.body = { data, error: null }; publish('insert', data); },
    update: async ctx => { const data = await service.update(ctx.params.id, ctx.request.body); ctx.body = { data, error: null }; publish('update', data); },
    remove: async ctx => { ctx.body = { data: await service.remove(ctx.params.id, stage >= 5), error: null }; publish('delete', { _id: ctx.params.id }); },
    stats: async ctx => { ctx.body = { data: await User.stats(), error: null }; },
    search: async ctx => { const result = await User.findAll(ctx.state.query); ctx.body = { ...result, found: result.pagination.total, error: null }; }
  };
}
module.exports = { controllers };
