import { EventEmitter } from 'node:events';
const emitter = new EventEmitter();
emitter.on('greet', name => console.log(`[greet] Privet, ${name}!`));
emitter.on('info', () => console.log('[info] Gruppa: 477'));
emitter.on('bye', () => console.log('[bye] Do svidaniya!'));
console.log('Demonstraciya EventEmitter');
emitter.emit('greet', 'Ivan'); emitter.emit('info'); emitter.emit('bye');
console.log(`emit unknown: ${emitter.emit('unknown')}`);
console.log(`emit greet: ${emitter.emit('greet', 'Ivan')}`);
