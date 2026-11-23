import { StudentDAO } from '../dao/student-dao.js';
export const service = ctx => new StudentDAO(ctx.db, ctx.mongo);
