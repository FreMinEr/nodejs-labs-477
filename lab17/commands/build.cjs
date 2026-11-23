const service = require('../services/project.cjs');
module.exports = async options => console.log(`${options.dryRun ? 'DRY-RUN' : 'Sborka zavershena'}: ${await service.build(options)}`);
