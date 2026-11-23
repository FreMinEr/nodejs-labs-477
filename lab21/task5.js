import { readFile } from 'node:fs/promises';
import { runConveyor } from './conveyor.js';
const timeout = Number(process.env.PIPELINE_TIMEOUT_MS ?? 10000);
try {
  const main = await runConveyor({ timeout });
  console.log('CSV nachalo:\n' + (await readFile('data/students.csv', 'utf8')).split('\n').slice(0, 6).join('\n'));
  await runConveyor({ timeout: 1000, slow: true, filename: 'cancelled.csv' });
  const alternative = await runConveyor({ timeout, mode: 'async', filename: 'students-async.csv' });
  const equal = (await readFile('data/students.csv')).equals(await readFile('data/students-async.csv'));
  console.log(`COMPARE pipeline=${main.seconds}s async=${alternative.seconds}s ravnye CSV=${equal}`);
  console.log('ERRORS:\n' + (await readFile('errors.log', 'utf8')).split('\n').slice(-15).join('\n'));
} catch (error) { console.error(`Oshibka: ${error.message}`); process.exitCode = 1; }
