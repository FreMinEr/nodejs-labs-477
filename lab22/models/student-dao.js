export class StudentDAO {
  constructor(db) { this.db = db; }
  validate(data, partial = false) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw Object.assign(new Error('Nuzhen obekt'), { status: 400 });
    const allowed = ['name', 'group_name', 'course', 'grade'];
    if (Object.keys(data).some(k => !allowed.includes(k))) throw Object.assign(new Error('Neizvestnoe pole'), { status: 400 });
    if (!partial || 'name' in data) if (typeof data.name !== 'string' || data.name.trim().length < 2 || data.name.trim().length > 100) throw Object.assign(new Error('name: ot 2 do 100 simvolov'), { status: 400 });
    if (!partial || 'group_name' in data) if (typeof data.group_name !== 'string' || !/^(?:\d{3}|ББМО-\d{2}-\d{2})$/.test(data.group_name)) throw Object.assign(new Error('group_name: 477 ili BBMO-XX-XX'), { status: 400 });
    if (!partial || 'course' in data) if (!Number.isInteger(data.course) || data.course < 1 || data.course > 4) throw Object.assign(new Error('course: celoe ot 1 do 4'), { status: 400 });
    if (data.grade !== undefined && data.grade !== null && (typeof data.grade !== 'number' || !Number.isFinite(data.grade) || data.grade < 0 || data.grade > 5)) throw Object.assign(new Error('grade: ot 0 do 5 ili null'), { status: 400 });
    return data;
  }
  async create(data) { this.validate(data); const [result] = await this.db.execute('INSERT INTO students(name,group_name,course,grade) VALUES(?,?,?,?)', [data.name.trim(), data.group_name, data.course, data.grade ?? null]); return this.findById(result.insertId); }
  async findById(id) { if (!Number.isInteger(Number(id)) || Number(id) < 1) throw Object.assign(new Error('Nevernyi id'), { status: 400 }); const [rows] = await this.db.execute('SELECT * FROM students WHERE id=?', [Number(id)]); return rows[0] ?? null; }
  async findAll(options = {}) {
    const limit = Number(options.limit ?? 10), offset = Number(options.offset ?? 0);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) throw Object.assign(new Error('Nevernaya paginaciya'), { status: 400 });
    const conditions = [], params = [];
    for (const [key, sql] of [['group_name', 'group_name=?'], ['course', 'course=?'], ['grade_min', 'grade>=?'], ['grade_max', 'grade<=?']]) if (options[key] !== undefined) { if (key !== 'group_name' && !Number.isFinite(Number(options[key]))) throw Object.assign(new Error('Nevernyi filtr'), { status: 400 }); conditions.push(sql); params.push(options[key]); }
    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const sorts = { name: 'name ASC', '-name': 'name DESC', grade: 'grade ASC', '-grade': 'grade DESC', created_at: 'created_at ASC', '-created_at': 'created_at DESC' };
    if (options.sort && !sorts[options.sort]) throw Object.assign(new Error('Nevernaya sortirovka'), { status: 400 });
    const [[{ total }]] = await this.db.execute('SELECT COUNT(*) total FROM students' + where, params);
    const [data] = await this.db.query(`SELECT * FROM students${where} ORDER BY ${sorts[options.sort] ?? 'id ASC'}, id ASC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    return { data, pagination: { total, limit, offset, page: Math.floor(offset / limit) + 1, pages: Math.ceil(total / limit) } };
  }
  async update(id, data) { this.validate(data, true); if (!Object.keys(data).length) throw Object.assign(new Error('Pustoe obnovlenie'), { status: 400 }); if (!(await this.findById(id))) return null; const keys = Object.keys(data); await this.db.execute(`UPDATE students SET ${keys.map(k => k + '=?').join(',')} WHERE id=?`, [...keys.map(k => data[k]), Number(id)]); return this.findById(id); }
  async delete(id) { const found = await this.findById(id); if (!found) return false; await this.db.execute('DELETE FROM students WHERE id=?', [Number(id)]); return true; }
  async search(query) { const [rows] = await this.db.execute('SELECT * FROM students WHERE LOCATE(?,name)>0 ORDER BY id LIMIT 100', [String(query)]); return rows; }
  async getStats() { const [[summary]] = await this.db.query('SELECT COUNT(*) total, AVG(grade) averageGrade, MIN(grade) minGrade, MAX(grade) maxGrade FROM students'); const [groups] = await this.db.query('SELECT group_name,COUNT(*) total FROM students GROUP BY group_name'); const [courses] = await this.db.query('SELECT course,COUNT(*) total FROM students GROUP BY course'); return { ...summary, byGroup: Object.fromEntries(groups.map(x => [x.group_name, x.total])), byCourse: Object.fromEntries(courses.map(x => [x.course, x.total])) }; }
}
