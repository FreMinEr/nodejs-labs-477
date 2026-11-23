import { createReadStream, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import yazl from 'yazl';
import { fs, path, variant, MB, run, exists, filesIn } from './common.js';

const source = path.join('.', `source_${variant}`);
const backup = path.join('.', `backup_${variant}`);
const textExtensions = new Set(['.txt', '.js', '.json']);

async function digest(filename) {
  const hash = createHash('sha256');
  await pipeline(createReadStream(filename, { highWaterMark: 64 * 1024 }), hash);
  return hash.digest('hex');
}

async function seed() {
  if (await exists(source)) {
    console.log('Ispolzuetsya sushchestvuyushchaya ishodnaya papka');
    return;
  }
  await fs.mkdir(source);
  for (let number = 1; number <= 3; number++) await fs.mkdir(path.join(source, `folder_${number}`));
  const extensions = ['.txt', '.js', '.json', '.jpg', '.png', '.gif'];
  async function make(filename, length, extension) {
    const prefix = extension === '.json' ? '{"value":"' : extension === '.js' ? "export default '" : 'Dannye varianta 17\n';
    const suffix = extension === '.json' ? '"}\n' : extension === '.js' ? "';\n" : '\n';
    await pipeline(Readable.from((function* () {
      yield prefix;
      for (let offset = 0; offset < length; offset += 64 * 1024) yield 'a'.repeat(Math.min(64 * 1024, length - offset));
      yield suffix;
    })()), createWriteStream(filename, { flags: 'wx' }));
  }
  for (let index = 1; index <= 20; index++) {
    const extension = extensions[(index - 1) % extensions.length];
    await make(path.join(source, `file_${index}${extension}`), index === 1 ? 2 * MB + 123 : index * 4096, extension);
  }
  for (let number = 1; number <= 3; number++) await make(path.join(source, `folder_${number}`, `nested_${number}.txt`), number * 1500, '.txt');
  const manifest = [];
  for (const filename of await filesIn(source)) {
    manifest.push({ path: path.relative(source, filename), bytes: (await fs.stat(filename)).size, sha256: await digest(filename) });
  }
  await fs.writeFile(path.join(source, 'manifest.json'), JSON.stringify({ variant, note: 'Faily izobrazhenii soderzhat testovye baity dlya kopirovaniya', files: manifest }, null, 2));
  console.log(`Sozdano ${manifest.length} testovyh failov i manifest.json`);
}

async function compare() {
  const sourceFiles = new Map((await filesIn(source)).map(filename => [path.relative(source, filename), filename]));
  const backupFiles = new Map((await filesIn(backup)).map(filename => [path.relative(backup, filename), filename]));
  const result = { added: [], deleted: [], changed: [], same: [] };
  for (const [relative, filename] of sourceFiles) {
    if (!backupFiles.has(relative)) result.added.push(relative);
    else if (await digest(filename) !== await digest(backupFiles.get(relative))) result.changed.push(relative);
    else result.same.push(relative);
  }
  for (const relative of backupFiles.keys()) if (!sourceFiles.has(relative)) result.deleted.push(relative);
  const labels = { added: 'Dobavleny v istochnike', deleted: 'Udaleny iz istochnika', changed: 'Izmeneny', same: 'Sovpadayut' };
  const lines = ['Sravnenie source i backup po soderzhimomu (SHA-256)'];
  for (const [key, files] of Object.entries(result)) {
    lines.push(`${labels[key]}: ${files.length}`, ...files.map(file => `  ${file}`));
  }
  const report = path.join('.', `sync_report_${variant}.txt`);
  await fs.writeFile(report, `${lines.join('\n')}\n`);
  console.log(`${lines.join('\n')}\nOtchet sohranen: ${report}`);
}

await run(async () => {
  const mode = process.argv[2] ?? 'all';
  if (!['all', 'compare'].includes(mode)) throw new Error('Rezhimy: all ili compare');
  if (mode === 'compare') {
    await compare();
    return;
  }
  await seed();
  if (await exists(backup)) throw new Error('Rezervnaya papka uzhe sushchestvuet. Dlya sravneniya ispolzuite compare');
  await fs.mkdir(backup);
  const files = await filesIn(source);
  let streamed = 0;
  let copied = 0;
  let bytes = 0;
  for (const [index, filename] of files.entries()) {
    const relative = path.relative(source, filename);
    const destination = path.join(backup, relative);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    const { size } = await fs.stat(filename);
    bytes += size;
    let method;
    if (size > MB || textExtensions.has(path.extname(filename))) {
      const highWaterMark = size > MB ? 512 * 1024 : 64 * 1024;
      await pipeline(createReadStream(filename, { highWaterMark }), createWriteStream(destination, { flags: 'wx' }));
      streamed++;
      method = size > MB ? 'potok, chanki 512 KB' : 'potok';
    } else {
      await fs.copyFile(filename, destination, fs.constants.COPYFILE_EXCL);
      copied++;
      method = 'obychnoe kopirovanie';
    }
    console.log(`Progress: ${index + 1}/${files.length} | ${relative} | ${size} bait | ${method}`);
  }
  console.log(`Kopirovanie zaversheno\nPotok: ${streamed}; obychnoe: ${copied}; vsego: ${bytes} bait`);
  await compare();
  const zip = new yazl.ZipFile();
  const archive = path.join('.', `backup_${variant}.zip`);
  const output = createWriteStream(archive, { flags: 'wx' });
  zip.on('error', error => zip.outputStream.destroy(error));
  const completion = pipeline(zip.outputStream, output);
  for (const filename of await filesIn(backup)) zip.addFile(filename, path.relative(backup, filename).split(path.sep).join('/'));
  zip.end();
  await completion;
  console.log(`ZIP-arhiv sozdan: ${archive} (${(await fs.stat(archive)).size} bait)`);
});
