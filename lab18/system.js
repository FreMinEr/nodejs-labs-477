import os from 'node:os';
export const group = process.env.STUDENT_GROUP ?? '477';
export const gb = bytes => (bytes / 1024 ** 3).toFixed(2);
export function baseInfo() {
  const seconds = Math.floor(os.uptime());
  return { platform: os.platform(), type: os.type(), arch: os.arch(), release: os.release(), hostname: os.hostname(), uptimeSeconds: seconds, uptime: `${Math.floor(seconds / 3600)} ch ${Math.floor(seconds % 3600 / 60)} min ${seconds % 60} sek`, message: { win32: 'Vy rabotaete v Windows', linux: 'Vy rabotaete v Linux', darwin: 'Vy rabotaete v macOS' }[os.platform()] ?? 'Neizvestnaya platforma' };
}
export function memory(total = os.totalmem(), free = os.freemem()) { return { total, free, used: total - free, usedPercent: (1 - free / total) * 100, freePercent: free / total * 100 }; }
export function resources() {
  const cpus = os.cpus();
  return { cpuCount: cpus.length, models: [...new Set(cpus.map(cpu => cpu.model))], speedsMHz: cpus.map(cpu => cpu.speed), averageMHz: cpus.length ? cpus.reduce((sum, cpu) => sum + cpu.speed, 0) / cpus.length : 0, memory: memory(), loadavg: os.loadavg(), loadavgSupported: os.platform() !== 'win32' };
}
export function network() {
  const interfaces = Object.entries(os.networkInterfaces()).flatMap(([name, entries]) => (entries ?? []).map(entry => ({ name, family: entry.family, address: entry.address, mac: entry.mac.split(':').slice(0, 3).join(':') + ':**:**:**', internal: entry.internal })));
  const user = os.userInfo();
  return { interfaces, primary: interfaces.find(entry => !entry.internal && entry.family === 'IPv4') ?? null, user: { username: user.username, uid: user.uid, gid: user.gid, homedir: user.homedir, shell: user.shell ?? 'Nedostupno v Windows', isRoot: user.uid === 0, rootCheck: os.platform() === 'win32' ? 'UNIX root ne primenyaetsya v Windows' : user.uid === 0 ? 'Vnimanie: root' : 'Ne root' } };
}
export function cpuDelta(before, after) {
  let totalDiff = 0, idleDiff = 0;
  for (let i = 0; i < Math.min(before.length, after.length); i++) {
    totalDiff += Object.values(after[i].times).reduce((a, b) => a + b, 0) - Object.values(before[i].times).reduce((a, b) => a + b, 0);
    idleDiff += after[i].times.idle - before[i].times.idle;
  }
  return { totalDiff, busyDiff: totalDiff - idleDiff, percent: totalDiff > 0 ? Math.max(0, Math.min(100, (totalDiff - idleDiff) / totalDiff * 100)) : 0 };
}
export function warnings(cpu, freePercent) { return [...(cpu > 80 ? ['CPU kritichno >80%'] : cpu > 50 ? ['CPU preduprezhdenie >50%'] : []), ...(freePercent < 10 ? ['Svobodno pamyati menshe 10%'] : [])]; }
export function snapshot() { return { timestamp: new Date().toISOString(), group, system: baseInfo(), resources: resources(), network: network() }; }
