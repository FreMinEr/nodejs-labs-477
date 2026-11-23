import { fs, path, variant, run, tree, exists } from './common.js';

await run(async () => {
  const root = path.join('.', `project_${variant}`);
  if (await exists(root)) throw new Error('Katalog proekta uzhe sushchestvuet. Zapustite zadanie v novoi rabochei papke');
  const folders = [
    ['', 'Koren proekta'],
    ['src', 'Ishodnyi kod'],
    [path.join('src', 'modules'), 'Moduli'],
    [path.join('src', 'components'), 'Komponenty'],
    [path.join('src', 'utils'), 'Vspomogatelnye funkcii'],
    ['data', 'Dannye'],
    [path.join('data', 'input'), 'Vhodnye dannye'],
    [path.join('data', 'output'), 'Vyhodnye dannye'],
    ['temp', 'Vremennye faily'],
    ...[1, 2, 3].map(number => [path.join('src', 'components', String(number)), `Komponent ${number}`])
  ];
  for (const [folder, description] of folders) {
    const directory = path.join(root, folder);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, 'info.txt'), `${description}\n`, 'utf8');
  }
  console.log('Iskhodnaya struktura:');
  await tree(root);
  await fs.rename(path.join(root, 'temp'), path.join(root, 'data', 'temp'));
  console.log('Papka temp peremeshchena v data');
  await fs.rename(path.join(root, 'data', 'output'), path.join(root, 'data', 'results'));
  console.log('Papka data/output pereimenovana v data/results');
  await fs.rm(path.join(root, 'data', 'temp'), { recursive: true });
  console.log('Papka data/temp udalena s soderzhimym\nObnovlennaya struktura:');
  await tree(root);
});
