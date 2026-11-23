const { Command } = require('commander');
module.exports = function program() {
  const cli = new Command();
  cli.name('my-cli').description('CLI dlya laboratornoi raboty 17').version('1.0.0').helpOption('-h, --help', 'Pokazat spravku').option('-v, --verbose', 'Podrobnyi vyvod');
  cli.exitOverride();
  cli.configureOutput({ writeErr: message => process.stderr.write(`Oshibka CLI: ${message}`) });
  return cli;
};
