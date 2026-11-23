import { WebSocketServer, WebSocket } from 'ws';
import { cacheEntries } from '../middleware/common.js';
export function changes(db) {
  const sockets = new WebSocketServer({ host: '127.0.0.1', port: Number(process.env.WS_PORT ?? 3001) });
  sockets.on('listening', () => console.log(`WebSocket server: ${sockets.address().port}`));
  sockets.on('error', error => console.error(`WS oshibka: ${error.code}`));
  const stream = db.collection('students').watch([], { fullDocument: 'updateLookup' });
  stream.on('change', change => { cacheEntries.clear(); const event = { type: change.operationType, id: change.documentKey?._id, data: change.fullDocument }; console.log(`[CHANGE] ${JSON.stringify(event)}`); for (const socket of sockets.clients) if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event)); });
  stream.on('error', error => console.error(`Change Stream oshibka: ${error.code}`));
  console.log('Change Stream zapushchen');
  return async () => { await stream.close(); for (const socket of sockets.clients) socket.terminate(); await new Promise(resolve => sockets.close(resolve)); };
}
