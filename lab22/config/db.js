import mysql from 'mysql2/promise';
import raw from 'mysql2';
export const config = { host: process.env.DB_HOST ?? '127.0.0.1', port: Number(process.env.DB_PORT ?? 3306), user: process.env.DB_USER ?? 'student', password: process.env.DB_PASSWORD, database: process.env.DB_NAME ?? 'lab477', connectionLimit: 10, connectTimeout: 3000, decimalNumbers: true, charset: 'utf8mb4' };
export const metrics = { queries: 0, milliseconds: 0, errors: 0 };
export function instrument(target) {
  for (const method of ['query', 'execute', 'beginTransaction', 'commit', 'rollback']) {
    if (!target[method]) continue;
    const original = target[method].bind(target);
    target[method] = async (...args) => { const start = performance.now(); metrics.queries++; try { return await original(...args); } catch (error) { metrics.errors++; throw error; } finally { const ms = performance.now() - start; metrics.milliseconds += ms; console.log(`[SQL] [477] ${typeof args[0] === 'string' ? args[0] : method} (${ms.toFixed(2)} ms)`); } };
  }
  return target;
}
export function pool() {
  const instance = mysql.createPool(config);
  instance.pool.on('error', error => console.error(`[POOL ERROR] ${error.code}`));
  const get = instance.getConnection.bind(instance); instance.getConnection = async () => instrument(await get());
  return instrument(instance);
}
export const single = overrides => mysql.createConnection({ ...config, ...overrides });
export const rawConnection = () => raw.createConnection(config);

