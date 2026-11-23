import { pool } from './config/db.js';
import { migrate } from './migrate.js';
const db = pool();
try {
  await migrate(db); console.log('Tablica students sozdana');
  const [one] = await db.execute('INSERT INTO students(name,group_name,course,grade) VALUES(?,?,?,?)', ['Иван', '477', 2, 4.5]); console.log('INSERT', { insertId: one.insertId, affectedRows: one.affectedRows });
  const [many] = await db.query('INSERT INTO students(name,group_name,course,grade) VALUES ?', [[['Мария', '477', 2, 3.8], ['Петр', '477', 3, 4.2], ['Олег', '478', 1, 3.5]]]); console.log('INSERT many', { insertId: many.insertId, affectedRows: many.affectedRows });
  console.log('SELECT vse', (await db.query('SELECT * FROM students ORDER BY id LIMIT 10'))[0]);
  console.log('SELECT filtr sort', (await db.execute('SELECT name,grade FROM students WHERE group_name=? ORDER BY grade DESC LIMIT 5 OFFSET 0', ['477']))[0]);
  for (let i = 0; i < 2; i++) { const [result] = await db.execute('UPDATE students SET grade=? WHERE id=?', [4.8, one.insertId]); console.log('UPDATE', { affectedRows: result.affectedRows, changedRows: result.changedRows }); }
  console.log('DELETE', (await db.execute('DELETE FROM students WHERE id=?', [one.insertId]))[0].affectedRows);
  await db.execute('INSERT INTO students(name,group_name,course) VALUES(?,?,?)', ['Demo', 'DEL-DEMO', 1]); console.log('DELETE gruppa demo', (await db.execute('DELETE FROM students WHERE group_name=?', ['DEL-DEMO']))[0].affectedRows);
  const injection = "' OR '1'='1";
  console.log('INJECTION uchebnyi SELECT concatenation', (await db.query("SELECT COUNT(*) total FROM students WHERE name='" + injection + "'"))[0]);
  console.log('INJECTION placeholders', (await db.execute('SELECT COUNT(*) total FROM students WHERE name=?', [injection]))[0]);
} finally { await db.end(); }
