// server/drizzle.config.ts
import { fileURLToPath } from 'url';
import path from 'path';

// Resolve paths relative to this config file (not CWD)
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export default {
  schema: path.resolve(__dirname, './src/shared/schema.ts'),
  out:    path.resolve(__dirname, './drizzle'),
  dialect: 'postgresql',
  dbCredentials: {
    // Replit Secrets inject env at runtime; no dotenv needed
    url: process.env.DATABASE_URL ?? ''
  }
};
