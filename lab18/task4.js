import os from 'node:os';
import { appendFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { snapshot, cpuDelta, memory, warnings, gb, group } from './system.js';
const index = process.argv.indexOf('--samples');
const samples = index < 0 ? Infinity : Number(process.argv[index + 1]);
if (!(samples > 0 && (samples === Infinity || Number.isInteger(samples)))) throw new Error('Nevernoe chislo zamerov');
console.log('Pervichnyi slepok:\n' + JSON.stringify(snapshot(), null, 2));
console.log('Monitoring kazhdye 2 sekundy. Ctrl+C dlya vyhoda.');
const abort = new AbortController();
process.once('SIGINT', () => abort.abort());
process.once('SIGTERM', () => abort.abort());
let count = 0, warningCount = 0, before = os.cpus();
await appendFile('monitor.log', '');
try {
  while (count < samples && !abort.signal.aborted) {
    await delay(2000, undefined, { signal: abort.signal });
    const after = os.cpus();
    const cpu = cpuDelta(before, after);
    const mem = memory();
    before = after;
    count++;
    const demo = process.argv.includes('--demo-alerts');
    const alerts = warnings(demo ? 90 : cpu.percent, demo ? 5 : mem.freePercent);
    const line = `CPU: ${cpu.percent.toFixed(1)}% | RAM: ${mem.usedPercent.toFixed(1)}% | Svobodno: ${gb(mem.free)} GB | busy_diff=${cpu.busyDiff} total_diff=${cpu.totalDiff}`;
    process.stdout.write((process.stdout.isTTY ? '\r\x1b[2K' : '') + line + (process.stdout.isTTY ? '' : '\n'));
    if (demo) console.log('\nTESTOVYI SCENARII anomalii: CPU=90%, svobodno RAM=5%; realnye zamery ukazany vyshe');
    for (const alert of alerts) {
      const entry = `[${new Date().toISOString()}] [${group}] ${demo ? '[TEST] ' : ''}Preduprezhdenie: ${alert}`;
      await appendFile('monitor.log', entry + '\n');
      warningCount++;
      console.log('\n' + entry);
    }
  }
} catch (error) { if (error.name !== 'AbortError') { console.error(`Oshibka monitoringa: ${error.code ?? error.message}`); process.exitCode = 1; } }
finally { console.log(`\nMonitoring ostanovlen. Zamerov: ${count}. Preduprezhdenii: ${warningCount}`); }
