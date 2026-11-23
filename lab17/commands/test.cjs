const path = require('node:path');
const service = require('../services/project.cjs');
module.exports = async options => {
  const config = path.resolve(options.config ?? 'config.json');
  await service.readConfig(config);
  await service.execute('node', ['--test'], path.dirname(config));
  console.log('Testy proekta proideny');
};
