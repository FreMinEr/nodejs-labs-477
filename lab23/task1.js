import { connect } from './config/db.js';
import { setTimeout } from 'node:timers/promises';
let client;
try { const result = await connect(process.argv.includes('--bad-uri') ? 'mongodb://127.0.0.1:1' : undefined); client = result.client; const db = result.db; console.log('Podklyuchenie ustanovleno', await db.command({ ping: 1 })); console.log('VERSION', (await db.command({ buildInfo: 1 })).version); console.log('DATABASES', await db.admin().listDatabases({ authorizedDatabases: true })); console.log('COLLECTIONS', await db.listCollections().toArray()); await setTimeout(2200); }
catch (error) { console.error(`Oshibka podklyucheniya: ${error.name}`); process.exitCode = 1; }
finally { await client?.close(); console.log('Soedinenie zakryto'); }
