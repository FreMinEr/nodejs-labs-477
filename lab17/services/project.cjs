const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
function projectName(name) {
  if (!/^[a-z][a-z0-9-]{0,50}$/.test(name ?? '')) throw new Error('Imya: latinskie bukvy, cifry i defis, nachalo s bukvy');
  return name;
}
function configValue(config) {
  projectName(config.name);
  if (!['web', 'cli', 'library', 'microservice'].includes(config.type)) throw new Error('Nevernyi tip proekta');
  return config;
}
async function execute(command, args, cwd) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'ignore', shell: false });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Komanda zavershilas s kodom ${code}`)));
  });
}
async function init(options) {
  const config = configValue({ name: options.name, type: options.type, features: options.features ?? [], git: Boolean(options.git) });
  const root = path.resolve(config.name);
  await fs.mkdir(root);
  await fs.mkdir(path.join(root, 'src'));
  await fs.writeFile(path.join(root, 'config.json'), JSON.stringify(config, null, 2));
  await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ name: config.name, version: '1.0.0', scripts: { start: 'node src/index.js', test: 'node --test' } }, null, 2));
  await fs.writeFile(path.join(root, 'src', 'index.js'), `console.log('Privet iz ${config.name}');\n`);
  await fs.mkdir(path.join(root, 'test'));
  await fs.writeFile(path.join(root, 'test', 'basic.test.js'), "const test = require('node:test');\nconst assert = require('node:assert/strict');\ntest('Konfiguraciya', () => { const config = require('../config.json'); assert.ok(config.name); });\n");
  if (config.git) await execute('git', ['init', '-q'], root);
  return root;
}
async function readConfig(file = 'config.json') { return configValue(JSON.parse(await fs.readFile(file, 'utf8'))); }
async function build(options) {
  const file = path.resolve(options.config ?? 'config.json');
  const config = await readConfig(file);
  const root = path.dirname(file);
  const source = path.join(root, 'src', 'index.js');
  await fs.access(source);
  const target = path.join(root, 'dist', `${config.name}.js`);
  if (!options.dryRun) { await fs.mkdir(path.dirname(target), { recursive: true }); await fs.copyFile(source, target); }
  return target;
}
async function deploy(options) {
  if (!['local', 'production'].includes(options.env)) throw new Error('Sreda: local ili production');
  const file = path.resolve(options.config ?? 'config.json');
  const config = await readConfig(file);
  const root = path.dirname(file);
  const target = path.join(root, 'deployed', options.env, `${config.name}.js`);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(path.join(root, 'dist', `${config.name}.js`), target);
  return target;
}
module.exports = { projectName, configValue, init, readConfig, build, deploy, execute };
