import { StudentDAO } from '../models/student-dao.js';
export async function batch(db, records) {
  if (!Array.isArray(records) || !records.length || records.length > 100) throw Object.assign(new Error('Nuzhno ot 1 do 100 studentov'), { status: 400 });
  const connection = await db.getConnection();
  try { await connection.beginTransaction(); const dao = new StudentDAO(connection); const data = []; for (const record of records) data.push(await dao.create(record)); await connection.commit(); return { created: data.length, transaction: 'committed', data }; }
  catch (error) { await connection.rollback(); error.transaction = 'rolled_back'; throw error; }
  finally { connection.release(); }
}
