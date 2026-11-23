import Router from '@koa/router';
import * as c from '../controllers/students.js';
import { metrics } from '../config/db.js';
export const router = new Router();
router.get('/api/students/stats', c.stats).get('/api/students/search', c.search).post('/api/students/batch', c.batch);
router.get('/api/students', c.list).post('/api/students', c.create).get('/api/students/:id', c.get).put('/api/students/:id', c.update).delete('/api/students/:id', c.remove);
router.get('/api/metrics', ctx => { ctx.body = { group: '477', queries: metrics.queries, errors: metrics.errors, avgTime: metrics.queries ? metrics.milliseconds / metrics.queries : 0 }; });
