import http from 'node:http';
import os from 'node:os';
import { EventBus } from './event-bus.js';
const bus = new EventBus();
bus.on('error', (error, event) => console.log(`[ERROR] [477] ${event}: ${error.message}`), 100);
bus.onAny((event, ...args) => console.log(`[onAny] ${event}: ${JSON.stringify(args.map(arg => arg instanceof Error ? arg.message : arg))}`));
bus.on('greet', () => console.log('[priority 0] Nizkii'), 0);
bus.on('greet', () => console.log('[priority 10] Vysokii'), 10);
bus.on('greet', () => console.log('[priority 5] Srednii'), 5);
bus.emit('greet', 'Ivan'); bus.emit('info', '477');
let once = 0;
bus.once('tick', () => { once++; console.log('Once slushatel'); });
for (let i = 1; i <= 3; i++) bus.emit('tick', i);
console.log(`Once vyzvan: ${once}`);
bus.on('test', () => { throw new Error('Oshibka v slushatele'); }); bus.emit('test');
bus.on('test2', async () => { throw new Error('Asinhronnaya oshibka'); }); bus.emit('test2');
const monitor = setInterval(() => bus.emit('system', { free: os.freemem(), total: os.totalmem(), uptime: os.uptime() }), 2000);
const server = http.createServer((req, res) => {
  bus.emit('request', { method: req.method, url: req.url });
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method === 'GET' && req.url === '/metrics') res.end(JSON.stringify(bus.getMetrics(), null, 2));
  else { res.statusCode = 404; res.end(JSON.stringify({ error: 'Marshrut ne naiden' })); }
});
server.listen(Number(process.env.PORT ?? 3000), '127.0.0.1', () => console.log(`Server zapushchen: http://127.0.0.1:${server.address().port}`));
function stop() { clearInterval(monitor); server.close(() => console.log('Server ostanovlen')); }
server.on('error', error => { clearInterval(monitor); console.error(`Oshibka servera: ${error.code}`); process.exitCode = 1; });
process.once('SIGINT', stop); process.once('SIGTERM', stop);
