import { connect } from './config/db.js';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const { client, db } = await connect();
try {
  const c = db.collection('big_data');
  for (let offset = 0; offset < 1000000; offset += 5000) await c.bulkWrite(Array.from({ length: 5000 }, (_, i) => { const id = offset + i + 1; return { updateOne: { filter: { _id: id }, update: { $setOnInsert: { name: id % 7 ? `Student ${id}` : `Иван ${id}`, group_name: id % 2 ? '477' : '478', course: 1 + id % 4, grade: 2 + (id % 30) / 10, email: `student${id}@example.test`, payload: 'x'.repeat(100) } }, upsert: true } }; }), { ordered: false });
  global.gc?.(); const baseline = process.memoryUsage().heapUsed; let peak = baseline, count = 0; const start = performance.now(); const cursor = c.find().batchSize(1000);
  try { for await (const doc of cursor) { count++; if (count % 10000 === 0) peak = Math.max(peak, process.memoryUsage().heapUsed); if (count % 250000 === 0) console.log(`CURSOR ${count}/1000000`); } } finally { await cursor.close(); }
  console.log(`CURSOR records=${count}, seconds=${((performance.now() - start) / 1000).toFixed(2)}, heapDeltaPeakMiB=${((peak - baseline) / 1048576).toFixed(2)}`);
  const next = c.find().batchSize(2); console.log('NEXT', (await next.next())._id); await next.close();
  const result = spawnSync(process.execPath, ['--max-old-space-size=48', fileURLToPath(new URL('./array-worker.js', import.meta.url))], { encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024, windowsHide: true });
  console.log('ARRAY ISOLATED PROCESS', result.stdout, 'exit=', result.status, 'signal=', result.signal); console.log(result.stderr.split('\n').filter(line => /heap|FATAL|allocation|Mark-Compact/i.test(line)).join('\n'));
  console.log('AGG GROUP', JSON.stringify(await c.aggregate([{ $match: { grade: { $gte: 0 } } }, { $group: { _id: '$group_name', average: { $avg: '$grade' }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]).toArray()));
  console.log('AGG COURSE', JSON.stringify(await c.aggregate([{ $group: { _id: '$course', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]).toArray()));
  console.log('TOP10', JSON.stringify(await c.aggregate([{ $sort: { grade: -1 } }, { $limit: 10 }, { $project: { name: 1, grade: 1 } }]).toArray()));
  await db.collection('groups').updateOne({ name: '477' }, { $set: { curator: 'Parfenok I.N.' } }, { upsert: true });
  console.log('LOOKUP', JSON.stringify(await c.aggregate([{ $group: { _id: '$group_name', count: { $sum: 1 } } }, { $lookup: { from: 'groups', localField: '_id', foreignField: 'name', as: 'group' } }]).toArray()));
  for (const spec of [{ group_name: 1 }, { group_name: 1, grade: -1 }]) console.log('INDEX', await c.createIndex(spec));
  console.log('INDEX', await c.createIndex({ email: 1 }, { unique: true }));
  const query = { group_name: '477', grade: { $gte: 4.8 } };
  for (const hint of [{ $natural: 1 }, { group_name: 1, grade: -1 }]) { const result = await c.find(query).hint(hint).explain('executionStats'); console.log('EXPLAIN', JSON.stringify({ hint, returned: result.executionStats.nReturned, timeMs: result.executionStats.executionTimeMillis, docs: result.executionStats.totalDocsExamined, keys: result.executionStats.totalKeysExamined })); }
  console.log('INDEX', await c.createIndex({ name: 'text' })); console.log('TEXT SEARCH', JSON.stringify(await c.find({ $text: { $search: 'Иван' } }, { projection: { name: 1, score: { $meta: 'textScore' } } }).sort({ score: { $meta: 'textScore' } }).limit(3).toArray()));
} finally { await client.close(); }
