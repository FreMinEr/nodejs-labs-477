import { readdir, readFile } from 'node:fs/promises';
import { pool } from './config/db.js';
export async function migrate(db, rollback = false) {
  await db.query('CREATE TABLE IF NOT EXISTS migrations (name VARCHAR(100) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
  if (rollback) {
    const [rows] = await db.query('SELECT name FROM migrations ORDER BY name DESC LIMIT 1');
    if (!rows.length) return console.log('Net migracii dlya otkata');
    const table = rows[0].name.startsWith('002') ? 'student_groups' : 'students';
    await db.query(`DROP TABLE IF EXISTS ${table}`); await db.execute('DELETE FROM migrations WHERE name=?', [rows[0].name]); console.log(`Migraciya otkachena: ${rows[0].name}`); return;
  }
  for (const name of (await readdir(new URL('./migrations/', import.meta.url))).filter(n => n.endsWith('.sql')).sort()) {
    const [rows] = await db.execute('SELECT name FROM migrations WHERE name=?', [name]); if (rows.length) continue;
    await db.query(await readFile(new URL(`./migrations/${name}`, import.meta.url), 'utf8')); await db.execute('INSERT INTO migrations(name) VALUES(?)', [name]); console.log(`Migraciya primenena: ${name}`);
  }
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/migrate.js')) { const db = pool(); try { await migrate(db, process.argv[2] === 'rollback'); } finally { await db.end(); } }
