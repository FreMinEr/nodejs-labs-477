const { MongoClient } = require('mongodb');
const migrate = require('../migrations/001-users');
async function connect(uri, name) { const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, maxPoolSize: 10 }); try { await client.connect(); const db = client.db(name); await migrate(db); return { client, db }; } catch (error) { await client.close(); throw error; } }
module.exports = { connect };
