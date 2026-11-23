const fs = require('node:fs/promises');
const path = require('node:path');
const chalk = require('chalk');
const ora = require('ora');
const { SingleBar, Presets } = require('cli-progress');
const program = require('./utils/program.cjs')();
const { report } = require('./utils/errors.cjs');
const color = new chalk.Instance({ level: process.stdout.isTTY ? 1 : 0 });
program.command('process').requiredOption('--files <files...>', 'Faily').option('--quiet', 'Bez vyvoda pri uspehe').action(async options => {
  const tty = Boolean(process.stdout.isTTY && process.stderr.isTTY && !options.quiet);
  const spinner = ora({ text: 'Poisk failov...', isEnabled: tty, stream: process.stderr });
  if (tty) { console.error(color.blue('Nachalo obrabotki')); spinner.start(); await new Promise(resolve => setTimeout(resolve, 600)); spinner.succeed(color.green('Spisok failov poluchen')); }
  const bar = new SingleBar({ stream: process.stderr, format: 'Progress [{bar}] {percentage}% | {value}/{total} | ETA {eta}s', noTTYOutput: false }, Presets.shades_classic);
  if (tty) bar.start(options.files.length, 0);
  const results = [];
  let failed = 0;
  for (const [index, filename] of options.files.entries()) {
    try { results.push({ file: path.normalize(filename), bytes: (await fs.stat(filename)).size }); }
    catch { failed++; console.error(color.red(`Fail ne naiden: ${filename}`)); }
    if (tty) { bar.update(index + 1); await new Promise(resolve => setTimeout(resolve, 180)); }
  }
  if (tty) { bar.stop(); console.error(color.green('Obrabotka zavershena')); }
  if (failed) { console.error(color.yellow(`Propushcheno failov: ${failed}`)); process.exitCode = 1; }
  if (!options.quiet) console.log(JSON.stringify(results, null, 2));
});
program.parseAsync().catch(error => { if (!['commander.helpDisplayed', 'commander.version'].includes(error.code)) report(error); });
