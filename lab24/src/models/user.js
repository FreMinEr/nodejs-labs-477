const { ObjectId } = require('mongodb');
const schemas = require('../validation');
const projection = { passwordHash: 0 };
class User {
  static bind(db) { this.db = db; this.collection = db.collection('users'); }
  static id(value) { if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) throw Object.assign(new Error('Polzovatel ne naiden'), { status: 404 }); return new ObjectId(value); }
  static filter(options) {
    const filter = { deleted_at: null };
    if (options.group_name) filter.group_name = options.group_name;
    if (options.course !== undefined) filter.course = options.course;
    if (options.age_min !== undefined || options.age_max !== undefined) { filter.age = {}; if (options.age_min !== undefined) filter.age.$gte = options.age_min; if (options.age_max !== undefined) filter.age.$lte = options.age_max; }
    if (options.search || options.q) filter.$text = { $search: options.search || options.q };
    return filter;
  }
  static async findAll(options = {}) {
    const { page = 1, limit = 10, sort } = options, filter = this.filter(options);
    const order = sort ? { [sort.replace(/^-/, '')]: sort.startsWith('-') ? -1 : 1, _id: 1 } : filter.$text ? { score: { $meta: 'textScore' } } : { _id: 1 };
    const selected = filter.$text ? { ...projection, score: { $meta: 'textScore' } } : projection;
    const total = await this.collection.countDocuments(filter);
    const data = await this.collection.find(filter, { projection: selected }).sort(order).skip((page - 1) * limit).limit(limit).toArray();
    return { data, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
  static async findById(id, secret = false) { return this.collection.findOne({ _id: this.id(id), deleted_at: null }, { projection: secret ? {} : projection }); }
  static async findByEmail(email) { return this.collection.findOne({ email, deleted_at: null }); }
  static async create(data, passwordHash) { const checked = schemas.check(schemas.create, data); delete checked.password; const doc = { ...checked, role: 'user', created_at: new Date(), deleted_at: null, ...(passwordHash ? { passwordHash } : {}) }; await this.collection.insertOne(doc); return this.findById(doc._id.toString()); }
  static async update(id, data, passwordHash) { const checked = schemas.check(schemas.update, data); delete checked.password; if (passwordHash) checked.passwordHash = passwordHash; return this.collection.findOneAndUpdate({ _id: this.id(id), deleted_at: null }, { $set: checked }, { returnDocument: 'after', projection }); }
  static async delete(id, soft = true) { const filter = { _id: this.id(id), deleted_at: null }; return soft ? (await this.collection.updateOne(filter, { $set: { deleted_at: new Date() } })).matchedCount === 1 : (await this.collection.deleteOne(filter)).deletedCount === 1; }
  static async stats() { const summary = await this.collection.aggregate([{ $match: { deleted_at: null } }, { $group: { _id: null, total: { $sum: 1 }, averageAge: { $avg: '$age' } } }]).toArray(); const count = async field => Object.fromEntries((await this.collection.aggregate([{ $match: { deleted_at: null } }, { $group: { _id: '$' + field, count: { $sum: 1 } } }]).toArray()).map(v => [String(v._id), v.count])); return { ...(summary[0] || { total: 0, averageAge: null }), byGroup: await count('group_name'), byCourse: await count('course') }; }
  static async export(options = {}) { return this.collection.find(this.filter(options), { projection }).limit(10000).toArray(); }
}
module.exports = User;
