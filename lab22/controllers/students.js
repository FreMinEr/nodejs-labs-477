import { StudentDAO } from '../models/student-dao.js';
import { batch } from '../services/students.js';
export const list = async ctx => { ctx.body = await new StudentDAO(ctx.db).findAll(ctx.query); };
export const stats = async ctx => { ctx.body = await new StudentDAO(ctx.db).getStats(); };
export const get = async ctx => { ctx.body = await new StudentDAO(ctx.db).findById(ctx.params.id); if (!ctx.body) ctx.throw(404, 'Student ne naiden'); };
export const create = async ctx => { ctx.body = await new StudentDAO(ctx.db).create(ctx.request.body); ctx.status = 201; };
export const update = async ctx => { ctx.body = await new StudentDAO(ctx.db).update(ctx.params.id, ctx.request.body); if (!ctx.body) ctx.throw(404, 'Student ne naiden'); };
export const remove = async ctx => { if (!(await new StudentDAO(ctx.db).delete(ctx.params.id))) ctx.throw(404, 'Student ne naiden'); ctx.body = { deleted: true }; };
export const many = async ctx => { ctx.body = await batch(ctx.db, ctx.request.body); ctx.status = 201; };
