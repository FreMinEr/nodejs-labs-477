import { ObjectId } from 'mongodb';
import { validate } from '../models/student.js';
export class StudentDAO {
  constructor(db, client) { this.collection = db.collection('students'); this.client = client; }
  id(value) { if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) throw Object.assign(new Error('Nevernyi ObjectId'), { status: 400 }); return new ObjectId(value); }
  async create(data, session) { validate(data); const doc = { ...data, created_at: new Date() }; await this.collection.insertOne(doc, { session }); return doc; }
  async findById(id) { return this.collection.findOne({ _id: this.id(id) }); }
  async findAll(options = {}) {
    const limit = Number(options.limit ?? 10), offset = Number(options.offset ?? 0);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) throw Object.assign(new Error('Nevernaya paginaciya'), { status: 400 });
    const filter = {}; if (options.group_name !== undefined) { if (typeof options.group_name !== 'string') throw Object.assign(new Error('Nevernaya gruppa'), { status: 400 }); filter.group_name = options.group_name; }
    if (options.course !== undefined) { const course = Number(options.course); if (!Number.isInteger(course) || course < 1 || course > 4) throw Object.assign(new Error('Nevernyi course'), { status: 400 }); filter.course = course; }
    const sorts = { name: { name: 1 }, '-name': { name: -1 }, grade: { grade: 1 }, '-grade': { grade: -1 }, '-created_at': { created_at: -1 } };
    if (options.sort && !sorts[options.sort]) throw Object.assign(new Error('Nevernaya sortirovka'), { status: 400 });
    const total = await this.collection.countDocuments(filter); const data = await this.collection.find(filter).sort(sorts[options.sort] ?? { _id: 1 }).skip(offset).limit(limit).toArray(); return { data, pagination: { total, limit, offset, pages: Math.ceil(total / limit) } };
  }
  async update(id, data) { validate(data, true); return this.collection.findOneAndUpdate({ _id: this.id(id) }, { $set: data }, { returnDocument: 'after' }); }
  async delete(id) { return (await this.collection.deleteOne({ _id: this.id(id) })).deletedCount === 1; }
  async search(query) { if (typeof query !== 'string' || !query.trim()) throw Object.assign(new Error('Nuzhen poiskovyi zapros'), { status: 400 }); return this.collection.find({ $text: { $search: query } }, { projection: { score: { $meta: 'textScore' } } }).sort({ score: { $meta: 'textScore' } }).limit(100).toArray(); }
  async getStats() { const summary = await this.collection.aggregate([{ $group: { _id: null, total: { $sum: 1 }, averageGrade: { $avg: '$grade' } } }]).toArray(); const groups = await this.collection.aggregate([{ $group: { _id: '$group_name', count: { $sum: 1 } } }]).toArray(); return { ...(summary[0] ?? { total: 0, averageGrade: null }), byGroup: Object.fromEntries(groups.map(g => [g._id, g.count])) }; }
  async batchCreate(records) {
    if (!Array.isArray(records) || !records.length || records.length > 100) throw Object.assign(new Error('Ot 1 do 100 studentov'), { status: 400 });
    const session = this.client.startSession();
    try { session.startTransaction(); const data = []; for (const record of records) data.push(await this.create(record, session)); await session.commitTransaction(); return { inserted: data.length, transaction: 'committed', data }; }
    catch (error) { await session.abortTransaction(); error.transaction = 'aborted'; throw error; }
    finally { await session.endSession(); }
  }
}
