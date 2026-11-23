import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from './event-bus.js';
test('Prioritet i poryadok ravnyh', () => { const bus = new EventBus(), values = []; bus.on('a', () => values.push(0)); bus.on('a', () => values.push(10), 10); bus.on('a', () => values.push(11), 10); bus.emit('a'); assert.deepEqual(values, [10, 11, 0]); });
test('Once pri reentrant emit', () => { const bus = new EventBus(); let count = 0; bus.once('a', () => { count++; bus.emit('a'); }); bus.emit('a'); bus.emit('a'); assert.equal(count, 1); });
test('Off i wildcard', () => { const bus = new EventBus(); let count = 0; const listener = () => count++; bus.on('a', listener).off('a', listener); assert.equal(bus.emit('a'), false); bus.onAny(listener); bus.emit('b'); assert.equal(count, 1); bus.offAny(listener); assert.equal(bus.emit('b'), false); });
test('Sinhronnaya i asinhronnaya oshibki', async () => { const bus = new EventBus(), errors = []; bus.on('error', error => errors.push(error.message), 100); bus.on('a', () => { throw new Error('sync'); }); bus.on('a', async () => { throw new Error('async'); }); bus.emit('a'); await new Promise(resolve => setImmediate(resolve)); assert.deepEqual(errors, ['sync', 'async']); assert.equal(bus.getMetrics().events.a.errors, 2); });
test('Metriki i kopiya dannyh', () => { const bus = new EventBus(); bus.emit('a'); bus.emit('a'); const data = bus.getMetrics(); assert.equal(data.total, 2); data.events.a.count = 10; assert.equal(bus.getMetrics().events.a.count, 2); });
test('Error bez obrabotchika', () => assert.throws(() => new EventBus().emit('error', new Error('test')), /test/));
