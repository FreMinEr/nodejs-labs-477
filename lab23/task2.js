import { connect } from './config/db.js';
import { setup } from './models/student.js';
const { client, db } = await connect();
try {
  await setup(db); const c = db.collection('students'); const doc = name => ({ name, group_name: '477', course: 2, grade: 4.5, created_at: new Date() });
  const one = await c.insertOne(doc('Иван')); console.log('INSERT ONE', one);
  const many = await c.insertMany(['Мария', 'Петр', 'Олег'].map(doc)); console.log('INSERT MANY', many);
  console.log('FIND FILTER', JSON.stringify(await c.find({ group_name: '477' }).limit(10).toArray()));
  console.log('FIND SORT PAGE', JSON.stringify(await c.find().sort({ grade: -1 }).skip(1).limit(3).toArray()));
  console.log('FIND ONE', JSON.stringify(await c.findOne({ _id: one.insertedId })));
  console.log('PROJECTION', JSON.stringify(await c.find({}, { projection: { _id: 0, name: 1, grade: 1 } }).limit(5).toArray()));
  console.log('UPDATE ONE', await c.updateOne({ _id: one.insertedId }, { $set: { grade: 4.8 }, $push: { tags: 'demo' } }));
  console.log('UPDATE MANY', await c.updateMany({ _id: { $in: Object.values(many.insertedIds) } }, { $inc: { course: 1 }, $unset: { tags: '' } }));
  console.log('DELETE ONE', await c.deleteOne({ _id: one.insertedId })); console.log('DELETE MANY', await c.deleteMany({ _id: { $in: Object.values(many.insertedIds) } }));
} finally { await client.close(); }
