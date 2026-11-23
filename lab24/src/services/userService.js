const bcrypt = require('bcryptjs');
const User = require('../models/user');
function makeService({ model = User, notify = async () => {}, log = () => {} } = {}) {
  return {
    async create(data) { log('[SERVICE] Sozdanie polzovatelya'); if (await model.findByEmail(data.email)) throw Object.assign(new Error('Email uzhe sushchestvuet'), { status: 409 }); const hash = data.password ? await bcrypt.hash(data.password, 10) : undefined; const result = await model.create(data, hash); await notify(result); return result; },
    async update(id, data) { if (data.email) { const existing = await model.findByEmail(data.email); if (existing && existing._id.toString() !== id) throw Object.assign(new Error('Email uzhe sushchestvuet'), { status: 409 }); } const hash = data.password ? await bcrypt.hash(data.password, 10) : undefined; const result = await model.update(id, data, hash); if (!result) throw Object.assign(new Error('Polzovatel ne naiden'), { status: 404 }); return result; },
    async remove(id, soft) { if (!(await model.delete(id, soft))) throw Object.assign(new Error('Polzovatel ne naiden'), { status: 404 }); return { deleted: true }; }
  };
}
module.exports = { makeService };
