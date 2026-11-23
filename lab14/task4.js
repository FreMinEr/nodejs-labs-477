import { createReadStream, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { randomInt } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { fs, path, variant, MB, run, exists } from './common.js';

await run(async () => {
  const started = performance.now();
  const source = path.join('.', `data_${variant}.txt`);
  const output = path.join('.', `processed_${variant}.txt`);
  if (!await exists(source)) {
    async function* generate() {
      for (let number = 1; number <= 100000; number++) {
        yield `${number}, ${randomInt(1, 1001)}, Variant ${variant}\n`;
      }
    }
    await pipeline(Readable.from(generate()), createWriteStream(source, { flags: 'wx' }));
    console.log('Sozdan fail iz 100000 strok');
  }
  const { size } = await fs.stat(source);
  if (!size) throw new Error('Vhodnoi fail pust');
  console.log(`Obrabotka faila: ${source}\nRazmer: ${size} bait (${(size / MB).toFixed(2)} MB)\nBufer: 64 KB`);
  let count = 0;
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  let consumed = 0;
  let nextProgress = 10;
  const frequencies = new Array(1001).fill(0);
  function processLine(line) {
    const match = /^(\d+),\s*(\d+),\s*Variant 17\r?$/.exec(line);
    if (!match || Number(match[1]) !== count + 1) throw new Error(`Nevernyi format stroki ${count + 1}`);
    const value = Number(match[2]);
    if (value < 1 || value > 1000) throw new Error(`Chislo vne diapazona v stroke ${count + 1}`);
    count++;
    sum += value;
    min = Math.min(min, value);
    max = Math.max(max, value);
    frequencies[value]++;
  }
  await pipeline(createReadStream(source, { highWaterMark: 64 * 1024, encoding: 'utf8' }), async input => {
    let remainder = '';
    for await (const chunk of input) {
      remainder += chunk;
      let index;
      while ((index = remainder.indexOf('\n')) !== -1) {
        const line = remainder.slice(0, index);
        remainder = remainder.slice(index + 1);
        processLine(line);
        consumed += Buffer.byteLength(`${line}\n`);
        while (nextProgress <= 100 && consumed * 100 / size >= nextProgress) {
          console.log(`Progress: ${nextProgress}% (${count} strok)`);
          nextProgress += 10;
        }
      }
      if (remainder.length > 1024) throw new Error('Slishkom dlinnaya stroka');
    }
    if (remainder) processLine(remainder);
  });
  if (count < 100000) throw new Error('Trebuetsya minimum 100000 strok');
  if (nextProgress === 100) console.log(`Progress: 100% (${count} strok)`);
  function valueAt(position) {
    let total = 0;
    for (let value = 1; value <= 1000; value++) {
      total += frequencies[value];
      if (total >= position) return value;
    }
  }
  const median = (valueAt(Math.floor((count + 1) / 2)) + valueAt(Math.floor((count + 2) / 2))) / 2;
  const result = [
    `Vsego strok: ${count}`,
    `Summa chisel: ${sum}`,
    `Srednee: ${sum / count}`,
    `Minimum: ${min}`,
    `Maksimum: ${max}`,
    `Mediana: ${median}`
  ].join('\n');
  await fs.writeFile(output, `${result}\n`, 'utf8');
  console.log(`Obrabotka zavershena!\n${result}\nRezultaty sohraneny: ${output}`);
  console.log(`Vremya: ${((performance.now() - started) / 1000).toFixed(2)} sek`);
});
