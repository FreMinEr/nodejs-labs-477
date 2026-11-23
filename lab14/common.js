import * as fs from 'node:fs/promises';
import path from 'node:path';

export { fs, path };
export const variant = Number(process.env.VARIANT ?? 17);
export const MB = 1024 * 1024;

export function stamp() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: process.env.TIME_ZONE ?? 'Europe/Moscow',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(new Date());
}

export async function run(action) {
  try {
    if (variant !== 17) throw new Error('Eta rabota podgotovlena dlya varianta 17');
    await action();
  } catch (error) {
    const messages = {
      ENOENT: 'Fail ili katalog ne naiden',
      EACCES: 'Net prav dostupa',
      EPERM: 'Operaciya zapreshchena',
      EEXIST: 'Fail ili katalog uzhe sushchestvuet',
      ENOTDIR: 'Ukazan ne katalog',
      ENOSPC: 'Nedostatochno mesta na diske'
    };
    console.error(`Oshibka: ${messages[error.code] ?? error.message}`);
    process.exitCode = 1;
  }
}

export async function exists(target) {
  try {
    await fs.lstat(target);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

export async function filesIn(directory) {
  const result = [];
  for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const target = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Simvolicheskie ssylki ne podderzhivayutsya');
    if (entry.isDirectory()) result.push(...await filesIn(target));
    else if (entry.isFile()) result.push(target);
  }
  return result;
}

export async function tree(directory, indent = '') {
  console.log(`${indent}${path.basename(directory)}/`);
  for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await tree(target, `${indent}  `);
    else console.log(`${indent}  ${entry.name}`);
  }
}
