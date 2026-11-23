export function errors() { return async (ctx, next) => { try { await next(); } catch (error) { const codes = { ER_DUP_ENTRY: 409, ER_NO_REFERENCED_ROW: 400, ER_NO_REFERENCED_ROW_2: 400, ECONNREFUSED: 503, PROTOCOL_CONNECTION_LOST: 503 }; ctx.status = error.status ?? codes[error.code] ?? 500; ctx.body = { error: error.status ? error.message : 'Oshibka obrabotki', code: error.code ?? 'REQUEST_ERROR', ...(error.transaction ? { transaction: error.transaction } : {}) }; console.error(`Oshibka HTTP: ${ctx.status} ${error.code ?? error.message}`); } }; }
export function database(db) { return async (ctx, next) => { ctx.db = db; await next(); }; }
export function cache() {
  const entries = new Map(), stats = { hits: 0, misses: 0 };
  const middleware = async (ctx, next) => {
    if (ctx.path === '/api/cache/stats') { ctx.body = { ...stats, size: entries.size, ttl: 60 }; return; }
    const eligible = ctx.method === 'GET' && !ctx.path.includes('metrics');
    if (eligible) { const hit = entries.get(ctx.url); if (hit && hit.expires > Date.now()) { stats.hits++; ctx.set('X-Cache', 'HIT'); ctx.body = structuredClone(hit.body); return; } entries.delete(ctx.url); stats.misses++; ctx.set('X-Cache', 'MISS'); }
    await next();
    if (eligible && ctx.status === 200) { if (entries.size >= 1000) entries.delete(entries.keys().next().value); entries.set(ctx.url, { body: structuredClone(ctx.body), expires: Date.now() + 60000 }); }
    if (ctx.method !== 'GET' && ctx.status < 400) entries.clear();
  };
  return middleware;
}
