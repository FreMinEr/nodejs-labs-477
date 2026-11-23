const Joi = require('joi');
const group = Joi.string().pattern(/^(?:\d{3}|ББМО-\d{2}-\d{2})$/);
const fields = { name: Joi.string().trim().min(2).max(100), email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }), group_name: group, age: Joi.number().integer().min(16).max(100), course: Joi.number().integer().min(1).max(4), password: Joi.string().min(8).max(72) };
const create = Joi.object({ ...fields, name: fields.name.required(), email: fields.email.required(), group_name: group.required() });
const update = Joi.object(fields).min(1);
const register = Joi.object({ ...fields, name: fields.name.required(), email: fields.email.required(), password: fields.password.required(), group_name: group.default('477'), age: fields.age.default(20), course: fields.course.default(1) });
const login = Joi.object({ email: fields.email.required(), password: Joi.string().max(72).required() });
const token = Joi.object({ refreshToken: Joi.string().required() });
const query = Joi.object({ page: Joi.number().integer().min(1).default(1), limit: Joi.number().integer().min(1).max(100).default(10), sort: Joi.string().valid('name', '-name', 'age', '-age', 'created_at', '-created_at'), group_name: group, course: fields.course, age_min: fields.age, age_max: fields.age, search: Joi.string().max(100), q: Joi.string().max(100), format: Joi.string().valid('csv', 'json') });
function check(schema, value) {
  const result = schema.validate(value, { abortEarly: false });
  if (result.error) throw Object.assign(new Error('Oshibka validacii'), { status: 400, details: result.error.details.map(d => ({ field: d.path.join('.'), message: `Nevernoe znachenie (${d.type})` })) });
  if (result.value.age_min !== undefined && result.value.age_max !== undefined && result.value.age_min > result.value.age_max) throw Object.assign(new Error('Nevernyi diapazon vozrasta'), { status: 400 });
  return result.value;
}
module.exports = { create, update, register, login, token, query, check };
