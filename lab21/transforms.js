import { Transform } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';
export class UpperCaseTransform extends Transform {
  constructor() { super({ readableObjectMode: true }); this.decoder = new StringDecoder('utf8'); this.pending = ''; }
  consume(text, final = false) { this.pending += text; const lines = this.pending.split('\n'); this.pending = lines.pop(); for (const line of lines) this.push(`[477] ${line.toUpperCase()}\n`); if (final && this.pending) this.push(`[477] ${this.pending.toUpperCase()}\n`); }
  _transform(chunk, encoding, callback) { this.consume(this.decoder.write(chunk)); callback(); }
  _flush(callback) { this.consume(this.decoder.end(), true); callback(); }
}
export class JsonParserTransform extends Transform {
  constructor() { super({ readableObjectMode: true }); this.decoder = new StringDecoder('utf8'); this.pending = ''; }
  parse(line) { if (line.trim()) this.push(JSON.parse(line)); }
  _transform(chunk, encoding, callback) { try { this.pending += this.decoder.write(chunk); const lines = this.pending.split('\n'); this.pending = lines.pop(); for (const line of lines) this.parse(line); callback(); } catch (error) { callback(new Error(`Nevernyi JSON: ${error.message}`)); } }
  _flush(callback) { try { this.parse(this.pending + this.decoder.end()); callback(); } catch (error) { callback(error); } }
}
export class FilterTransform extends Transform {
  constructor(predicate) { super({ objectMode: true, highWaterMark: 16 }); this.predicate = predicate; }
  _transform(value, encoding, callback) { try { if (this.predicate(value)) this.push(value); callback(); } catch (error) { callback(error); } }
}
