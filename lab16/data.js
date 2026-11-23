import Joi from 'joi';

export const genres = ['roman', 'fantastika', 'detektiv', 'poeziya', 'nauka'];
export function isbnFor(number) {
  const prefix = `978${String(number).padStart(9, '0')}`;
  const sum = [...prefix].reduce((sum, digit, index) => sum + Number(digit) * (index % 2 ? 3 : 1), 0);
  return prefix + (10 - sum % 10) % 10;
}
export function validISBN(value) {
  return /^\d{13}$/.test(value) && [...value].reduce((sum, digit, index) => sum + Number(digit) * (index % 2 ? 3 : 1), 0) % 10 === 0;
}
export function generateBooks(count) {
  const titles = ['Voina i mir', 'Master i Margarita', 'Duna', 'Solaris', 'Hobbit', '1984', 'Prestuplenie i nakazanie', 'Evgenii Onegin', 'Ostrov sokrovishch', 'Vokrug sveta'];
  const authors = ['Lev Tolstoi', 'Mihail Bulgakov', 'Frenk Herbert', 'Stanislav Lem', 'Dzhon Tolkin', 'Dzhordzh Oruell', 'Fedor Dostoevskii', 'Aleksandr Pushkin', 'Robert Stivenson', 'Zhyul Vern'];
  const seed = Number(process.env.STUDENT_GROUP ?? 477);
  return Array.from({ length: count }, (_, i) => ({ id: i + 1, title: `${titles[i % 10]}${i >= 10 ? `, izdanie ${Math.floor(i / 10) + 1}` : ''}`, author: authors[i % 10], year: 1800 + (seed + i * 7) % 225, genre: genres[i % 5], isbn: isbnFor(seed * 1000 + i), available: i % 3 !== 0, reviews: [] }));
}
export function fail(status, message) { throw Object.assign(new Error(message), { status }); }
export function checked(schema, body) {
  const { value, error } = schema.validate(body, { abortEarly: false, convert: false });
  if (error) fail(400, `Oshibka validacii: ${error.details.map(item => item.path.join('.')).join(', ') || 'telo zaprosa'}`);
  return value;
}
export function bookSchema(stage, partial = false) {
  let fields = { title: Joi.string().trim().min(1).max(200), author: Joi.string().trim().min(1).max(120), year: Joi.number().integer().min(1).max(new Date().getFullYear()) };
  if (stage >= 4) fields.genre = Joi.string().valid(...genres);
  if (stage === 5) {
    fields.isbn = Joi.string().custom((value, helpers) => validISBN(value) ? value : helpers.error('any.invalid'));
    fields.available = Joi.boolean();
  }
  if (!partial) for (const key of Object.keys(fields)) fields[key] = fields[key].required();
  return Joi.object(fields).min(1).required();
}
export function selection(books, query) {
  const allowed = ['author', 'year', 'yearFrom', 'yearTo', 'limit', 'page', 'sort', 'search', 'genre'];
  if (Object.keys(query).some(key => !allowed.includes(key))) fail(400, 'Neizvestnyi parametr');
  let result = [...books];
  for (const key of ['year', 'yearFrom', 'yearTo', 'limit', 'page']) {
    if (query[key] !== undefined && (!/^\d+$/.test(query[key]) || Number(query[key]) < 1)) fail(400, `Nevernyi parametr: ${key}`);
  }
  if (query.yearFrom && query.yearTo && Number(query.yearFrom) > Number(query.yearTo)) fail(400, 'Nevernyi diapazon let');
  if (query.author) result = result.filter(book => book.author.toLowerCase().includes(String(query.author).toLowerCase()));
  if (query.year) result = result.filter(book => book.year === Number(query.year));
  if (query.yearFrom) result = result.filter(book => book.year >= Number(query.yearFrom));
  if (query.yearTo) result = result.filter(book => book.year <= Number(query.yearTo));
  if (query.genre) result = result.filter(book => book.genre === query.genre);
  if (query.search) result = result.filter(book => `${book.title} ${book.author}`.toLowerCase().includes(String(query.search).toLowerCase()));
  const sort = query.sort ?? 'id';
  if (!['id', 'title', '-title', 'year', '-year', 'author', '-author'].includes(sort)) fail(400, 'Nevernaya sortirovka');
  const field = sort.replace(/^-/, '');
  result.sort((a, b) => (typeof a[field] === 'string' ? a[field].localeCompare(b[field], 'en') : a[field] - b[field]) * (sort.startsWith('-') ? -1 : 1));
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);
  if (!Number.isSafeInteger(page) || limit > 100) fail(400, 'Nevernaya paginaciya');
  return { total: result.length, page, limit, books: result.slice((page - 1) * limit, page * limit) };
}
