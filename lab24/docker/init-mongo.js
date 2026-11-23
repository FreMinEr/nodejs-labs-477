db = db.getSiblingDB('lab24');
db.createUser({ user: 'student', pwd: process.env.MONGO_APP_PASSWORD, roles: [{ role: 'readWrite', db: 'lab24' }] });
