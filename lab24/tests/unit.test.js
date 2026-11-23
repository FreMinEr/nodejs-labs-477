const { makeService } = require('../src/services/userService');
const schemas = require('../src/validation');
const { documentation } = require('../src/docs');
test('Servis izolirovan: unikalnost, hash, uvedomlenie, obnovlenie i udalenie', async () => {
  const model = { findByEmail: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ _id: 'one' }), update: jest.fn().mockResolvedValue({ _id: 'one' }), delete: jest.fn().mockResolvedValue(true) }, notify = jest.fn();
  const service = makeService({ model, notify });
  await service.create({ email: 'a@example.test', password: 'password123' }); expect(model.create.mock.calls[0][1]).toMatch(/^\$2[ab]\$10\$/); expect(notify).toHaveBeenCalled();
  await service.create({ email: 'b@example.test' }); expect(model.create.mock.calls[1][1]).toBeUndefined();
  model.findByEmail.mockResolvedValue({ _id: 'other' }); await expect(service.create({ email: 'a@example.test' })).rejects.toMatchObject({ status: 409 }); await expect(service.update('one', { email: 'a@example.test' })).rejects.toMatchObject({ status: 409 });
  model.findByEmail.mockResolvedValue({ _id: 'one' }); await service.update('one', { email: 'a@example.test', password: 'password123' }); expect(model.update.mock.calls[0][2]).toMatch(/^\$2/);
  await service.update('one', { name: 'Ivan' }); model.update.mockResolvedValue(null); await expect(service.update('one', { name: 'Ivan' })).rejects.toMatchObject({ status: 404 });
  expect(await service.remove('one', true)).toEqual({ deleted: true }); model.delete.mockResolvedValue(false); await expect(service.remove('one', true)).rejects.toMatchObject({ status: 404 });
  expect(makeService()).toBeDefined();
});
test('Joi otklonyaet nekorrektnye tipy i diapazony', () => {
  for (const value of [{ name: 'X' }, { email: { $ne: null } }, { group_name: 'invalid' }, { age: 15 }, { course: 5 }, { password: 'short' }, { role: 'admin' }]) expect(() => schemas.check(schemas.create, value)).toThrow();
  for (const value of [{ page: 0 }, { limit: 101 }, { sort: '$where' }, { age_min: 25, age_max: 18 }]) expect(() => schemas.check(schemas.query, value)).toThrow();
  expect(schemas.check(schemas.register, { name: 'Ivan', email: 'I@EXAMPLE.TEST', password: 'password123' })).toMatchObject({ group_name: '477', age: 20, course: 1, email: 'i@example.test' });
  const spec = documentation([{ method: 'get', path: '/api/users', protected: false }, { method: 'put', path: '/api/users/:id', protected: true }]); expect(spec.paths['/api/users/{id}'].put.security).toBeDefined();
});
