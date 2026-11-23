const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { randomUUID, createHash } = require('node:crypto');
const User = require('./models/user');
const hash = value => createHash('sha256').update(value).digest('hex');
function auth(db, config, log) {
  const sessions = db.collection('sessions');
  const sign = (user, sid) => { const payload = { userId: user._id.toString(), email: user.email, role: user.role, sid }; return { accessToken: jwt.sign(payload, config.accessSecret, { algorithm: 'HS256', expiresIn: '15m', jwtid: randomUUID() }), refreshToken: jwt.sign(payload, config.refreshSecret, { algorithm: 'HS256', expiresIn: '7d', jwtid: randomUUID() }), expiresIn: 900 }; };
  const issue = async user => { const sid = randomUUID(), tokens = sign(user, sid); await sessions.insertOne({ _id: sid, userId: user._id, refreshHash: hash(tokens.refreshToken), expiresAt: new Date(Date.now() + 7 * 86400000) }); return tokens; };
  const verify = (value, secret) => { try { return jwt.verify(value, secret, { algorithms: ['HS256'] }); } catch (error) { throw Object.assign(new Error(error.name === 'TokenExpiredError' ? 'Token istek, obnovite token' : 'Nevernyi token'), { status: 401 }); } };
  return {
    issue,
    async login(data) { const user = await User.findByEmail(data.email); const valid = user?.passwordHash && await bcrypt.compare(data.password, user.passwordHash); log(`[AUTH] Login ${valid ? 'uspeh' : 'otkaz'}`); if (!valid) throw Object.assign(new Error('Nevernye uchetnye dannye'), { status: 401 }); return issue(user); },
    async refresh(value) { const payload = verify(value, config.refreshSecret); const user = await User.findById(payload.userId); if (!user) throw Object.assign(new Error('Sessiya nedostupna'), { status: 401 }); const tokens = sign(user, payload.sid); const result = await sessions.updateOne({ _id: payload.sid, refreshHash: hash(value), expiresAt: { $gt: new Date() } }, { $set: { refreshHash: hash(tokens.refreshToken), expiresAt: new Date(Date.now() + 7 * 86400000) } }); if (!result.matchedCount) throw Object.assign(new Error('Refresh token otozvan'), { status: 401 }); return tokens; },
    async logout(value) { const payload = verify(value, config.refreshSecret); await sessions.deleteOne({ _id: payload.sid, refreshHash: hash(value) }); return { loggedOut: true }; },
    async identify(value) { const payload = verify(value, config.accessSecret); if (!(await sessions.findOne({ _id: payload.sid, expiresAt: { $gt: new Date() } }))) throw Object.assign(new Error('Sessiya zavershena'), { status: 401 }); const user = await User.findById(payload.userId); if (!user) throw Object.assign(new Error('Polzovatel nedostupen'), { status: 401 }); return { userId: user._id.toString(), email: user.email, role: user.role }; },
    async middleware(ctx, next) { const value = ctx.get('Authorization'); if (!value.startsWith('Bearer ')) ctx.throw(401, 'Trebuetsya token'); ctx.user = await this.identify(value.slice(7)); await next(); }
  };
}
const requireRole = (...roles) => async (ctx, next) => { if (!roles.includes(ctx.user.role)) ctx.throw(403, 'Nedostatochno prav'); await next(); };
const owner = async (ctx, next) => { if (ctx.user.role !== 'admin' && ctx.user.userId !== ctx.params.id) ctx.throw(403, 'Nedostatochno prav'); await next(); };
module.exports = { auth, requireRole, owner };
