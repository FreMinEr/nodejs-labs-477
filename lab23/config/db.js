import { MongoClient } from 'mongodb';
export const metrics = { queries: 0, errors: 0, milliseconds: 0 };
export async function connect(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error('Nuzhen MONGODB_URI v .env');
  const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 2000, heartbeatFrequencyMS: 1000, monitorCommands: true });
  client.on('serverHeartbeatSucceeded', () => console.log(`[HEARTBEAT] Uspeh ${new Date().toISOString()}`));
  client.on('serverHeartbeatFailed', () => console.log('[HEARTBEAT] Oshibka soedineniya'));
  client.on('commandSucceeded', event => { metrics.queries++; metrics.milliseconds += event.duration; console.log(`[DB] [477] ${event.commandName} (${event.duration.toFixed(2)} ms)`); });
  client.on('commandFailed', event => { metrics.queries++; metrics.errors++; metrics.milliseconds += event.duration; console.log(`[DB ERROR] ${event.commandName}`); });
  try { await client.connect(); return { client, db: client.db(process.env.DB_NAME ?? 'lab477') }; } catch (error) { await client.close(); throw error; }
}
