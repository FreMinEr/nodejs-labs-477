const http = require('node:http');
const { WebSocketServer, WebSocket } = require('ws');
const { connect } = require('./db');
const { createApp } = require('./app');
async function start(stage = 5) {
  let client;
  try {
    const connection = await connect(process.env.MONGODB_URI, process.env.DB_NAME || 'lab24'); client = connection.client;
    const sockets = new WebSocketServer({ noServer: true });
    const publish = (type, data) => { const event = JSON.stringify({ type, data }); for (const socket of sockets.clients) if (socket.readyState === WebSocket.OPEN) socket.send(event); };
    const { app, authentication } = createApp({ db: connection.db, stage, publish });
    const server = http.createServer(app.callback());
    server.on('upgrade', async (req, socket, head) => { try { const url = new URL(req.url, 'http://localhost'); if (stage < 5 || url.pathname !== '/ws') throw new Error('Net marshruta'); await authentication.identify(url.searchParams.get('token')); sockets.handleUpgrade(req, socket, head, ws => sockets.emit('connection', ws, req)); } catch { socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n'); socket.destroy(); } });
    server.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log(`Server zapushchen: ${server.address().port}; zadanie ${stage}`));
    const stop = async () => { for (const socket of sockets.clients) socket.terminate(); sockets.close(); await new Promise(resolve => server.close(resolve)); await client.close(); console.log('Server i MongoDB zakryty'); };
    server.on('error', async error => { console.error(`Oshibka servera: ${error.code}`); await client.close(); process.exitCode = 1; });
    process.once('SIGINT', stop); process.once('SIGTERM', stop); return { server, stop };
  } catch (error) { console.error(`Oshibka zapuska: ${error.message}`); await client?.close(); process.exitCode = 1; }
}
module.exports = { start };
