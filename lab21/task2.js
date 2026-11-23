import { Writable } from 'node:stream';
import { once } from 'node:events';
let count = 0;
const destination = new Writable({ highWaterMark: 16, write(chunk, encoding, callback) { console.log(`[WRITE] ${chunk}`); count++; setTimeout(callback, 30); } });
destination.on('drain', () => console.log('[DRAIN] Bufer osvobozhden'));
destination.on('finish', () => console.log(`[FINISH] Zapisano chankov: ${count}`));
destination.on('error', error => console.error(`Oshibka: ${error.message}`));
for (const text of ['477', 'Student: Parfenok Ivan Nikolaevich', 'Laboratornaya rabota 21', 'Potoki']) {
  const ready = destination.write(text); console.log(`write() vernul: ${ready}`);
  if (!ready) await once(destination, 'drain');
}
destination.end(); await once(destination, 'finish');
