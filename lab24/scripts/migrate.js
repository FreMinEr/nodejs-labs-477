const { connect } = require('../src/db');
(async () => { const { client } = await connect(process.env.MONGODB_URI, process.env.DB_NAME || 'lab24'); await client.close(); console.log('Migraciya 001-users primenena'); })().catch(error => { console.error(`Oshibka: ${error.message}`); process.exitCode = 1; });
