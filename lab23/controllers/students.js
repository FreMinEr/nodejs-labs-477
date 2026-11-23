import { service } from '../services/students.js';
export const list = async ctx => { ctx.body = await service(ctx).findAll(ctx.query); };
export const get = async ctx => { ctx.body = await service(ctx).findById(ctx.params.id); if (!ctx.body) ctx.throw(404, 'Student ne naiden'); };
export const create = async ctx => { ctx.body = await service(ctx).create(ctx.request.body); ctx.status = 201; };
export const update = async ctx => { ctx.body = await service(ctx).update(ctx.params.id, ctx.request.body); if (!ctx.body) ctx.throw(404, 'Student ne naiden'); };
export const remove = async ctx => { if (!(await service(ctx).delete(ctx.params.id))) ctx.throw(404, 'Student ne naiden'); ctx.body = { deleted: true }; };
export const stats = async ctx => { ctx.body = await service(ctx).getStats(); };
export const search = async ctx => { const data = await service(ctx).search(ctx.query.q); ctx.body = { found: data.length, data }; };
export const batch = async ctx => { ctx.body = await service(ctx).batchCreate(ctx.request.body); ctx.status = 201; };
