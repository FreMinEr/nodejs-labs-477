import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { JsonParserTransform } from './transforms.js';
import { runConveyor } from './conveyor.js';
import { readFile } from 'node:fs/promises';
test('JSON stroki i UTF8 na granicah chankov', async () => {
  const bytes = Buffer.from('{"name":"Иван"}\n{"id":2}'); const stream = Readable.from([...bytes].map(byte => Buffer.from([byte]))).pipe(new JsonParserTransform());
  const result = []; for await (const value of stream) result.push(value); assert.deepEqual(result, [{ name: 'Иван' }, { id: 2 }]);
});
test('Konveer raven iteratoru i timeout zakryvaet potoki', async () => {
  const a = await runConveyor({ count: 1100, verbose: false, filename: 'test-a.csv' });
  const b = await runConveyor({ count: 1100, verbose: false, mode: 'async', filename: 'test-b.csv' });
  assert.equal(a.generated, 1100); assert.equal(a.errors, 1); assert.equal(a.written, b.written); assert.ok(a.backpressure > 0); assert.ok(a.allDestroyed);
  assert.deepEqual(await readFile('data/test-a.csv'), await readFile('data/test-b.csv'));
  const cancelled = await runConveyor({ count: 10000, timeout: 30, slow: true, verbose: false, filename: 'test-cancel.csv' }); assert.ok(cancelled.aborted); assert.ok(cancelled.allDestroyed);
});
