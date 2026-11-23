const inquirer = require('inquirer');
const service = require('../services/project.cjs');
module.exports = async function init(options) {
  let piped = '';
  if (!process.stdin.isTTY && !options.name) for await (const chunk of process.stdin) piped += chunk;
  if (!options.name && piped.trim()) options.name = piped.trim();
  const interactive = options.interactive !== false && Boolean(process.stdin.isTTY);
  if (interactive && (!options.name || !options.type)) {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'name', message: 'Nazvanie proekta:', default: options.name, validate: value => { try { service.projectName(value); return true; } catch (error) { return error.message; } } },
      { type: 'list', name: 'type', message: 'Tip proekta:', choices: ['web', 'cli', 'library', 'microservice'] },
      { type: 'checkbox', name: 'features', message: 'Dopolnitelnye opcii:', choices: ['TypeScript', 'ESLint', 'Prettier', 'Jest'] },
      { type: 'confirm', name: 'git', message: 'Ispolzovat Git?', default: true },
      { type: 'password', name: 'token', message: 'Token dostupa (ne sohranyaetsya):', mask: '*' }
    ]);
    options = { ...options, ...answers };
  }
  if (!options.name || !options.type) throw new Error('V neinteraktivnom rezhime ukazhite --name i --type');
  options.features ??= ['typescript', 'eslint', 'prettier', 'jest'].filter(key => options[key]);
  const root = await service.init(options);
  console.log(`Proekt sozdan: ${root}\nTip: ${options.type}\nOpcii: ${options.features.join(', ') || 'net'}\nGit: ${options.git ? 'da' : 'net'}`);
};

