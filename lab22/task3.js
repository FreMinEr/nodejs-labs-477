import { pool, single, rawConnection } from './config/db.js';
import { migrate } from './migrate.js';
let db = pool();
async function expected(label, callback) { try { await callback(); throw new Error('Ozhidalas oshibka'); } catch (error) { console.log(`[${label}] ${error.code ?? error.message}`); } }
try {
  await migrate(db);
  await expected('NETWORK', async () => { const c = await single({ port: 1 }); await c.end(); });
  await expected('AUTH', async () => { const c = await single({ password: 'incorrect-demo-password' }); await c.end(); });
  await expected('SYNTAX', () => db.query('SELECT * FRM students'));
  await db.query('CREATE TABLE IF NOT EXISTS error_parent (id INT PRIMARY KEY) ENGINE=InnoDB');
  await db.query('INSERT IGNORE INTO error_parent(id) VALUES(1)');
  await expected('DUPLICATE', () => db.query('INSERT INTO error_parent(id) VALUES(1)'));
  await expected('NOT NULL', () => db.execute('INSERT INTO students(name,group_name,course) VALUES(?,?,?)', [null, '477', 1]));
  await db.query('CREATE TABLE IF NOT EXISTS error_child (id INT PRIMARY KEY, parent_id INT, FOREIGN KEY(parent_id) REFERENCES error_parent(id)) ENGINE=InnoDB');
  await expected('FOREIGN KEY', () => db.execute('INSERT INTO error_child(id,parent_id) VALUES(?,?)', [999, 999]));
  const victim = await db.getConnection(); const [[{ id }]] = await victim.query('SELECT CONNECTION_ID() id');
  const lost = new Promise(resolve => victim.connection.once('error', error => { db.pool.emit('error', error); resolve(error.code); }));
  const killer = await single(); await killer.query('KILL CONNECTION ?', [id]); await killer.end();
  console.log('POOL connection lost:', await lost); victim.release(); await db.end(); db = pool(); console.log('POOL peresozdan:', (await db.query('SELECT 1 ok'))[0]);
  await db.query('CREATE TABLE IF NOT EXISTS big_data (id INT PRIMARY KEY, payload VARCHAR(200)) ENGINE=InnoDB');
  for (let offset = 0; offset < 100000; offset += 1000) await db.query('INSERT IGNORE INTO big_data(id,payload) VALUES ?', [Array.from({ length: 1000 }, (_, i) => [offset + i + 1, 'Gruppa 477 ' + 'x'.repeat(160)])]);
  global.gc?.(); let baseline = process.memoryUsage().heapUsed, peak = baseline, count = 0; const start = performance.now();
  const raw = rawConnection();
  await new Promise((resolve, reject) => { const stream = raw.query('SELECT * FROM big_data').stream({ highWaterMark: 32 }); stream.on('data', row => { count++; if (count % 1000 === 0) peak = Math.max(peak, process.memoryUsage().heapUsed); if (count % 25000 === 0) console.log(`[STREAM] ${count}/100000`); }); stream.on('end', resolve); stream.on('error', reject); }); raw.end();
  console.log(`STREAM records=${count}, seconds=${((performance.now() - start) / 1000).toFixed(3)}, heap delta peak MiB=${((peak - baseline) / 1048576).toFixed(2)}`);
  global.gc?.(); baseline = process.memoryUsage().heapUsed; const [all] = await db.query('SELECT * FROM big_data'); console.log(`BUFFER records=${all.length}, heap delta MiB=${((process.memoryUsage().heapUsed - baseline) / 1048576).toFixed(2)}; eto izmerenie dannogo zapuska`);
  for (const fail of [false, true]) {
    const c = await db.getConnection(); let created;
    try { await c.beginTransaction(); const [r] = await c.execute('INSERT INTO students(name,group_name,course) VALUES(?,?,?)', ['Transaction demo', '477', 2]); created = r.insertId; await c.execute('INSERT INTO students(name,group_name,course) VALUES(?,?,?)', ['Transaction demo 2', '477', 2]); if (fail) await c.query('INSERT INTO error_parent(id) VALUES(1)'); await c.commit(); console.log('TRANSACTION COMMIT'); }
    catch (error) { await c.rollback(); console.log(`TRANSACTION ROLLBACK: ${error.code}`); }
    finally { c.release(); console.log('Soedinenie vozvrashcheno v pul'); }
    console.log('TRANSACTION check', (await db.execute('SELECT COUNT(*) total FROM students WHERE id=?', [created]))[0]);
  }
} finally { await db.end(); }
