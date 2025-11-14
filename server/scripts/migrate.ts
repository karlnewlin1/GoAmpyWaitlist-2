import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL missing');
  
  const sql = postgres(url, { ssl: 'require', max: 1 /* if pooler: add prepare:false */});
  
  // Manual schema creation SQL
  const migrationSQL = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email ON users(email);
    
    -- Waitlist entries table
    CREATE TABLE IF NOT EXISTS waitlist_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      source TEXT DEFAULT 'direct',
      referrer_user_id UUID,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ux_waitlist_user ON waitlist_entries(user_id);
    
    -- Referral codes table
    CREATE TABLE IF NOT EXISTS referral_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      code TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ux_referral_user ON referral_codes(user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS ux_referral_code ON referral_codes(code);
    
    -- Referral events table
    CREATE TABLE IF NOT EXISTS referral_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      referral_code_id UUID NOT NULL,
      type TEXT NOT NULL,
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Events table
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      event_name TEXT NOT NULL,
      payload JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  
  try {
    console.log('Applying migrations...');
    await sql.unsafe(migrationSQL);
    console.log('Migrations applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});