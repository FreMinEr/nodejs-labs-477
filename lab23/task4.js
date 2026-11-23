import { ObjectId } from 'mongodb';
import { connect } from './config/db.js';
import { setup } from './models/student.js';
const { client, db } = await connect();
try {
  await setup(db); const status = await db.admin().command({ replSetGetStatus: 1 }); console.log('REPLICA', JSON.stringify({ set: status.set, members: status.members.map(m => ({ name: m.name, state: m.stateStr })) }));
  const c = db.collection('students');
  for (const fail of [false, true]) {
    const session = client.startSession(), id = new ObjectId();
    try { session.startTransaction(); await c.insertOne({ _id: id, name: 'Ivan transaction', group_name: '477', course: 2, grade: 4 }, { session }); await c.insertOne({ _id: fail ? id : new ObjectId(), name: 'Maria transaction', group_name: '477', course: 2, grade: 4 }, { session }); await c.updateOne({ _id: id }, { $set: { grade: 4.8 } }, { session }); await session.commitTransaction(); console.log('TRANSACTION COMMIT'); }
    catch (error) { await session.abortTransaction(); console.log(`TRANSACTION ABORT code=${error.code}`); }
    finally { await session.endSession(); }
    console.log(`CHECK rollback=${fail}, saved=${await c.countDocuments({ _id: id })}`);
  }
  const watch = c.watch([], { fullDocument: 'updateLookup', maxAwaitTimeMS: 500 });
  const observed = (async () => { let count = 0; for await (const change of watch) { console.log('CHANGE', change.operationType, JSON.stringify(change.documentKey)); if (++count === 4) break; } })();
  await new Promise(resolve => setTimeout(resolve, 500));
  const { insertedId } = await c.insertOne({ name: 'Anna watch', group_name: '477', course: 2 });
  await c.updateOne({ _id: insertedId }, { $set: { grade: 5 } }); await c.replaceOne({ _id: insertedId }, { name: 'Anna replaced', group_name: '477', course: 3 }); await c.deleteOne({ _id: insertedId });
  const timer = setTimeout(() => watch.close(), 5000); await observed; clearTimeout(timer); await watch.close(); console.log('WATCH zakryt');
  for (const readPreference of ['primary', 'primaryPreferred', 'secondaryPreferred', 'nearest']) { const start = performance.now(); await c.findOne({}, { readPreference }); console.log(`READ ${readPreference}: ${(performance.now() - start).toFixed(2)} ms; odin primary, secondary net`); }
  console.log('READ secondary: ne vypolnyaetsya, v odnouzlovom rs0 net secondary');
} finally { await client.close(); }
