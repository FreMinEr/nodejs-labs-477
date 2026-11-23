import { fs, path, variant, stamp, run } from './common.js';

await run(async () => {
  const filename = path.join('.', `student_${variant}.txt`);
  const lines = [
    `Student: ${process.env.STUDENT_NAME ?? 'Parfenok Ivan Nikolaevich'}`,
    `Gruppa: ${process.env.STUDENT_GROUP ?? '477'}`,
    `Variant: ${variant}`,
    `Data: ${stamp()}`,
    'Lyubimye knigi:',
    '1. 1984 - Dzhordzh Oruell',
    '2. Master i Margarita - Mihail Bulgakov',
    '3. Duna - Frenk Herbert',
    '4. Hobbit - Dzhon Tolkin',
    '5. Solaris - Stanislav Lem'
  ];
  await fs.writeFile(filename, `${lines.join('\n')}\n`, 'utf8');
  const original = await fs.readFile(filename, 'utf8');
  const count = original.trimEnd().split('\n').length;
  await fs.appendFile(filename, `Kolichestvo zapisei: ${count}\n`, 'utf8');
  console.log(`Sozdan fail: ${filename}\nSoderzhimoe faila:\n${'-'.repeat(60)}`);
  console.log((await fs.readFile(filename, 'utf8')).trimEnd());
  console.log('-'.repeat(60));
});
