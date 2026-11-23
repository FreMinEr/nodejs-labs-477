export function validate(data, partial = false) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Object.assign(new Error('Nuzhen obekt'), { status: 400 });
  const allowed = ['name', 'group_name', 'course', 'grade', 'email'];
  if (!Object.keys(data).length || Object.keys(data).some(k => !allowed.includes(k))) throw Object.assign(new Error('Nevernye polya'), { status: 400 });
  if ((!partial || 'name' in data) && (typeof data.name !== 'string' || data.name.length < 2 || data.name.length > 100)) throw Object.assign(new Error('name: ot 2 do 100 simvolov'), { status: 400 });
  if ((!partial || 'group_name' in data) && (typeof data.group_name !== 'string' || !/^(?:\d{3}|ББМО-\d{2}-\d{2})$/.test(data.group_name))) throw Object.assign(new Error('Nevernaya gruppa'), { status: 400 });
  if ((!partial || 'course' in data) && (!Number.isInteger(data.course) || data.course < 1 || data.course > 4)) throw Object.assign(new Error('course: ot 1 do 4'), { status: 400 });
  if (data.grade !== undefined && data.grade !== null && (typeof data.grade !== 'number' || !Number.isFinite(data.grade) || data.grade < 0 || data.grade > 5)) throw Object.assign(new Error('grade: ot 0 do 5'), { status: 400 });
  if (data.email !== undefined && (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))) throw Object.assign(new Error('Nevernyi email'), { status: 400 });
  return data;
}
export async function setup(db) {
  const validator = { $jsonSchema: { bsonType: 'object', required: ['name', 'group_name', 'course'], properties: { name: { bsonType: 'string', minLength: 2, maxLength: 100 }, group_name: { bsonType: 'string', pattern: '^(?:[0-9]{3}|ББМО-[0-9]{2}-[0-9]{2})$' }, course: { bsonType: ['int', 'double'], minimum: 1, maximum: 4 }, grade: { bsonType: ['int', 'double', 'null'], minimum: 0, maximum: 5 } } } };
  if ((await db.listCollections({ name: 'students' }).toArray()).length) await db.command({ collMod: 'students', validator }); else await db.createCollection('students', { validator });
  const c = db.collection('students'); await c.createIndex({ group_name: 1 }); await c.createIndex({ name: 'text' }); await c.createIndex({ email: 1 }, { unique: true, sparse: true });
}
