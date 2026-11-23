import { fs, path, variant, MB, run } from './common.js';

await run(async () => {
  const root = path.relative(process.cwd(), path.resolve(process.argv[2] ?? '.')) || '.';
  const report = { directory: root, folders: 0, files: 0, bytes: 0, kilobytes: 0, megabytes: 0, extensions: {}, largest: [], smallest: [], variantMatches: [] };
  const all = [];
  async function scan(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        console.log(`Propushchena simvolicheskaya ssylka: ${target}`);
        continue;
      }
      if (entry.isDirectory()) {
        report.folders++;
        await scan(target);
      } else if (entry.isFile()) {
        const stat = await fs.stat(target);
        const file = { path: target, bytes: stat.size };
        all.push(file);
        report.bytes += stat.size;
        const extension = path.extname(entry.name).toLowerCase() || '(bez rasshireniya)';
        report.extensions[extension] ??= [];
        report.extensions[extension].push(file);
        if (entry.name.includes(String(variant))) report.variantMatches.push(file);
      }
    }
  }
  await scan(root);
  report.files = all.length;
  report.kilobytes = report.bytes / 1024;
  report.megabytes = report.bytes / MB;
  all.sort((a, b) => a.bytes - b.bytes || a.path.localeCompare(b.path));
  report.smallest = all.slice(0, 5);
  report.largest = [...all].reverse().slice(0, 5);
  console.log(`Analiz direktorii: ${root}\nPapok: ${report.folders}\nFailov: ${report.files}`);
  console.log(`Razmer: ${report.bytes} bait; ${report.kilobytes.toFixed(2)} KB; ${report.megabytes.toFixed(2)} MB`);
  for (const [extension, files] of Object.entries(report.extensions).sort()) {
    console.log(`Tip ${extension}: ${files.length} failov`);
    for (const file of files) console.log(`  ${file.path} (${file.bytes} bait)`);
  }
  for (const [title, files] of [['Top-5 bolshih failov', report.largest], ['Top-5 malenkih failov', report.smallest], ['Faily s nomerom 17', report.variantMatches]]) {
    console.log(`${title}:`);
    for (const file of files) console.log(`  ${file.path} (${file.bytes} bait)`);
    if (!files.length) console.log('  Net failov');
  }
  const target = path.join('.', `report_${variant}.json`);
  const handle = await fs.open(target, 'w');
  try {
    const stream = handle.createWriteStream();
    const { pipeline } = await import('node:stream/promises');
    const { Readable } = await import('node:stream');
    await pipeline(Readable.from(JSON.stringify(report, null, 2)), stream);
  } finally {
    await handle.close();
  }
  console.log(`Otchet sohranen: ${target}`);
});
