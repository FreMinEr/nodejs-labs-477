const swaggerJsdoc = require('swagger-jsdoc');
function documentation(routes) {
  const paths = {};
  const user = { type: 'object', required: ['name', 'email', 'group_name'], properties: { name: { type: 'string', minLength: 2 }, email: { type: 'string', format: 'email' }, group_name: { type: 'string', example: '477' }, age: { type: 'integer', minimum: 16, maximum: 100 }, course: { type: 'integer', minimum: 1, maximum: 4 }, password: { type: 'string', format: 'password', minLength: 8 } } };
  for (const route of routes) {
    const pathname = route.path.replace(/:([^/]+)/g, '{$1}'); paths[pathname] ||= {};
    const parameters = [...pathname.matchAll(/\{([^}]+)\}/g)].map(match => ({ name: match[1], in: 'path', required: true, schema: { type: 'string' } }));
    if (route.method === 'get' && pathname === '/api/users') for (const name of ['page', 'limit', 'sort', 'group_name', 'course', 'age_min', 'age_max', 'search']) parameters.push({ name, in: 'query', schema: { type: 'string' } });
    if (pathname.endsWith('/search')) parameters.push({ name: 'q', in: 'query', schema: { type: 'string' } });
    let schema = user;
    if (pathname.endsWith('/login')) schema = { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string' } } };
    if (/refresh|logout/.test(pathname)) schema = { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } };
    if (pathname.endsWith('/register')) schema = { ...user, required: ['name', 'email', 'password'] };
    if (pathname.endsWith('/import')) schema = { type: 'array', items: user };
    const operation = { summary: `${route.method.toUpperCase()} ${pathname}`, parameters, responses: { 200: { description: 'Uspeshnyi otvet' }, 201: { description: 'Sozdano' }, 400: { description: 'Oshibka validacii' }, 401: { description: 'Trebuetsya token' }, 403: { description: 'Nedostatochno prav' }, 404: { description: 'Ne naideno' }, 409: { description: 'Email uzhe sushchestvuet' } } };
    if (route.protected) operation.security = [{ bearerAuth: [] }];
    if (['post', 'put'].includes(route.method)) operation.requestBody = { required: true, content: { 'application/json': { schema } } };
    if (pathname.endsWith('/avatar')) operation.requestBody = { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { avatar: { type: 'string', format: 'binary' } } } } } };
    paths[pathname][route.method] = operation;
  }
  return swaggerJsdoc({ definition: { openapi: '3.0.3', info: { title: 'Lab 24 Users API', version: '1.0.0', description: 'Parfenok Ivan Nikolaevich, gruppa 477' }, components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }, schemas: { User: user } }, paths }, apis: [] });
}
module.exports = { documentation };

