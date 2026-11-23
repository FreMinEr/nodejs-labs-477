import { Readable, Transform, Writable } from 'node:stream';
import { pipeline, finished } from 'node:stream/promises';
import { once } from 'node:events';
import { mkdir, open, appendFile, readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
export async function runConveyor({ count = 10000, timeout = 10000, slow = false, mode = 'pipeline', filename = 'students.csv', verbose = true } = {}) {
  await mkdir('data', { recursive: true });
  const stats = { generated: 0, validated: 0, enriched: 0, filtered: 0, written: 0, errors: 0, backpressure: 0, drains: 0 };
  const log = text => { if (verbose) console.log(text); };
  const controller = new AbortController(), start = performance.now();
  const timer = setTimeout(() => controller.abort(), timeout);
  let seed = 477; const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  async function* generate() {
    for (let i = 1; i <= count; i++) {
      controller.signal.throwIfAborted();
      if ((i - 1) % 100 === 0) await delay(slow ? 30 : 0, undefined, { signal: controller.signal });
      stats.generated++;
      yield { id: i, name: i % 997 === 0 ? '' : `Student ${i}`, group: '477', course: 1 + Math.floor(random() * 4), grade: Math.round((2 + random() * 3) * 10) / 10 };
    }
  }
  const valid = value => value.name && Number.isFinite(value.grade) && value.grade >= 2 && value.grade <= 5;
  const enrich = value => ({ ...value, averageGrade: Number(((value.grade + 4) / 2).toFixed(2)) });
  const csv = value => `${value.id},${value.name},${value.group},${value.course},${value.grade},${value.averageGrade}\n`;
  const report = () => { const percent = Math.floor(stats.generated / count * 100); log(`[PROGRESS] ${'#'.repeat(Math.floor(percent / 5)).padEnd(20, '-')} ${percent}% ${stats.generated}/${count}`); };
  const validate = async value => { if (valid(value)) { stats.validated++; return true; } stats.errors++; await appendFile('errors.log', `[${new Date().toISOString()}] [477] Oshibka validacii: id=${value.id}, otsutstvuet name\n`); return false; };
  const handle = await open(`data/${filename}`, 'w'); await handle.write('id,name,group,course,grade,averageGrade\n');
  const sink = new Writable({ highWaterMark: 128, write(chunk, encoding, callback) { handle.write(chunk).then(async () => { stats.written++; if (slow) await delay(2); callback(); }, callback); }, final(callback) { handle.close().then(() => callback(), callback); }, destroy(error, callback) { handle.close().then(() => callback(error), callback); } });
  const originalWrite = sink.write.bind(sink);
  sink.write = (...args) => { const ready = originalWrite(...args); if (!ready) { stats.backpressure++; if (stats.backpressure <= 3) log(`[BACKPRESSURE] Bufer polon; zapisano ${stats.written}`); } return ready; };
  sink.on('drain', () => { stats.drains++; if (stats.drains <= 3) log('[DRAIN] Prodolzhenie zapisi'); });
  const source = Readable.from(generate(), { highWaterMark: 100 });
  const streams = [source, sink];
  let aborted = false;
  const monitor = setInterval(report, 100);
  const watch = stream => stream.on('error', error => { log(`Oshibka potoka: ${error.code ?? error.message}`); });
  try {
    log(`Start ${mode}: ${count} studentov, timeout ${timeout} ms, gruppa 477`);
    if (mode === 'pipeline') {
      const validator = new Transform({ objectMode: true, highWaterMark: 16, transform(value, encoding, callback) { validate(value).then(ok => callback(null, ok ? value : undefined), callback); } });
      const enricher = new Transform({ objectMode: true, highWaterMark: 16, transform(value, encoding, callback) { stats.enriched++; callback(null, enrich(value)); } });
      const filter = new Transform({ objectMode: true, highWaterMark: 16, transform(value, encoding, callback) { if (value.grade > 3) { stats.filtered++; callback(null, value); } else callback(); } });
      const formatter = new Transform({ writableObjectMode: true, highWaterMark: 16, transform(value, encoding, callback) { callback(null, csv(value)); } });
      streams.splice(1, 0, validator, enricher, filter, formatter); streams.forEach(watch);
      await pipeline(...streams, { signal: controller.signal });
    } else {
      streams.forEach(watch);
      controller.signal.addEventListener('abort', () => { source.destroy(controller.signal.reason); sink.destroy(controller.signal.reason); }, { once: true });
      for await (const value of source) { if (!(await validate(value))) continue; stats.enriched++; const enriched = enrich(value); if (enriched.grade <= 3) continue; stats.filtered++; if (!sink.write(csv(enriched))) await once(sink, 'drain'); }
      sink.end(); await finished(sink);
    }
    report();
  } catch (error) {
    aborted = controller.signal.aborted;
    await appendFile('errors.log', `[${new Date().toISOString()}] [477] ${aborted ? 'Timeout: obrabotka otmenena' : error.message}\n`);
    if (!aborted) throw error;
    log('TIMEOUT: obrabotka otmenena');
  } finally {
    clearTimeout(timer); clearInterval(monitor); streams.forEach(stream => stream.destroy());
    await Promise.allSettled(streams.map(stream => finished(stream)));
  }
  const seconds = (performance.now() - start) / 1000;
  const result = { ...stats, seconds: Number(seconds.toFixed(3)), speed: Math.round(stats.generated / seconds), aborted, allDestroyed: streams.every(stream => stream.destroyed) };
  log(`RESULT ${JSON.stringify(result)}`);
  return result;
}
