import { Readable } from 'node:stream';
const values = ['Gruppa: 477', 'Student: Parfenok Ivan Nikolaevich', 'Laboratornaya rabota: 21', 'Tema: Potoki v Node.js'];
let index = 0, chunks = 0, bytes = 0;
const source = new Readable({ read() { this.push(index < values.length ? values[index++] : null); } });
console.log('Demonstraciya Readable');
source.on('data', chunk => { chunks++; bytes += chunk.length; console.log(`[CHUNK ${chunks}] ${chunk}`); });
source.on('end', () => console.log(`[END] Potok zavershen; chankov: ${chunks}; bait: ${bytes}`));
source.on('error', error => { console.error(`Oshibka: ${error.message}`); process.exitCode = 1; });
