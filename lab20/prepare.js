import selfsigned from 'selfsigned';
import { mkdir, writeFile } from 'node:fs/promises';
const cert = await selfsigned.generate([{ name: 'commonName', value: 'localhost' }], { days: 30, keySize: 2048, algorithm: 'sha256', extensions: [{ name: 'subjectAltName', altNames: [{ type: 2, value: 'localhost' }, { type: 7, ip: '127.0.0.1' }] }] });
await mkdir(new URL('./certs/', import.meta.url), { recursive: true });
await writeFile(new URL('./certs/key.pem', import.meta.url), cert.private);
await writeFile(new URL('./certs/cert.pem', import.meta.url), cert.cert);
await writeFile(new URL('./public/big.bin', import.meta.url), Buffer.alloc(10 * 1024 * 1024, 71));
console.log('Sertifikat localhost i fail 10 MiB sozdany');
