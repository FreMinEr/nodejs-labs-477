import { pool } from './config/db.js';
import { migrate } from './migrate.js';
import { StudentDAO } from './models/student-dao.js';
const db = pool(), dao = new StudentDAO(db);
try {
  await migrate(db);
  console.log('CREATE', await dao.create({ name: 'Иван', group_name: '477', course: 2, grade: 4.5 }));
  for (const data of [{ name: 'A', group_name: '477', course: 2 }, { name: 'Ivan', group_name: 'bad', course: 2 }]) try { await dao.create(data); } catch (error) { console.log('VALIDATION', error.message); }
  for (let i = 1; i <= 30; i++) await dao.create({ name: `Student ${i}`, group_name: i % 2 ? '477' : '478', course: 1 + i % 4, grade: 2 + (i % 30) / 10 });
  console.log('PAGINATION', JSON.stringify(await dao.findAll({ limit: 5, offset: 5 })));
  console.log('FILTER', JSON.stringify(await dao.findAll({ group_name: '477', course: 2, grade_min: 3, grade_max: 5, sort: '-grade' })));
  console.log('SEARCH', JSON.stringify(await dao.search('Иван')));
  console.log('STATS', JSON.stringify(await dao.getStats()));
} finally { await db.end(); }
