#!/usr/bin/env node
const program = require('../utils/program.cjs')();
const errors = require('../utils/errors.cjs');
const init = require('../commands/init.cjs');
const build = require('../commands/build.cjs');
const deploy = require('../commands/deploy.cjs');
const test = require('../commands/test.cjs');
errors.install();
program.command('init').description('Sozdat proekt').option('--name <name>', 'Imya').option('--type <type>', 'Tip', 'cli').option('--git', 'Git').option('--no-interactive', 'Bez dialoga').action(init);
program.command('build').description('Sobrat proekt').option('--config <path>', 'Konfiguraciya', 'config.json').option('--dry-run', 'Bez zapisi').action(build);
program.command('test').description('Proverit proekt').option('--config <path>', 'Konfiguraciya', 'config.json').action(test);
program.command('deploy').description('Razvernut lokalnuyu kopiyu sborki').option('--config <path>', 'Konfiguraciya', 'config.json').option('--env <env>', 'Sreda', 'local').option('--force', 'Bez podtverzhdeniya').action(deploy);
program.parseAsync().catch(error => { if (!['commander.helpDisplayed', 'commander.version'].includes(error.code)) errors.report(error); });
