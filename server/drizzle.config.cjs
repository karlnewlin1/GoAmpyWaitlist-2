require('dotenv').config();
const path = require('path');

module.exports = {
  schema: path.join(__dirname, 'src', 'shared', 'schema.ts'),
  out: path.join(__dirname, 'drizzle'),
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL }
};