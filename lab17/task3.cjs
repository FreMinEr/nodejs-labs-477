const program = require('./utils/program.cjs')();
const init = require('./commands/init.cjs');
const { report } = require('./utils/errors.cjs');
program.command('init').description('Sozdat proekt').option('--name <name>', 'Imya').option('--type <type>', 'Tip').option('--typescript', 'TypeScript').option('--eslint', 'ESLint').option('--prettier', 'Prettier').option('--jest', 'Jest').option('--git', 'Git').option('--no-interactive', 'Bez dialoga').action(init);
program.parseAsync().catch(error => { if (!['commander.helpDisplayed', 'commander.version'].includes(error.code)) report(error); });
