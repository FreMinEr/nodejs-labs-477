const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const service = require('../services/project.cjs');
const bin = path.resolve(__dirname, '../bin/my-cli.cjs');

describe('Servisy bez terminalnogo vvoda', function () {
  it('Prinimaet korrektnoe imya', () => assert.equal(service.projectName('my-app'), 'my-app'));
  it('Otklonyaet vyhod za papku', () => assert.throws(() => service.projectName('../other')));
  it('Otklonyaet pustoe imya', () => assert.throws(() => service.projectName('')));
  it('Proveryaet tip', () => assert.throws(() => service.configValue({ name: 'app', type: 'unknown' })));
  it('Prinimaet konfiguraciyu', () => assert.equal(service.configValue({ name: 'app', type: 'cli' }).type, 'cli'));
});
describe('Integraciya CLI', function () {
  this.timeout(20000);
  let root;
  before(async () => { root = await fs.mkdtemp(path.join(os.tmpdir(), 'lab17-test-')); });
  after(async () => { await fs.rm(root, { recursive: true, force: true }); });
  function run(args, env = {}) { return spawnSync(process.execPath, [bin, ...args], { cwd: root, encoding: 'utf8', input: '', env: { ...process.env, ...env } }); }
  it('Spravka', () => { const r = run(['--help']); assert.equal(r.status, 0); assert.match(r.stdout, /init/); });
  it('Versiya', () => assert.equal(run(['--version']).stdout.trim(), '1.0.0'));
  it('Neizvestnaya komanda', () => assert.equal(run(['unknown']).status, 1));
  it('Init sozdaet konfiguraciyu', async () => { assert.equal(run(['init', '--name', 'demo', '--type', 'cli', '--no-interactive']).status, 0); assert.equal(JSON.parse(await fs.readFile(path.join(root, 'demo/config.json'))).name, 'demo'); });
  it('Dry-run ne sozdaet dist', async () => { assert.equal(run(['build', '--config', 'demo/config.json', '--dry-run']).status, 0); await assert.rejects(fs.access(path.join(root, 'demo/dist'))); });
  it('Build kopiruet ishodnik', async () => { assert.equal(run(['build', '--config', 'demo/config.json']).status, 0); assert.equal(await fs.readFile(path.join(root, 'demo/src/index.js'), 'utf8'), await fs.readFile(path.join(root, 'demo/dist/demo.js'), 'utf8')); });
  it('Test proekta', () => assert.equal(run(['test', '--config', 'demo/config.json']).status, 0));
  it('Deploy bez soglasiya otklonyaetsya', () => assert.equal(run(['deploy', '--config', 'demo/config.json']).status, 1));
  it('Deploy s force sozdaet kopiyu', async () => { assert.equal(run(['deploy', '--config', 'demo/config.json', '--force']).status, 0); await fs.access(path.join(root, 'demo/deployed/local/demo.js')); });
  it('Production skryvaet stek', () => { const r = run(['build'], { NODE_ENV: 'production' }); assert.equal(r.status, 1); assert.doesNotMatch(r.stderr, /at readConfig/); });
  it('Development pokazyvaet stek', () => { const r = run(['build'], { NODE_ENV: 'development' }); assert.equal(r.status, 1); assert.match(r.stderr, /at /); });
  it('Commander exit perehvachen', () => { const { Command } = require('commander'); const command = new Command(); command.exitOverride(); command.configureOutput({ writeOut() {}, writeErr() {} }); assert.throws(() => command.parse(['node', 'cli', '--help']), error => error.code === 'commander.helpDisplayed'); });
});

