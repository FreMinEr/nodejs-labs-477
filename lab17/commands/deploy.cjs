const inquirer = require('inquirer');
const service = require('../services/project.cjs');
module.exports = async options => {
  if (!options.force) {
    if (!process.stdin.isTTY) throw new Error('Dlya razvertyvaniya ukazhite --force');
    const { confirmed } = await inquirer.prompt([{ type: 'confirm', name: 'confirmed', message: `Razvernut lokalnuyu kopiyu dlya ${options.env}?`, default: false }]);
    if (!confirmed) { console.log('Razvertyvanie otmeneno'); return; }
  }
  console.log(`Lokalnaya kopiya razvernuta: ${await service.deploy(options)}`);
};
