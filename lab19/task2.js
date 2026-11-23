import { EventEmitter } from 'node:events';
const emitter = new EventEmitter();
let regular = 0, single = 0;
emitter.on('tick', n => { regular++; console.log(`[tick ${n}] on`); });
emitter.once('tick', n => { single++; console.log(`[tick ${n}] once`); });
for (let n = 1; n <= 3; n++) emitter.emit('tick', n);
console.log(`on: ${regular}; once: ${single}`);
function first() { console.log('1. Pervyi slushatel, gruppa 477'); }
function second() { console.log('2. Vtoroi slushatel'); }
function third() { console.log('3. Tretii slushatel'); }
emitter.on('order', first); emitter.addListener('order', second); emitter.on('order', third);
console.log(`listenerCount do: ${emitter.listenerCount('order')}`);
console.log(`listeners: ${emitter.listeners('order').map(listener => listener.name).join(', ')}`);
emitter.emit('order');
emitter.removeListener('order', second);
console.log(`Posle removeListener: ${emitter.listenerCount('order')}`);
emitter.removeAllListeners('order');
console.log(`Posle removeAllListeners: ${emitter.listenerCount('order')}`);
