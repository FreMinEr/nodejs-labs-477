import { EventEmitter } from 'node:events';
export class DatabaseConnection extends EventEmitter {
  connected = false;
  students = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `Student ${i + 1}`, group: '477' }));
  connect() { this.connected = true; this.emit('connect'); }
  query(sql) {
    if (!this.connected) return this.error(new Error('Soedinenie ne ustanovleno'));
    let result;
    if (sql === 'SELECT * FROM students') result = this.students.map(item => ({ ...item }));
    else if (sql === 'INSERT INTO students') { const student = { id: this.students.length + 1, name: 'Ivan', group: '477' }; this.students.push(student); result = { inserted: 1, student }; }
    else return this.error(new Error('Zapros ne podderzhivaetsya uchebnoi modelyu'));
    this.emit('query', sql, result);
    return result;
  }
  close() { this.connected = false; this.emit('close'); }
  error(error) { return this.emit('error', error); }
}
