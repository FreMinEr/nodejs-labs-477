const globals = require('globals');
module.exports = [{ files: ['**/*.js'], languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node, ...globals.jest } }, rules: { 'no-undef': 'error', 'no-duplicate-case': 'error', 'no-unreachable': 'error', 'no-constant-condition': 'error' } }];
