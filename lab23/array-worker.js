import { MongoClient } from 'mongodb';
const client = new MongoClient(process.env.MONGODB_URI);
try { await client.connect(); console.log('toArray: million dokumentov, heap limit 48 MiB'); const data = await client.db(process.env.DB_NAME ?? 'lab477').collection('big_data').find().toArray(); console.log(data.length); } finally { await client.close(); }
