import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpuDelta, memory, warnings, network } from './system.js';
test('CPU po raznice schetchikov', () => assert.equal(cpuDelta([{ times: { user: 10, idle: 10 } }], [{ times: { user: 40, idle: 20 } }]).percent, 75));
test('Bez novyh CPU taktov', () => assert.equal(cpuDelta([{ times: { user: 10, idle: 10 } }], [{ times: { user: 10, idle: 10 } }]).percent, 0));
test('Pamyat i porogi', () => { assert.equal(memory(100, 15).usedPercent, 85); assert.equal(warnings(90, 5).length, 2); assert.equal(warnings(20, 50).length, 0); });
test('Maskirovanie MAC', () => assert.ok(network().interfaces.every(item => item.mac.endsWith(':**:**:**'))));
